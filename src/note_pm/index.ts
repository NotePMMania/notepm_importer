import Folder from './folder';
import Page from './page';
import Tag from './tag';
import Note from './note';
import FormData from 'form-data';
import fetch from 'node-fetch-with-proxy';
import User from './user';
import Attachment from './attachment';
import Comment from './comment';
import { debugPrint } from '../func';

const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

class NotePM {
  public accessToken = '';
  public domain = '';
  public url = '';
  public tags: Tag[] = [];
  public users: User[] = [];

  constructor(accessToken: string, domain: string) {
    this.accessToken = accessToken;
    this.domain = domain;
    this.url = `https://${this.domain}.notepm.jp/api/v1`;

    Folder.NotePM = this;
    Page.NotePM = this;
    Tag.NotePM = this;
    Note.NotePM = this;
    User.NotePM = this;
    Attachment.NotePM = this;
    Comment.NotePM = this;
  }

  async getUsers(): Promise<void> {
    this.users = await User.fetchAll();
  }

  async getTags(): Promise<void> {
    debugPrint(`  NotePMからタグを取得します`);
    this.tags = await Tag.fetchAll();
    debugPrint(`  NotePMよりタグを取得しました`);
  }

  findUser(name: string): string | null {
    const user =  this.users.filter(u => u.name === name || u.user_code === name)[0];
    debugPrint(` findUser(${name}) => ${user ? user.user_code : null}`);
    return user ? user.user_code : null;
  }

  async fetch(method: string, path: string, body?: object | string | FormData | null) {
    const headers: {[s: string]: string} = {
      'Authorization': `Bearer ${this.accessToken}`,
    }
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    await sleep(1000);
    const url = `${this.url}${path}`;
    debugPrint(`${method}: ${url}`);
    debugPrint(`  body: ${JSON.stringify(body)}`);
    if (method === 'GET') {
      const res = await fetch(url, { headers });
      return await res.json();
    }
    if (method === 'POST') {
      if (!(body instanceof FormData)) {
        body = JSON.stringify(body);
      }
      const res = await fetch(url, { method, headers, body });
      return await res.json();
    }
    if (method === 'PATCH') {
      if (!(body instanceof FormData)) {
        body = JSON.stringify(body);
      }
      const res = await fetch(url, { method, headers, body });
      return await res.json();
    }
    if (method === 'DELETE') {
      const res = await fetch(url, { method, headers });
      const text = await res.text();
      if (text === '') return {};
    }
  }


}

export default NotePM;

export {
  Folder,
  Page,
  Tag,
  Note,
  User,
  Comment,
  Attachment
};
