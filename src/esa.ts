#!/usr/bin/env node
import { program } from 'commander';
import path from 'path';
import NotePM, {Note, Folder, Page, Tag, Comment, Attachment, User} from './note_pm/';
import { promisify } from 'util';
import Esa from './esa/index';
import { debugPrint } from './func';

const dir = process.argv[process.argv.length - 1];

program
  .version('0.0.1')
  .option('-d, --domain [domain]', 'esaのドメインを指定してください')
  .option('-p, --path [dir]', 'エクスポートしたZipファイルを展開したフォルダへのパスを指定してください')
  .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
  .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
  .parse();

const options = program.opts();

const prepareNote = async (dirs: Esa_Dir[]) => {
  const ary = [];
  for (const dir of dirs) {
    const res = {};
    const note = new Note({
      name: dir.name.normalize('NFC'),
      description: 'esaからインポートしたノート',
      scope: 'private',
    });
    await note.save();
    res.note = note;
    if (dir.dirs) {
      const folders = await prepareFolder(note, dir.dirs);
      res.folders = folders;
    }
    ary.push(res);
  }
  return ary;
};

const prepareFolder = async(note: Note, dirs: Esa_Dir[], parentFolder?: Folder) => {
  const ary = [];
  for (const dir of dirs) {
    const res = {};
    const folder = new Folder({
      name: dir.name.normalize('NFC')
    });
    if (parentFolder) {
      folder.parent_folder_id = parentFolder.folder_id;
    }
    try {
      await folder.save(note);
    } catch (e) {
      debugPrint(`フォルダの作成に失敗しました： ${folder.name}`);
      debugPrint(`エラーメッセージ${e.message}`);
      process.exit(1);
    }
    res.folder = folder;
    if (dir.dirs) {
      const folders = await prepareFolder(note, dir.dirs, folder);
      res.folders = folders;
    }
    ary.push(res);
  }
  return ary;
}

const findNoteOrFolder = (dirs, category: string | null) => {
  if (!category) {
    const { note } = dirs.filter(dir => dir.note.name === 'ルートノート')[0];
    return { note };
  }
  const categories = category!.split('/');
  const note = dirs.filter(dir => dir.note.name === categories[0])[0];
  if (categories.length === 1) {
    return { note: note.note };
  }
  categories.shift();
  let folder = note;
  for (const category of categories) {
    folder = folder.folders.filter(folder => folder.folder.name === category)[0];
  }
  return {note: note.note, folder: folder.folder};
}

(async (options) => {
  const n = new NotePM(options.accessToken, options.team);
  const e = new Esa(options.path);
  await e.loadFiles();
  const dirs = await e.dirs();
  await n.getTags();
  // タグの用意
  let tags: string[] = [];
  for (const file in e.files) {
    const params = e.files[file];
    // debugPrint(file);
    (params.metadata.tags || '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '').forEach(s => {
        if (tags.indexOf(s) === -1) tags.push(s);
      });
  }
  n.tags.forEach(s => {
    tags = tags.filter(tag => tag !== s.name);
  });
  for (const name of tags) {
    const tag = new Tag({
      name: name
    });
    await tag.save();
  }
  // ノートとフォルダの作成
  dirs.push({name: 'ルートノート'});
  const ary = await prepareNote(dirs);

  // ページの作成
  for (const file in e.files) {
    const params = e.files[file];
    // debugPrint(file);
    const { metadata } = params;
    debugPrint(`  ページタイトル： ${metadata.title}`);
    debugPrint(`  カテゴリ： ${metadata.category}`);
    const { note, folder } = findNoteOrFolder(ary, metadata.category);
    debugPrint(`  ノート： ${note.note_code}`);
    debugPrint(`  フォルダ： ${folder?.folder_id}`);
    const tags = (metadata.tags || '').split(',').map(s => s.trim()).filter(s => s !== '').map(s => new Tag({name: s}));
    debugPrint(`  タグ： ${tags.map(t => t.name).join(', ')}`);
    const page = new Page({
      title: metadata.title,
      body: params.content,
      note_code: note.note_code,
      folder_id: folder ? folder.folder_id : null,
      created_at: new Date(metadata.created_at),
      tags,
      memo: '',
    });
    await page.save();    
  }
})(options);
