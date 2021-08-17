#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import NotePM, {Note, Folder, Page, Tag, Comment, Attachment, User} from './note_pm/';
import { promisify } from 'util';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';
import * as turndownPluginGfm from 'turndown-plugin-gfm';
const tables = turndownPluginGfm.tables
const turndown = new TurndownService();
turndown.use(tables);

const dir = process.argv[process.argv.length - 1];
program
  .version('0.0.1')
  .option('-p, --path [dir]', 'Google Site(v1)のエクスポートしたファイルのパスを指定してください')
  .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
  .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
  .parse();

const options = program.opts();

const generateTree = async (baseDir: string, dir: string, base: string = '') => {
  const files = await promisify(fs.readdir)(`${base}${dir}`);
  if (!files) return null;
  const ary = [];
  for (const file of files) {
    if (file.match(/^\./)) continue;
    const filePath = `${base}${dir}${file}`;
    const stat = await promisify(fs.lstat)(filePath);
    if (stat.isDirectory()){
      const obj = {
        name: filePath.replace(`${base}${dir}`, ''),
        url: filePath.replace(`${base}${dir}`, ''),
        content: '',
        child: null,
      };
      const child = await generateTree(baseDir, `${file}/`, `${base}${dir}`);
      if (child.length > 0) {
        obj.child = child;
        ary.push(obj);
      }
    } else {
      if (!file.match(/\.html$/)) continue;
      const content = await promisify(fs.readFile)(filePath, 'utf-8');
      const { document } = (new JSDOM(content)).window;
      const obj = {
        name: document.querySelector('#sites-page-title').textContent.trim(),
        id: filePath.replace(`${base}${dir}`, '').replace(/\.html$/, ''),
        url: filePath.replace(`${base}${dir}`, ''),
        content: turndown.turndown(document.querySelector('#sites-canvas-main').innerHTML)
      };
      const attachments = document.querySelectorAll('.sites-attachments-name a');
      obj.attachments = [];
      for (const attachment of attachments) {
        obj.attachments.push({
          name: attachment.getAttribute('href').replace(/.*\//, ''),
          path: attachment.getAttribute('href')
        });
      }
      const comments = document.querySelectorAll('.comment');
      obj.comments = [];
      for (const comment of comments) {
        const username = comment.querySelector('.user-name').textContent;
        const body = comment.querySelector('.comment-content').textContent;
        const date = new Date(comment.querySelector('.created-date').textContent);
        obj.comments.push({
          username, body, date
        });
        const replies = comment.querySelectorAll('.reply-box');
        if (replies.length > 0) {
          for (const reply of replies) {
            const username = reply.querySelector('.user-name').textContent;
            const body = reply.querySelector('.comment-content').textContent;
            const date = new Date(reply.querySelector('.created-date').textContent);
            obj.comments.push({
              username, body, date
            });
          }
        }
      }
      ary.push(obj);
    }
  }
  return ary;
}

const getFolderName = (name: string, ary: any[]): string => {
  return ary.filter(a => a.id === name)[0].name;
}

const generatePage = async (dir: string, config, note: Note, ary: any[], folder?: Folder) => {
  for (const params of ary) {
    let f;
    if (params.child) {
      // フォルダを作る
      const folderName = getFolderName(params.name, ary);
      console.log(`フォルダを作成します ${folderName}`);
      f = new Folder({
        parent_folder_id: folder ? folder.folder_id : null,
        name: folderName,
      });
      await f.save(note);
      generatePage(`${dir}${params.name}/`, config, note, params.child, f);
    } else {
      console.log(`ページを作成します ${params.name}`);
      const page = new Page({
        note_code: note.note_code,
        title: params.name,
        body: '',
        memo: '',
        folder_id: folder ? folder.folder_id : undefined,
      });
      await page.save();
      await uploadAttachment(dir, page, params.content);

      // 単純な添付ファイル
      if (params.attachments.length > 0) {
        console.log(`  添付ファイルを${params.name}にアップロードします`);
        for (const attachment of params.attachments) {
          const name = decodeURIComponent(attachment.path);
          console.log(`    添付ファイル（${name}）をアップロードします`);
          const localPath = `${dir}${name}`;
          try {
            await Attachment.add(page, name, localPath);
            console.log(`    添付ファイル（${name}）をアップロードしました`);
          } catch (e) {
            console.log(`    添付ファイル（${name}）をアップロードできませんでした`);
          }
        }
        console.log('  添付ファイルをアップロードしました');
      }
      if (params.comments.length > 0) {
        console.log(`  ${params.name}にコメントを投稿します`);
        for (const c of params.comments) {
          const comment = new Comment({
            page_code: page.page_code!,
            body: c.body,
            user: c.username,
            created_at: c.date
          });
          try {
            await comment.save();
            console.log(`    コメントを投稿しました`);
          } catch (e) {
            console.log(`    コメントの投稿に失敗しました ${e.message}`);
          }
        }
        console.log(`  ${params.name}にコメントを投稿しました`);
      }
    }
  }
}

const uploadAttachment = async (dir: string, page: Page, body: string) => {
  const { document } = (new JSDOM(body)).window;
  const dom = document.querySelectorAll('img');
  const images = [];
  for (const img of dom) {
    const src = img.getAttribute('src');
    if (!src.match(/^http/)) {
      images.push(src);
    }
  }
  
  page.body = body;
  if (images.length > 0) {
    console.log(`  画像をアップロードします`);
    for (const source of images) {
      console.log(`    ファイル名 ${source}`);
      const localPath = `${dir}${source}`;
      const attachment = await Attachment.add(page, source, localPath);
      const url = attachment.download_url.replace(/https:\/\/(.*?)\.notepm\.jp\/api\/v1\/attachments\/download\//, "https://$1.notepm.jp/private/");
      const r = new RegExp(source, 'g');
      page.body = page.body.replace(r, url);
    }
    console.log(`  画像アップロード完了しました`);
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

  const indexPath = `${dir}home.html`;
  const indexContent = await promisify(fs.readFile)(indexPath, 'utf-8');
  const { document } = (new JSDOM(indexContent)).window;
  const noteName = document.querySelector('#sites-chrome-userheader-title').textContent;
  const ary = await generateTree(dir, dir);
  const note = new Note({
    name: noteName,
    description: 'Google Siteからインポートしたノート',
    scope: 'private',
  });
  await note.save();
  try {
    await generatePage(dir, config, note, ary);
  } catch (e) {
    // エラー
    console.log('エラーが出たのでノートを削除します')
    await note.delete();
  }
})(options);
