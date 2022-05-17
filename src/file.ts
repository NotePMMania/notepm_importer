#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import NotePM, {Note, Folder, Page, Tag, Comment, Attachment, User} from './note_pm/';
import { promisify } from 'util';
import { debugPrint } from './func';

// import FileDir from './file/index';

const dir = process.argv[process.argv.length - 1];

program
  .version('0.0.1')
  .option('-p, --path [dir]', 'フォルダのパスを指定してください')
  .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
  .parse();

const options = program.opts();

const importExecute = async (note: Note, folder: Folder, dir: string) => {
  if (!dir.match(/.*\/$/)) dir = `${dir}/`
  const res: {[s: string]: string} = {};
  const ary = await promisify(fs.readdir)(dir);
  for (const filePath of ary) {
    if (filePath.match(/^\./)) continue;
    const dirPath = `${dir}${filePath}`;
    const file = await promisify(fs.stat)(dirPath);
    if (file.isDirectory()) {
      // フォルダを作る
      const f = new Folder({
        name: filePath.normalize('NFC'),
        parent_folder_id: folder ? folder.folder_id : null,
      });
      try {
        await f.save(note);
        if (folder) {
          debugPrint(`  フォルダ ${folder.name} の下にフォルダ ${f.name} を作成しました`);
        }
        await importExecute(note, f, dirPath);
      } catch (e) {
        debugPrint(`  フォルダ ${folder.name} の下にフォルダ ${f.name} を作成しようとしてエラーが発生しました`);
        debugPrint(`  ${e.message}`);
        process.exit(1);
      }
    } else {
      const basename = path.basename(filePath).normalize('NFC');
      const title = basename.match(/.*\..*$/) ? basename.replace(/(.*)\..*$/, "$1") : basename
      const page = new Page({
        note_code: note.note_code,
        folder_id: folder ? folder.folder_id : undefined,
        title: title,
        body: filePath,
        memo: ''
      });
      await page.save();
      if (folder) {
        debugPrint(`  フォルダ ${folder.name} の下にページ ${page.title} を作成しました ${folder.folder_id}`);
      } else {
        debugPrint(`  ノート ${note.name} の下にページ ${page.title} を作成しました`);
      }
      // ファイルアップロード
      const attachment = await Attachment.add(page, basename, dirPath);
      page.body = `[${basename}](${attachment.download_url?.replace(/https:\/\/(.*?)\.notepm\.jp\/api\/v1\/attachments\/download\//, "https://$1.notepm.jp/private/")})`;
      await page.save();
    }
  }
}

(async (options) => {
  const n = new NotePM(options.accessToken, options.team);

  const note = new Note({
    name: 'インポート',
    description: 'フォルダからインポートしたノート',
    scope: 'private',
  });
  await note.save();

  await importExecute(note, null, options.path)
})(options);
