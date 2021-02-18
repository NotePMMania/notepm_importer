#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';
import QiitaTeam from './qiita/';
import NotePM, {Note, Folder, Page, Tag, Comment} from './note_pm/';
import Attachment from './note_pm/attachment';
import { fstat } from 'fs';
import { promisify } from 'util';
import User from './note_pm/user';

const dir = process.argv[process.argv.length - 1];

program
  .version('0.0.1')
  .option('-d, --domain [domain]', 'Qiita::Teamのドメインを指定してください')
  .option('-p, --path [dir]', 'エクスポートしたZipファイルを展開したフォルダへのパスを指定してください')
  .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
  .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
  .parse();

const options = program.opts();

const createImportNote = async () => {
  const note = new Note({
    name: 'Qiita::Teamからのインポート用',
    description: 'Qiita::Teamからインポートしたページが入ります',
    scope: 'private',
  });
  await note.save();
  return note;
}

const executeProject = async (q: QiitaTeam) => {
  const note = new Note({
    name: 'プロジェクト',
    description: 'プロジェクトから取り込んだノートです',
    scope: 'private',
  });
  await note.save();

  // プロジェクトページのアップロード
  const promises: Promise<Page>[] = [];
  q.projects.forEach(p => {
    const page = new Page(p.toPage());
    page.note_code = note.note_code;
    if (p.user) {
      page.user = p.user.id;
    }
    promises.push(page.save());
  });
  const pages = await Promise.all(promises);

  // 画像添付の反映
  pages.forEach(async page => {
    if (!page.hasImage()) return;
    await page.updateImageBody(q);
  });
}


const prepareTag = async (n: NotePM, q: QiitaTeam) => {
  await n.getTags();
  const names =  Array.from(new Set(q.articles.map(a => a.tags?.map(a => a.name)).flat()));
  const tagNames: string[] = [];
  names.forEach(t => {
    const bol = n.tags.filter(tag => tag.name == t)[0];
    if (!bol) {
      tagNames.push(t!);
    }
  });
  if (tagNames.length === 0) return;
  const tags = await Promise.all(tagNames.map(async name => {
    const t = new Tag({
      name: name!
    });
    await t.save();
    return t;
  }));
  tags.forEach(t => n.tags.push(t));
}

(async (options) => {
  const str = await promisify(fs.readFile)(options.userYaml, 'utf-8');
  const config = await yaml.load(str) as Config;
  const q = new QiitaTeam(options.domain, options.path);
  const n = new NotePM(options.accessToken, options.team);
  await q.load();
  // ブラウザを立ち上げて画像をダウンロード
  /*
  await q.open();
  console.log(q.getImage());
  await q.downloadImage();
  // await q.downloadAttachment();
  q.close();
  */

  await n.getUsers();
  config.users.forEach(u => {
    n.users.push(new User({
      user_code: u.user_code,
      name: u.id,
    }));  
  });

  // タグを準備
  await prepareTag(n, q);
  const baseNote = await createImportNote();
  // プロジェクト記事の取り込み
  if (q.projects) executeProject(q);

  // グループごとにノートを作成
  const groups = await Promise.all(q.groups.map(async g => {
    const note = new Note({
      name: g.name,
      description: 'Qiita::Teamからのインポート',
      scope: 'private'
    });
    g.users?.forEach(u => {
      const user = n.findUser(u.id);
      if (user) {
        note.users?.push(user!);
      }
    });
    await note.save();
    return note;
  }));
  const pages = await Promise.all(q.articles.map(async a => {
    const page = new Page({
      title: a.title,
      body: a.body,
      memo: 'Qiita::Teamからインポートしました',
    });

    if (a.group) {
      page.note_code = groups.filter(g => g.name === a.group?.name)[0].note_code;
    } else {
      page.note_code = baseNote.note_code;
    }
    if (a.tags) {
      a.tags.forEach(t => page.tags?.push(t.name));
    }
    if (a.user) {
      page.user = n.findUser(a.user.id);
    }
    await page.save();

    // コメントの反映
    if (a.comments?.length! > 0) {
      a.comments!.forEach(async c => {
        const comment = new Comment({
          page_code: page.page_code!,
          body: c.body
        });
        await comment.save();
        if (comment.images().length > 0) {
          await comment.updateImageBody(q, page);
        }
      });
    }
    return page;
  }));

  // 画像添付の反映
  await Promise.all(pages.map(async page => {
    if (!page.hasImage()) return;
    return await page.updateImageBody(q);
  }));
})(options);


