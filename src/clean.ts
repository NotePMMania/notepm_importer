#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';
import NotePM, {Note, Folder, Page, Tag, User} from './note_pm';
import Attachment from './note_pm/attachment';
import { fstat } from 'fs';
import { promisify } from 'util';
import { debugPrint } from './func';

const dir = process.argv[process.argv.length - 1];

program
  .version('0.0.1')
  .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
  .parse();

const options = program.opts();


(async (options) => {
  const n = new NotePM(options.accessToken, options.team);
  const notes = await Note.fetchAll();
  if (!notes) return;
  if (notes.length > 0) {
    debugPrint(`ノートが ${notes.length}件あります`);
    await Promise.all(notes.map(async n => {
      await n.delete();
    }));
  }
  debugPrint(`終了しました`);
})(options);


