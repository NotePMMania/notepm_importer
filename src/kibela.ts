#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import NotePM, {Note, Folder, Page, Tag, Comment, Attachment, User} from './note_pm/';
import { promisify } from 'util';
import Kibela from './kibela/index';
import { exit } from 'process';
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

type Kibela_Folder = {
  folder: Folder;
  child: Kibela_Folder[],
};

const findOrCreateFolder = async (note: Note, folders: Kibela_Folder[], paths: string[], parentFolder: Folder = null) => {
  let folder = folders.filter(f => f.folder.name === paths[0].normalize('NFC') && f.folder.note_code == note.note_code)[0];
  if (!folder) {
    const n = new Folder({
      name: paths[0].normalize('NFC'),
      parent_folder_id: parentFolder ? parentFolder.folder_id : null,
      note_code: note.note_code,
    });
    debugPrint(`　　存在しないフォルダを作成します`);
    debugPrint(`　　ノート： ${note.name}`);
    debugPrint(`　　フォルダ名： ${paths[0]}`);
    await n.save(note);
    folder = {
      folder: n,
      child: []
    };
    folders.push(folder);
  }
  if (paths.length === 1) return folder.folder;
  return findOrCreateFolder(note, folder.child, paths.splice(1), folder.folder);
};

(async (options) => {
  if (!options.accessToken) throw new Error('アクセストークンは必須です（-a ACCESS_TOKEN）');
  if (!options.team) throw new Error('チームドメインは必須です（-t TEAM_DOMAIN）');
  if (!options.path) throw new Error('KibelaのZipを展開したディレクトリは必須です（-p PATH_TO_DIR）');
  if (!options.userYaml) throw new Error('Kiberaのユーザ設定ファイルが必要です（-u PATH_TO_FILE）');

  const n = new NotePM(options.accessToken, options.team);
  const k = new Kibela(options.path);
  await k.loadFiles();
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
  for (const dir of Array.from(k.groups)) {
    // ノートを準備する
    const note = new Note({
      name: dir,
      description: 'Kibelaからインポートしたノートです',
      scope: 'private'
    });
    await note.save();
    notes[note.name] = note;
  }
  // 記事を作成する
  const folders = [];
  for (const fileName in k.contents) {
    const file = k.contents[fileName];
    // 該当するノートを抽出
    for (const group of file.metadata.groups) {
      const note = notes[group];
      // フォルダを確認
      let folder = null;
      if (file.metadata && file.metadata.folders) {
        if (file.metadata.folders.length > 0) {
          for (const f of file.metadata.folders) {
            if (f.split(' / ')[0] === note.name) {
              folder = await findOrCreateFolder(note, folders, f.split(' / ')[1].split('/'));
              break;
            }
          }
        }
      } else {
        debugPrint('メタデータにフォルダ情報がありません。このファイルは取り込めません');
        debugPrint('=======以下デバッグ情報です=======')
        debugPrint(file.metadata);
        debugPrint('=======以上デバッグ情報です=======')
        throw new Error('Unknown error');
      }
      const ary = file.content.split(/\n/);
      const body = ary.slice(3).join("\n");
      const title = ary.filter(s => s !== '')[0].replace(/^# /, '');
      debugPrint('');
      debugPrint(`　　タイトル： ${title}`);
      debugPrint(`　　ノート： ${group} => ${note.name}`);
      debugPrint(`　　フォルダ： ${file.metadata.folders} => ${folder ? folder.name : 'なし'}, (${folder ? folder.folder_id : ''})`);
      debugPrint(`    作成日： ${file.metadata.published_at}`);
      const page = new Page({
        title,
        body,
        folder_id: folder? folder.folder_id : null,
        note_code: note.note_code,
        created_at: new Date(file.metadata.published_at),
        memo: ''
      });
      page.user = file.metadata.author;
      await page.save();
      const directory = `${k.dir}/notes/${file.metadata.folder == null ? '' : file.metadata.folder + "/"}`;
      await page.updateImageBody(null, directory);

      // コメント投稿
      if (file.metadata.comments) {
        for (const c of file.metadata.comments) {
          const comment = new Comment({
            page_code: page.page_code!,
            created_at: c.published_at,
            user: c.author,
            body: c.content
          });
          await comment.save();
          await comment.updateImageBody(null, page, directory);
        }
      }
    }
  }
})(options);
