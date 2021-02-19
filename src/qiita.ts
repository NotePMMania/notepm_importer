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
  console.log('ブラウザを立ち上げます。Qiita Teamへログインしてください');
  await q.open();
  await q.downloadImage();
  // await q.downloadAttachment();
  q.close();
  console.log('画像をダウンロードしました');
  console.log('ユーザ一覧を読み込みます');
  await n.getUsers();
  config.users.forEach(u => {
    n.users.push(new User({
      user_code: u.user_code,
      name: u.id,
    }));  
  });
  console.log('ユーザ一覧の読み込み完了');

  // タグを準備
  console.log('タグを準備します');
  await prepareTag(n, q);
  console.log('グループがない記事を取り込む用のノートを準備します');
  const baseNote = await createImportNote();
  // プロジェクト記事の取り込み
  console.log('プロジェクト記事をインポートします');
  if (q.projects) executeProject(q);

  // グループごとにノートを作成
  console.log('グループのノートを作成します');
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
    console.log(`  ${g.name}を作成します`);
    await note.save();
    return note;
  }));

  console.log('ページを作成します');
  for (const a of q.articles) {
    const page = new Page({
      title: a.title,
      body: a.body,
      memo: 'Qiita::Teamからインポートしました',
    });
    console.log(`  タイトル：${page.title} `);
    if (a.group) {
      page.note_code = groups.filter(g => g.name === a.group?.name)[0].note_code;
    } else {
      page.note_code = baseNote.note_code;
    }
    console.log(`    ノートコードは${page.note_code}になります`);
    if (a.tags) {
      a.tags.forEach(t => page.tags?.push(t.name));
    }
    if (a.user) {
      page.user = n.findUser(a.user.id);
    }
    console.log(`    ノートを保存します`);
    await page.save();
    console.log(`    ノートを保存しました ${page.page_code}`);
    if (page.hasImage()) {
      console.log(`    画像があります。ページ内容を更新します`);
      await page.updateImageBody(q);
      console.log(`    画像のURLに合わせてページ内容を更新しました`);
    }

    // コメントの反映
    if (a.comments?.length! > 0) {
      if (!page.page_code) {
        // console.error(`データがありません： ${JSON.stringify(a)}`);
        console.log(`データがありません ${page.title} : ${a.title}`);
        return;
      }
      console.log(`  コメントがあります（ページコード： ${page.page_code}） ${page.title}`);
      a.comments!.forEach(async c => {
        const comment = new Comment({
          page_code: page.page_code!,
          body: c.body
        });
        console.log(`  コメントを保存します`);
        await comment.save();
        if (comment.images().length > 0) {
          console.log(`  コメントに画像があります。内容を更新します`);
          await comment.updateImageBody(q, page);
        }
      });
    }
  }
  console.log('インポート終了しました');
})(options);


