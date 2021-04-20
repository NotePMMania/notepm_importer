import NotePM from './index';
import Attachment from './attachment';
import Page from './page';
import QiitaTeam from '../qiita/index';
import dayjs from 'dayjs';

class Comment {
  static NotePM: NotePM;
  public page_code = '';
  public body = '';
  public user = '';
  public created_at = '';
  public comment_number: number | null = null;

  constructor(params: notePM_Comment) {
    this.setParams(params);
  }

  setParams(params: notePM_Comment) {
    this.page_code = params.page_code;
    this.body = params.body;
    this.user = params.user as string;
    this.created_at = params.created_at as string;
    if (params.comment_number) {
      this.comment_number = params.comment_number;
    }
  }

  images(): string[] {
    const ary = this.body.replace(/.*?!\[.*?\]\((.*?)\).*?/gs, "$1\n").split(/\n/);
    const ary2 = this.body.replace(/.*?<img .*?src=("|')(.*?)("|').*?>.*?/gs, "$2\n").split(/\n/);
    return ary.concat(ary2).filter(s => s.match(/^(http.?:\/\/|\.\.)/));
  }

  async save(): Promise<Comment> {
    if (this.comment_number) {
      await this.update();
    } else {
      await this.create();
    }
  }

  async create(): Promise<Comment> {
    const user = Comment.NotePM.findUser(this.user);
    const response = await Comment.NotePM.fetch('POST', `/pages/${this.page_code}/comments`, {
      body: this.body,
      created_at: dayjs(this.created_at).format('YYYY-MM-DDTHH:mm:ssZ'),
      user
    });
    const params = response.comment as notePM_Comment;
    this.setParams(params);
    return this;
  }

  async update(): Promise<Comment> {
    const response = await Comment.NotePM.fetch('PATCH', `/pages/${this.page_code}/comments/${this.comment_number}`, {
      body: this.body
    });
    const params = response.comment as notePM_Comment;
    if (params) {
      this.setParams(params);
    }
    return this;
  }

  async updateImageBody(q: QiitaTeam | null, page: Page, dir = ''): Promise<void> {
    const images = this.images();
    const urls: notePM_UploadImage[] = [];
    for (const url of images) {
      const filePath = q ? q.filePath(url) : `${dir}${url}`;
      const fileName = url.replace(/^.*\/(.*)(\?|$)/, "$1");
      const attachment = await Attachment.add(page, fileName, filePath);
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

export default Comment;
