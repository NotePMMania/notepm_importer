import Tag from './tag';
import User from './user';
import NotePM from './index';
import fs from 'fs';
import crypto from 'crypto';
import QiitaTeam from '../qiita/index';
import Attachment from './attachment';

class Page {
  static NotePM: NotePM;

  public page_code: string | undefined = '';
  public note_code: string | undefined = '';
  public folder_id: number | undefined = undefined;
  public title = '';
  public body = '';
  public memo = '';
  public created_at: string | undefined = '';
  public updated_at: string | undefined = '';
  public created_by: User | null = null;
  public updated_by: User | null = null;
  public tags: (Tag | string)[] = [];
  public users: User[] = [];

  public user: string | null = null;

  constructor(params: notePM_Page) {
    this.setParams(params);
  }

  setParams(params: notePM_Page) {
    this.page_code = params.page_code;
    this.note_code = params.note_code;
    this.folder_id = params.folder_id;
    this.title = params.title;
    this.body = params.body;
    this.memo = params.memo;
    this.created_at = params.created_at;
    this.updated_at = params.updated_at;
    if (params.created_by) {
      this.created_by = new User(params.created_by);
    }
    if (params.updated_by) {
      this.updated_by = new User(params.updated_by);
    }
    if (params.tags) {
      params.tags.forEach(t => {
        if (this.tags.indexOf(t.name) > -1) return;
        this.tags.push(t.name);
      });
    }
    if (params.users) {
      params.users.forEach(u => this.users.push(new User(u)));
    }
  }

  async save(): Promise<Page> {
    if (this.page_code) {
      const params = await this.update();
      this.setParams(params);
    } else {
      const params = await this.create();
      this.setParams(params);
    }
    return this;
  }

  async create(): Promise<notePM_Page> {
    const response = await Page.NotePM.fetch('POST', `/pages`, {
      note_code: this.note_code,
      folder_id: this.folder_id,
      title: this.title,
      body: this.body,
      memo: this.memo,
      user: Page.NotePM.findUser(this.user) || 'NotePM-bot',
      tags: this.tags,
    });
    if (response.messages) throw new Error(`Error: ${response.messages.join(', ')} page_code ${this.page_code}`);
    return await response.page as notePM_Page;
  }


  async update(): Promise<notePM_Page> {
    const response = await Page.NotePM.fetch('PATCH', `/pages/${this.page_code}`, {
      note_code: this.note_code,
      folder_id: this.folder_id,
      title: this.title,
      body: this.body,
      memo: this.memo,
      tags: this.tags,
    });
    if (response.messages) throw new Error(`Error: ${response.messages.join(', ')} page_code ${this.page_code}`);
    return await response.page as notePM_Page;
  }

  hasImage(): boolean {
    const images = this.images();
    return images.length > 0;
  }

  images(): string[] {
    const ary = this.body.replace(/.*?!\[.*?\]\((.*?)\).*?/gs, "$1\n").split(/\n/);
    const ary2 = this.body.replace(/.*?<img .*?src="(.*?)".*?>.*?/gs, "$1\n").split(/\n/);
    return ary.concat(ary2).filter(s => s.match(/^http.?:\/\//));
  }

  async findOrCreate(note: notePM_Note, title: string, body: string, memo: string, tags: string[], folder?: notePM_Folder) {
    const response1 = await Page.NotePM.fetch('GET', `/pages`) as {
      pages: notePM_Page[]
    };
    const page = response1.pages.filter((page: notePM_Page) => page.title === title)[0];
    if (page) return page;
  }

  async updateImageBody(q: QiitaTeam): Promise<void> {
    const images = this.images();
    const urls: notePM_UploadImage[] = [];
    for (const url of images) {
      const filePath = q.filePath(url);
      const fileName = url.replace(/^.*\/(.*)(\?|$)/, "$1");
      const attachment = await Attachment.add(this, fileName, filePath);
      urls.push({
        url,
        download_url: `https://${Page.NotePM.domain}.notepm.jp/private/${attachment.file_id}?ref=thumb`
      });
    }
    urls.forEach(params => {
      const r = new RegExp(params.url, 'gs');
      this.body = this.body.replace(r, params.download_url);
    });
    await this.save();
  }
}

export default Page;
