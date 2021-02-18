import NotePM from './index';
import Attachment from './attachment';
import Page from './page';
import QiitaTeam from '../qiita/index';

class Comment {
  static NotePM: NotePM;
  public page_code = '';
  public body = '';
  public comment_number: number | null = null;

  constructor(params: notePM_Comment) {
    this.setParams(params);
  }

  setParams(params: notePM_Comment) {
    this.page_code = params.page_code;
    this.body = params.body;
    if (params.comment_number) {
      this.comment_number = params.comment_number;
    }
  }

  images(): string[] {
    const ary = this.body.replace(/.*?!\[.*?\]\((.*?)\).*?/gs, "$1\n").split(/\n/);
    const ary2 = this.body.replace(/.*?<img .*?src="(.*?)".*?>.*?/gs, "$1\n").split(/\n/);
    return ary.concat(ary2).filter(s => s.match(/^http.?:\/\//));
  }

  async save(): Promise<Comment> {
    if (this.comment_number) {
      await this.update();
    } else {
      await this.create();
    }
  }

  async create(): Promise<Comment> {
    const response = await Comment.NotePM.fetch('POST', `/pages/${this.page_code}/comments`, {
      body: this.body
    });
    const params = response.comment as notePM_Comment;
    this.setParams(params);
    return this;
  }

  async update(): Promise<Comment> {
    console.log(`/pages/${this.page_code}/comments/${this.comment_number}`);
    const response = await Comment.NotePM.fetch('PATCH', `/pages/${this.page_code}/comments/${this.comment_number}`, {
      body: this.body
    });
    console.log(response);
    const params = response.comment as notePM_Comment;
    this.setParams(params);
    return this;
  }

  async updateImageBody(q: QiitaTeam, page: Page): Promise<void> {
    const images = this.images();
    const urls: notePM_UploadImage[] = await Promise.all(images.map(url => {
      return new Promise((res, rej) => {
        const filePath = q.filePath(url);
        const fileName = url.replace(/^.*\/(.*)(\?|$)/, "$1");
        Attachment.add(page, fileName, filePath)
          .then(attachment => {
            res({
              url,
              download_url: `https://${Comment.NotePM.domain}.notepm.jp/private/${attachment.file_id}?ref=thumb`
            });
          });
      });
    }));
    urls.forEach(params => {
      const r = new RegExp(params.url, 'gs');
      this.body = this.body.replace(r, params.download_url);
    });
    await this.save();
  }
}

export default Comment;
