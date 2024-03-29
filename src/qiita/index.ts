// import puppeteer from 'puppeteer-core';
// import locateChrome from 'locate-chrome';
import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';
import Article from './article';
import Group from './group';
import Project from './project';
import axios from 'axios';
import { debugPrint } from '../func';

class QiitaTeam {
  public qiitaToken = '';
  public dir = '';
  public articles: Article[] = [];
  public groups: Group[] = [];
  public projects: Project[] = [];

  // public page: puppeteer.Page | null = null;
  // public browser: puppeteer.Browser | null = null;

  constructor(dir: string, qiitaToken: string) {
    this.qiitaToken = qiitaToken;
    this.dir = dir;
    Article.QiitaTeam = this;
    Project.QiitaTeam = this;
    Group.QiitaTeam = this;
  }

  sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }

  /*
  async launchChrome(): Promise<boolean> {
    try {
      // ブラウザ起動
      this.browser = await puppeteer.launch({
        headless: false,
        executablePath: await this.getChromePath(),
        ignoreDefaultArgs: ['--guest', '--disable-extensions','--start-fullscreen','--incognito',],
        slowMo:150,
      });

      const page = await this.browser.newPage();
      const navigationPromise = page.waitForNavigation();

      await page.goto(this.getUrl());
      await page.setViewport({ width: 1200, height: 900 });
      await navigationPromise;

      // ログイン待ち
      await page.waitForFunction(() => {
        return document.querySelector('.sharedHeader_newItem_btn');
      },  { timeout: 0 });

      return true;
    } catch (e) {
      debugPrint(e);
      return false;
    }
  }
  */

  load() {
    const p: Promise<void>[] = [];
    p.push(this.loadArticles());
    p.push(this.loadGroups());
    p.push(this.loadProjects());
    return Promise.all(p);
  }

  async loadArticles(): Promise<void> {
    const dir = `${this.getDir()}articles`;
    const articles = await this.loadFile(dir);
    articles.forEach(a => this.articles.push(new Article(a)));
  }

  async loadGroups(): Promise<void> {
    const dir = `${this.getDir()}groups`;
    const groups = await this.loadFile(dir);
    groups.forEach(a => this.groups.push(new Group(a)));
  }

  async loadProjects(): Promise<void> {
    const dir = `${this.getDir()}projects`;
    const projects = await this.loadFile(dir);
    projects.forEach(a => this.projects.push(new Project(a)));
  }

  async loadFile(dir: string) {
    const ary = await promisify(fs.readdir)(dir);
    const promises: Promise<any>[] = [];
    ary.forEach((fileName: string) => {
      if (fileName.match(/.*\.json$/)) {
        promises.push(promisify(fs.readFile)(`${dir}/${fileName}`, 'utf-8'));
      }
    });
    const res = await Promise.all(promises);
    return res.map(str => JSON.parse(str));
  }

  getDir(): string {
    if (this.dir.match(/.*\/$/)) {
      return this.dir;
    } else {
      return `${this.dir}/`;
    }
  }

  /*
  getUrl(): string {
    if (this.domain.match(/https:\/\//)) {
      return this.domain;
    } else {
      return `https://${this.domain}`;
    }
  }
  
  async getChromePath(): Promise<string> {
    return await locateChrome();
  }
  */

  getImage(): string[] {
    let images = this.articles.map(a => a.getImage()).flat();
    images = images.concat(this.projects.map(p => p.getImage()).flat());
    return images;
  }

  getAttachment(): string[] {
    let attachments = this.articles.map(a => a.getAttachment()).flat();
    attachments = attachments.concat(this.projects.map(p => p.getAttachment()).flat());
    return attachments;
  }

  regexpImage(str: string): string[] {
    const ary = str.replace(/.*?<img .*?src="(.*?)".*?>/gs, "$1\n").split(/\n/);
    return ary.filter(s => s.match(/^https?:\/\//));
  }

  regexpAttachment(str: string): string[] {
    const ary = str.replace(/.*<a .*?href="(https:\/\/.*?\.qiita.com\/files\/.*?\?dl=1)".*/ms, "$1\n").split(/\n/);
    return ary.filter(s => s.match(/^https:\/\//));
  }

  async upload(page: Project | Article) {

  }

  async downloadAttachment() {
    await this.createDir();
    const files = this.getAttachment();
    const p: Promise<boolean>[] = [];
    for (const file of files) {
      await this.sleep(300);
      p.push(this.download(file));
    };
    await Promise.all(p);
    debugPrint(`添付ファイルのダウンロードが完了しました`);
  }
  /*
  async open() {
    await this.launchChrome();
  }
  */

  async createDir() {
    const fileDir = this.attachmentDir();
    try {
      await promisify(fs.stat)(fileDir);
    } catch {
      // No directory
      await promisify(fs.mkdir)(fileDir);
    }
  }

  async downloadImage() {
    await this.createDir();
    const images = this.getImage();
    const p: Promise<boolean>[] = [];
    for (const image of images) {
      await this.sleep(300);
      p.push(this.download(image));
    }
    await Promise.all(p);
    debugPrint(`画像のダウンロードが完了しました`);
  }
  /*
  close() {
    return this.browser?.close();
  }
  */

  attachmentDir(): string {
    return `${this.getDir()}/attachments`;
  }

  filePath(url: string): string {
    const fileDir = this.attachmentDir();
    const hash = crypto.createHmac('sha256', 'notepm')
      .update(url)
      .digest('hex');
    return `${fileDir}/${hash}`;
  }

  async download(url: string): Promise<boolean> {
    const filePath = this.filePath(url);
    try {
      const bol = fs.statSync(filePath);
      return true;
    } catch (e) {}
    try {
      const buffer = await this.getBinary(url);
      await promisify(fs.writeFile)(filePath, Buffer.from(buffer.data));
    } catch (e) {
      debugPrint(`  ダウンロード失敗しました ${url}`);
    }
    return true;
  }

  async getBinary(url: string): Promise<Buffer> {
    debugPrint(`  ダウンロードするURL： ${url}`);
    const headers = {};
    if (url.match(/https?:\/\/.*?\.qiita\.com\//)) {
      headers['Authorization'] = `Bearer ${this.qiitaToken}`;
    }
    return axios.get(url, {
      responseType: 'arraybuffer',
      headers
    });
  }
}

export default QiitaTeam;
