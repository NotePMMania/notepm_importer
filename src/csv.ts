#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import fs from 'fs';
import NotePM, {Note, Folder, Page, Tag, Comment, Attachment, User} from './note_pm/';
import { promisify } from 'util';
import Papa from 'papaparse';
import iconv from 'iconv-lite';

const dir = process.argv[process.argv.length - 1];

program
  .version('0.0.1')
  .option('-p, --path [dir]', 'CSVファイルのパスを指定してください')
  .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
  .parse();

const options = program.opts();

(async (options) => {
  const n = new NotePM(options.accessToken, options.team);
  const note = new Note({
    name: 'インポート',
    description: 'CSVからインポートしたノート',
    scope: 'private',
  });
  await note.save();

  try {
    await promisify(fs.stat)(options.path);
  } catch (e) {
    throw new Error(`CSVファイルがありません ${options.path}`);
  }
  const data = await promisify(fs.readFile)(options.path);
  const buf = Buffer.from(data, 'binary');
  const csv = iconv.decode(buf, 'Shift_JIS');
  const ary = Papa.parse(csv, {header: true});
  for (const params of ary.data) {
    const page = new Page({
      note_code: note.note_code,
      title: params.title,
      body: params.body,
      created_at: params.created_at ? new Date(params.created_at) : new Date,
      memo: params.memo,
      user: params.user,
    });
    await page.save();
  }
})(options);
