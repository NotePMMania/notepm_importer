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
import { debugPrint } from './func';

const dir = process.argv[process.argv.length - 1];

program
  .version('0.0.1')
  // .option('-d, --domain [domain]', 'Qiita::Teamのドメインを指定してください')
  .option('-q --qiita [token]', 'Qiita::Teamへのアクセストークンを指定してください')
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

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const prepareTag = async (n: NotePM, q: QiitaTeam) => {
  debugPrint(`  タグを取得します`);
  try {
    await n.getTags();
  } catch (e) {
    debugPrint(`  タグの取得に失敗しました。終了します。`);
    process.exit(1);
  }
  debugPrint(`  Qiita記事からのタグを取得します`);
  const names =  Array.from(new Set(q.articles.map(a => a.tags?.map(a => a.name)).flat()));
  debugPrint(`  Qiita記事から${names.length}件のタグを取得しました`);
  const tagNames: string[] = [];
  debugPrint(`  未設定のタグがあるか確認します`);
  names.forEach(t => {
    const bol = n.tags.filter(tag => tag.name == t)[0];
    if (!bol) {
      tagNames.push(t!);
    }
  });
  debugPrint(`  未設定のタグは${tagNames.length}件です`);
  if (tagNames.length === 0) return;
  const tags: Tag[] = [];
  for (const name of tagNames) {
    debugPrint(`    タグ${name}を作成します`);
    const t = new Tag({
      name: name!
    });
    await t.save();
    debugPrint(`    タグ${name}を作成しました`);
    sleep(500);
    tags.push(t);
  }
  tags.forEach(t => n.tags.push(t));
  debugPrint(`  タグの準備完了です`);
}

(async (options) => {
  // if (!options.domain || !options.domain.match(/.*\.qiita\.com/) ) throw new Error('Qiitaのドメインが指定されていない、または qiita.com で終わっていません');
  if (!options.path) {
    debugPrint(`取り込み対象のディレクトリが指定されていません（-p または --path）`);
    process.exit(1);
  }
  if (!options.qiita) {
    debugPrint(`Qiita Teamのアクセストークンが指定されていません（-q または --qiita）`);
    process.exit(1);
  }
  if (!options.accessToken) {
    debugPrint(`NotePMのアクセストークンが指定されていません（-a または --access-token）`);
    process.exit(1);
  }
  if (!options.team) {
    debugPrint(`NotePMのドメインが指定されていません（-t または --team）`);
    process.exit(1);
  }
  if (!options.userYaml) {
    debugPrint(`ユーザー設定用YAMLファイルが指定されていません（-u または --user-yaml）`);
    process.exit(1);
  }
  debugPrint(`取り込み対象ディレクトリ： ${options.path}`);
  debugPrint(`Qiita Teamへのアクセストークン： ${options.qiita}`);
  debugPrint(`NotePMのアクセストークン： ${options.accessToken}`);
  debugPrint(`NotePMのドメイン： ${options.team}.notepm.jp`);
  debugPrint(`ユーザー設定用YAMLファイル： ${options.userYaml}`);
  const str = await promisify(fs.readFile)(options.userYaml, 'utf-8');
  const config = await yaml.load(str) as Config;
  const q = new QiitaTeam(options.path, options.qiita);
  const n = new NotePM(options.accessToken, options.team);
  await q.load();
  // ブラウザを立ち上げて画像をダウンロード
  // debugPrint('ブラウザを立ち上げます。Qiita Teamへログインしてください');
  // await q.open();
  debugPrint('画像をダウンロードします');
  await q.downloadImage();
  await q.downloadAttachment();
  // await q.close();
  debugPrint('画像をダウンロードしました');
  debugPrint('ユーザ一覧を読み込みます');
  await n.getUsers();
  config.users.forEach(u => {
    n.users.push(new User({
      user_code: u.user_code,
      name: u.id,
    }));  
  });
  debugPrint('ユーザ一覧の読み込み完了');

  // タグを準備
  debugPrint('タグを準備します');
  await prepareTag(n, q);
  debugPrint('グループがない記事を取り込む用のノートを準備します');
  const baseNote = await createImportNote();
  // プロジェクト記事の取り込み
  debugPrint('プロジェクト記事をインポートします');
  if (q.projects) executeProject(q);

  // グループごとにノートを作成
  debugPrint('グループのノートを作成します');
  const groups: Note[] = [];
  for (const g of q.groups) {
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
    debugPrint(`  ${g.name}を作成します`);
    await note.save();
    debugPrint(`  ${g.name}を作成しました`);
    groups.push(note);
  }
  debugPrint('グループのノートを作成しました');

  debugPrint('ページを作成します');
  for (const a of q.articles) {
    const page = new Page({
      title: a.title,
      body: a.body,
      created_at: new Date(a.created_at),
      memo: 'Qiita::Teamからインポートしました',
    });
    debugPrint(`  タイトル：${page.title} `);
    if (a.group) {
      page.note_code = groups.filter(g => g.name === a.group?.name)[0].note_code;
    } else {
      page.note_code = baseNote.note_code;
    }
    debugPrint(`    ノートコードは${page.note_code}になります`);
    if (a.tags) {
      a.tags.forEach(t => page.tags?.push(t.name));
    }
    if (a.user) {
      page.user = a.user.id;
    }
    debugPrint(`    ノートを保存します`);
    await page.save();
    debugPrint(`    ノートを保存しました ${page.page_code}`);
    if (page.hasImage()) {
      debugPrint(`    画像があります。ページ内容を更新します`);
      await page.updateImageBody(q);
      debugPrint(`    画像のURLに合わせてページ内容を更新しました`);
    }

    // コメントの反映
    if (a.comments?.length! > 0) {
      if (!page.page_code) {
        // debugPrint(`データがありません： ${JSON.stringify(a)}`);
        debugPrint(`データがありません ${page.title} : ${a.title}`);
        return;
      }
      debugPrint(`  コメントが${a.comments?.length}件あります（ページコード： ${page.page_code}） ${page.title}`);
      for (const c of a.comments!) {
        const comment = new Comment({
          page_code: page.page_code!,
          created_at: c.created_at,
          user: c.user?.id,
          body: c.body
        });
        debugPrint(`  コメントを保存します`);
        await comment.save();
        if (comment.images().length > 0) {
          debugPrint(`  コメントに画像があります。内容を更新します`);
          await comment.updateImageBody(q, page);
        }
      };
    }
  }
  debugPrint('インポート終了しました');
})(options);


