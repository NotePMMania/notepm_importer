import fs from 'fs';
import { promisify } from 'util';
import parseMD from 'parse-md'

class Kibela {
  public dir = '';
  public contents = {};
  public groups = new Set();
  public dirs = [];

  constructor(dir: string) {
    this.dir = dir;
  }

  async load() {

  }

  async loadFiles(dir = '') {
    dir = dir === '' ? `${this.dir}/notes` : dir;
    if (!dir.match(/.*\/$/)) dir = `${dir}/`
    const ary = await promisify(fs.readdir)(dir);
    const res = [];
    for (const filePath of ary) {
      if (filePath.match(/^\./)) continue;
      const path = `${dir}${filePath}`;
      const file = await promisify(fs.stat)(path);
      if (file.isDirectory()) {
        const dir = {
          name: filePath,
          dirs: [],
        };
        dir.dirs = await this.loadFiles(path);
        res.push(dir);
      } else {
        const contents = await promisify(fs.readFile)(path, 'utf-8');
        const json = parseMD(contents);
        this.contents[path.replace(`${this.dir}/notes/`, '')] = json;
        json.metadata.groups.forEach(g => {
          this.groups.add(g);
        });
      }
    }
    this.dirs = res;
    return res;
  }
}

export default Kibela;
