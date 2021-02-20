import Folder from './folder';
import Page from './page';
import Tag from './tag';
import Note from './note';
import FormData from 'form-data';
import fetch from 'node-fetch';
import User from './user';
import Attachment from './attachment';
import Comment from './comment';

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
    this.tags = await Tag.fetchAll();
  }

  findUser(name: string): string | null {
    const user =  this.users.filter(u => u.name === name || u.user_code === name)[0];
    return user ? user.user_code : null;
  }

  async fetch(method: string, path: string, body?: object | string | FormData | null) {
    const headers: {[s: string]: string} = {
      'Authorization': `Bearer ${this.accessToken}`,
    }
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (method === 'GET') {
      const res = await fetch(`${this.url}${path}`, { headers });
      return await res.json();
    }
    if (method === 'POST') {
      if (!(body instanceof FormData)) {
        body = JSON.stringify(body);
      }
      const res = await fetch(`${this.url}${path}`, { method, headers, body });
      return await res.json();
    }
    if (method === 'PATCH') {
      if (!(body instanceof FormData)) {
        body = JSON.stringify(body);
      }
      const res = await fetch(`${this.url}${path}`, { method, headers, body });
      return await res.json();
    }
    if (method === 'DELETE') {
      const res = await fetch(`${this.url}${path}`, { method, headers });
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
