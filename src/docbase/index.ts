import fs from 'fs';
import { promisify } from 'util';

class Docbase {
  public dir = '';
  public contents = {};
  public groups = new Set();
  public dirs = [];
  public images = [];

  constructor(dir: string) {
    this.dir = dir;
  }

  async loadImageFile() {
    let dir = `${this.dir}/attachments/`;
    if (!dir.match(/.*\/$/)) dir = `${dir}/`;
    try {
      await promisify(fs.stat)(dir);
    } catch (e) {
      throw new Error(`ディレクトリ ${dir} が存在しません`);
    }
    const ary = await promisify(fs.readdir)(dir);
    for (const imagePath of ary) {
      if (imagePath.match(/^\./)) continue;
      this.images.push(imagePath);
    }
  }

  async loadFiles() {
    await this.loadImageFile();
    let dir = `${this.dir}/articles/`;
    if (!dir.match(/.*\/$/)) dir = `${dir}/`
    const ary = await promisify(fs.readdir)(dir);
    for (const filePath of ary) {
      if (filePath.match(/^\./)) continue;
      const path = `${dir}${filePath}`;
      const contents = await promisify(fs.readFile)(path, 'utf-8');
      const json = JSON.parse(contents);
      json.body = this.replaceContent(json.body);
      if (json.comments) {
        for (const key in json.comments) {
          json.comments[key].body = this.replaceContent(json.comments[key].body);
        }
      }
      this.contents[path.replace(`${this.dir}/articles/`, '')] = json;
      json.groups.forEach(g => {
        this.groups.add(g.name);
      });
    }
  }

  replaceContent(body) {
    this.images.forEach(fileName => {
      const name = fileName.replace(/.*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}.*)/, "$1");
      const re1 = new RegExp(`https://image.docbase.io/uploads/${name}`, 'g');
      body = body.replace(re1, `../attachments/${fileName}`);
      const re2 = new RegExp(`https://docbase.io/file_attachments/${name}`, 'g');
      body = body.replace(re2, `../attachments/${fileName}`);
    });
    body = body.replace(/!\[(.*?)\]\((.*?) =(W|[0-9]+)?x(H|[0-9]+)?\)\)/g, "![$1]($2)");
    return body;
  }
}

export default Docbase;