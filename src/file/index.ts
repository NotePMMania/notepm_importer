import puppeteer from 'puppeteer-core';
import locateChrome from 'locate-chrome';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';
import parseMD from 'parse-md';
import { debugPrint } from '../func';

class Esa {
  public domain = '';
  public dir = '';
  public browser: puppeteer.Browser | null = null;
  public files: {[s: string]: string} = {};

  constructor(domain: string, dir: string) {
    this.domain = domain;
    this.dir = dir;
  }

  async dirs(dir = ''): Promise<Esa_Dir[]> {
    dir = dir === '' ? this.dir : dir;
    if (!dir.match(/.*\/$/)) dir = `${dir}/`
    const res: Esa_Dir[] = [];
    const ary = await promisify(fs.readdir)(dir);
    for (const filePath of ary) {
      if (filePath.match(/^\./)) continue;
      const path = `${dir}${filePath}`;
      if (`${this.dir}/Templates` === path) continue;
      const file = await promisify(fs.stat)(path);
      if (!file.isDirectory()) continue;
      const subDir: Esa_Dir = {
        name: filePath.normalize('NFC'),
      };
      const child = await this.dirs(path);
      if (child) {
        subDir.dirs = child;
      }
      res.push(subDir);
    }
    return res;
  }

  async downloadImage() {
    await this.createDir();
    const images = this.getImage();
    const p: Promise<boolean>[] = [];
    images.forEach(image => {
      p.push(this.download(image));
    });
    await Promise.all(p);
  }

  getImage(): string[] {
    let images = this.articles.map(a => a.getImage()).flat();
    images = images.concat(this.projects.map(p => p.getImage()).flat());
    return images;
  }

  async createDir() {
    const fileDir = this.attachmentDir();
    try {
      await promisify(fs.stat)(fileDir);
    } catch {
      // No directory
      await promisify(fs.mkdir)(fileDir);
    }
  }

  attachmentDir(): string {
    return `${this.getDir()}/attachments`;
  }

  getDir(): string {
    if (this.dir.match(/.*\/$/)) {
      return this.dir;
    } else {
      return `${this.dir}/`;
    }
  }

  async loadFiles(dir = ''): Promise<{[s: string]: string}> {
    dir = dir === '' ? this.dir : dir;
    if (!dir.match(/.*\/$/)) dir = `${dir}/`
    const res: {[s: string]: string} = {};
    const ary = await promisify(fs.readdir)(dir);
    for (const filePath of ary) {
      if (filePath.match(/^\./)) continue;
      const path = `${dir}${filePath}`;
      if (`${this.dir}/Templates` === path) continue;
      const file = await promisify(fs.stat)(path);
      if (file.isDirectory()) {
        const files = await this.loadFiles(path);
        for (const key in files) {
          res[key] = files[key];
        }
      } else {
        const contents = await promisify(fs.readFile)(path, 'utf-8');
        res[path] = parseMD(contents);
      }
    }
    this.files = res;    
    return res;
  }

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
        return document.querySelector('.btn-new__label');
      },  { timeout: 0 });

      return true;
    } catch (e) {
      debugPrint(e);
      return false;
    }
  }

  async open() {
    await this.launchChrome();
  }

  close() {
    this.browser?.close();
  }

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

  async download(url: string): Promise<boolean> {
    const filePath = this.filePath(url);
    try {
      const bol = fs.statSync(filePath);
      return true;
    } catch (e) {}
    const buffer = await this.getBinary(url);
    await promisify(fs.writeFile)(filePath, buffer);
    return true;
  }

  filePath(url: string): string {
    const fileDir = this.attachmentDir();
    const hash = crypto.createHmac('sha256', 'notepm')
                   .update(url)
                   .digest('hex');
    return `${fileDir}/${hash}`;
  }

  async getBinary(url: string): Promise<Buffer> {
    const page = await this.browser!.newPage();
    let loadPromise = page.waitForNavigation();
    const bin = await page.goto(url);
    await loadPromise;
    return await bin.buffer();
  }  
}

export default Esa;