#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import NotePM, {Note, Folder, Page, Tag, Comment, Attachment, User} from './note_pm/';
import { promisify } from 'util';
import Docbase from './docbase/index';
import { debugPrint } from './func';

const dir = process.argv[process.argv.length - 1];

program
  .version('0.0.1')
  .option('-p, --path [dir]', 'エクスポートしたZipファイルを展開したフォルダへのパスを指定してください')
  .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
  .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
  .parse();

const options = program.opts();

(async (options) => {
  if (!options.accessToken) throw new Error('アクセストークンは必須です（-a ACCESS_TOKEN）');
  if (!options.team) throw new Error('チームドメインは必須です（-t TEAM_DOMAIN）');
  if (!options.path) throw new Error('DocbaseのZipを展開したディレクトリは必須です（-p PATH_TO_DIR）');
  if (!options.userYaml) throw new Error('ユーザ設定ファイルが必要です（-u PATH_TO_YAML）');
  const n = new NotePM(options.accessToken, options.team);
  const d = new Docbase(options.path);
  await d.loadFiles();
  const groups = ['ルート'].concat(Array.from(d.groups));
  const str = await promisify(fs.readFile)(options.userYaml, 'utf-8');
  const config = await yaml.load(str) as Config;
  await n.getUsers();
  config.users.forEach(u => {
    n.users.push(new User({
      user_code: u.user_code,
      name: u.id,
    }));  
  });

  const notes = {
  };
  for (const dir of Array.from(groups)) {
    // ノートを準備する
    const note = new Note({
      name: dir,
      description: 'Docbaseからインポートしたノートです',
      scope: 'private'
    });
    await note.save();
    notes[note.name] = note;
  }

  // 記事を作成する
  const tags = [];
  for (const fileName in d.contents) {
    const file = d.contents[fileName];
    debugPrint(`    ${fileName}のタグ作成開始`);
    for (const tag of file.tags) {
      if (tags.indexOf(tag.name) > -1) continue;
      debugPrint(`      タグ： ${tag.name}`);
      const t = new Tag({
        name: tag.name,
      });
      try {
        await t.save();
        tags.push(tag.name);
      } catch (e) {
        debugPrint(`      タグの作成に失敗しました。既に存在する可能性があります。 ${JSON.stringify(e)}`);
      }
    }
    debugPrint(`    タグ保存完了`);
    // 該当するノートを抽出
    if (file.groups.length === 0) file.groups.push({name: 'ルート'});
    for (const group of file.groups) {
      const note = notes[group.name];
      const body = file.body;
      const title = file.title;
      debugPrint('');
      debugPrint(`    タイトル： ${title}`);
      debugPrint(`    ノート： ${group.name} => ${note.name}`);
      const page = new Page({
        title,
        body,
        note_code: note.note_code,
        memo: '',
        tags: file.tags,
        created_at: new Date(file.created_at)
      });
      page.user = file.user.name;
      await page.save();
      await page.updateImageBody(null, `${d.dir}/attachments/`);
      debugPrint(`    ページID： ${page.page_code}`)
      // コメント投稿
      if (file.comments) {
        for (const c of file.comments) {
          const comment = new Comment({
            page_code: page.page_code!,
            body: c.body,
            user: c.user.name,
            created_at: c.created_at
          });
          await comment.save();
          await comment.updateImageBody(null, page, `${d.dir}/attachments/`);
        }
      }
    }
  }
})(options);
