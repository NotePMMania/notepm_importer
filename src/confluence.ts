#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import NotePM, {Note, Folder, Page, Tag, Comment, Attachment, User} from './note_pm/';
import { promisify } from 'util';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
const turndown = new TurndownService();

const dir = process.argv[process.argv.length - 1];
program
  .version('0.0.1')
  .option('-p, --path [dir]', 'Confluenceのエクスポートしたファイルのパスを指定してください')
  .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
  .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
  .parse();

const options = program.opts();

const generateTree = async (dir: string, li: HTMLUListElement) => {
  const uls = li.querySelectorAll(`:scope > ul`);
  if (!uls) return null;
  const ary = [];
  for (const ul of uls) {
    if (ul.parentElement !== li) continue;
    const { document } = (new JSDOM(ul.outerHTML)).window;
    const lis = document.querySelectorAll('ul:first-child > li');
    for (const li of lis) {
      if (li.parentElement.outerHTML !== ul.outerHTML) continue;
      const obj = {
        name: li.querySelector('a').textContent,
        url: li.querySelector('a').getAttribute('href'),
        child: null
      };
      if (obj.url) {
        const content = await promisify(fs.readFile)(`${dir}${obj.url}`, 'utf-8');
        const { document } = (new JSDOM(content)).window;
        const main = document.querySelector('#main-content');
        obj.author = document.querySelector('.author').textContent.trim();
        obj.content = await saveLocal(dir, turndown.turndown(main.innerHTML));
      }
      const { document } = (new JSDOM(li.outerHTML)).window;
      if (document.querySelectorAll('ul')) {
        obj.child = await generateTree(dir, li);
      }
      ary.push(obj);
    }
  }
  return ary;
}

const saveLocal = async (dir, str: string) => {
  const match = str.match(/!\[\]\(data:(.*?)\)/mg)
  if (!match) return str;
  for (const source of match) {
    const src = source.replace('![](', '').replace(/\)$/, '');
    const type = src.split(',')[0].replace(/data:(.*);.*/, "$1");
    const ext = type.split('/')[1];
    const data = src.split(',')[1];
    const localFileName = `${(new Date).getTime()}.${ext}`;
    const localPath = `${dir}attachments/${localFileName}`;
    await promisify(fs.writeFile)(localPath, data, 'base64');
    str = str.replace(src, `attachments/${localFileName}`);
  }
  return str;
}

const generatePage = async (dir: string, config, note: Note, ary: any[], folder?: Folder) {
  for (const params of ary) {
    let f;
    if (params.child.length > 0) {
      // フォルダを作る
      f = new Folder({
        parent_folder_id: folder ? folder.folder_id : null,
        name: params.name,
      });
      await f.save(note);
    }
    const page = new Page({
      note_code: note.note_code,
      title: params.name,
      body: '',
      memo: '',
      folder_id: f ? f.folder_id : (folder ? folder.folder_id : undefined),
    });
    const u = config.users.filter(u => u.id === params.author)[0];
    if (u) {
      page.user = u.user_code;
    }
    await page.save();
    await uploadAttachment(dir, page, params.content);
    if (params.child.length > 0) {
      generatePage(dir, config, note, params.child, f);
    }
  }
}

const uploadAttachment = async (dir: string, page: Page, body: string) => {
  const match = body.match(/!\[\]\((.*?)\)/mg);
  page.body = body;
  if (!match) {
    await page.save();
    return;
  }
  for (const source of match) {
    const src = source.replace('![](', '').replace(/\)$/, '').replace(/\?.*$/, '');
    const localFileName = path.basename(src);
    const localPath = `${dir}${src}`;
    const attachment = await Attachment.add(page, localFileName, localPath);
    const url = attachment.download_url.replace(/https:\/\/(.*?)\.notepm\.jp\/api\/v1\/attachments\/download\//, "https://$1.notepm.jp/private/");
    page.body = page.body.replace(src, url);
  }
  await page.save();
}

(async (options) => {
  const n = new NotePM(options.accessToken, options.team);
  const dir = options.path.match(/.*\/$/) ? options.path : `${options.path}/`;
  let config;
  if (!options.userYaml) {
    config = {users: []};
  } else {
    const str = await promisify(fs.readFile)(options.userYaml, 'utf-8');
    config = await yaml.load(str) as Config;
    config.users.forEach(u => {
      n.users.push(new User({
        user_code: u.user_code,
        name: u.id,
      }));  
    });
  }

  const indexPath = `${dir}index.html`;
  const indexContent = await promisify(fs.readFile)(indexPath, 'utf-8');
  const { document } = (new JSDOM(indexContent)).window;
  const list = document.querySelectorAll('.pageSection')[1];
  const ary = await generateTree(dir, list);
  const note = new Note({
    name: ary[0].name,
    description: 'Confluenceからインポートしたノート',
    scope: 'private',
  });
  await note.save();
  if (ary[0].content) {
    const page = new Page({
      note_code: note.note_code,
      title: ary[0].name,
      body: '',
      memo: '',
    });
    const u = config.users.filter(u => u.id === ary[0].author)[0];
    if (u) {
      page.user = u.user_code;
    }
    await page.save();
    uploadAttachment(dir, page, ary[0].content);
  }
  await generatePage(dir, config, note, ary[0].child);

  
  // childがない場合はページとして作成
  // childがある場合は、フォルダを作成
  // フォルダの中に「概要」ページを作成して、内容を記述
  // フォルダの中に子要素のページを作成
})(options);
