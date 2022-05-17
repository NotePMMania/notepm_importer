#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import NotePM, {Note, Folder, Page, Tag, Comment, Attachment, User} from './note_pm/';
import { promisify } from 'util';
import mammoth from 'mammoth';
import { debugPrint } from './func';

const dir = process.argv[process.argv.length - 1];

program
  .version('0.0.1')
  .option('-p, --path [dir]', 'フォルダのパスを指定してください')
  .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
  .parse();

const options = program.opts();

(async (options) => {
  const n = new NotePM(options.accessToken, options.team);
  const dir = (!options.path.match(/.*\/$/)) ? `${options.path}/` : options.path;
  try {
    await promisify(fs.stat)(`${dir}images`);
  } catch (e) {
    await promisify(fs.mkdir)(`${dir}images`);
  }

  debugPrint('ノート「インポート」を作成します');
  const note = new Note({
    name: 'インポート',
    description: 'フォルダからインポートしたノート',
    scope: 'private',
  });
  await note.save();

  const ary = await promisify(fs.readdir)(dir);
  for (const filePath of ary) {
    if (filePath.match(/^\./)) continue;
    const dirPath = `${dir}${filePath}`;
    const file = await promisify(fs.stat)(dirPath);
    if (file.isDirectory()) continue;
    if (!filePath.match(/\.docx$/)) {
      debugPrint(`docx以外のファイル形式には対応していません。スキップします ${filePath}`);
      continue;
    }
    const word = await mammoth.convertToMarkdown({path: dirPath});
    const basename = path.basename(filePath).normalize('NFC');
    debugPrint(`Wordファイル ${basename} を処理します`);
    const title = basename.match(/.*\..*$/) ? basename.replace(/(.*)\..*$/, "$1") : basename;
    const page = new Page({
      note_code: note.note_code,
      title: title,
      body: '',
      memo: ''
    });
    await page.save();
    debugPrint(`ページ ${title} を作成しました`);
    const match = word.value.match(/!\[.*?\]\((.*?)\)/sg);
    if (match) {
      debugPrint(`  画像を処理します`);
      for (const source of match) {
        const src = source.replace(/!\[.*?\]\(/, '').replace(/\)$/, '');
        const type = src.split(',')[0].replace(/data:(.*);.*/, "$1");
        const ext = type.split('/')[1];
        const data = src.split(',')[1];
        const localFileName = `${(new Date).getTime()}.${ext}`;
        debugPrint(`  画像 ${localFileName} をアップロードします`);
        const localPath = `${dir}images/${localFileName}`;
        await promisify(fs.writeFile)(localPath, data, 'base64');
        const attachment = await Attachment.add(page, localFileName, localPath);
        const url = attachment.download_url.replace(/https:\/\/(.*?)\.notepm\.jp\/api\/v1\/attachments\/download\//, "https://$1.notepm.jp/private/");
        word.value = word.value.replace(src, url);
        await promisify(fs.unlink)(localPath);
      }
    }
    debugPrint(`  ページ本文を更新します`);
    page.body = word.value;
    await page.save();
  }
  // await promisify(fs.unlink)(`${dir}images`);
})(options);
