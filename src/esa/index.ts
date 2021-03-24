import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';
import parseMD from 'parse-md';

class Esa {
  public dir = '';
  public files: {[s: string]: string} = {};

  constructor(dir: string) {
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
      if (`${dir}Templates` === path) continue;
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
      if (`${dir}Templates` === path) continue;
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
}

export default Esa;