#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const note_pm_1 = __importStar(require("./note_pm/"));
const index_1 = __importDefault(require("./esa/index"));
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-d, --domain [domain]', 'esaのドメインを指定してください')
    .option('-p, --path [dir]', 'エクスポートしたZipファイルを展開したフォルダへのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
    .parse();
const options = commander_1.program.opts();
const prepareNote = async (dirs) => {
    const ary = [];
    for (const dir of dirs) {
        const res = {};
        const note = new note_pm_1.Note({
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
const prepareFolder = async (note, dirs, parentFolder) => {
    const ary = [];
    for (const dir of dirs) {
        const res = {};
        const folder = new note_pm_1.Folder({
            name: dir.name.normalize('NFC')
        });
        if (parentFolder) {
            folder.parent_folder_id = parentFolder.folder_id;
        }
        await folder.save(note);
        res.folder = folder;
        if (dir.dirs) {
            const folders = await prepareFolder(note, dir.dirs, folder);
            res.folders = folders;
        }
        ary.push(res);
    }
    return ary;
};
const findNoteOrFolder = (dirs, category) => {
    if (!category) {
        const { note } = dirs.filter(dir => dir.note.name === 'ルートノート')[0];
        return { note };
    }
    const categories = category.split('/');
    const note = dirs.filter(dir => dir.note.name === categories[0])[0];
    if (categories.length === 1) {
        return { note: note.note };
    }
    categories.shift();
    let folder = note;
    for (const category of categories) {
        folder = folder.folders.filter(folder => folder.folder.name === category)[0];
    }
    return { note: note.note, folder: folder.folder };
};
(async (options) => {
    const n = new note_pm_1.default(options.accessToken, options.team);
    const e = new index_1.default(options.domain, options.path);
    await e.loadFiles();
    const dirs = await e.dirs();
    // ブラウザを立ち上げて画像をダウンロード
    /*
    console.log('ブラウザを立ち上げます。esa.ioへログインしてください');
    await e.open();
    await e.downloadImage();
    // await q.downloadAttachment();
    e.close();
    console.log('画像をダウンロードしました');
    */
    await n.getTags();
    // タグの用意
    let tags = [];
    for (const file in e.files) {
        const params = e.files[file];
        // console.log(file);
        (params.metadata.tags || '')
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== '').forEach(s => {
            if (tags.indexOf(s) === -1)
                tags.push(s);
        });
    }
    n.tags.forEach(s => {
        tags = tags.filter(tag => tag !== s.name);
    });
    for (const name of tags) {
        const tag = new note_pm_1.Tag({
            name: name
        });
        await tag.save();
    }
    // ノートとフォルダの作成
    dirs.push({ name: 'ルートノート' });
    const ary = await prepareNote(dirs);
    // ページの作成
    for (const file in e.files) {
        const params = e.files[file];
        // console.log(file);
        const { metadata } = params;
        console.log(`  ページタイトル： ${metadata.title}`);
        console.log(`  カテゴリ： ${metadata.category}`);
        const { note, folder } = findNoteOrFolder(ary, metadata.category);
        console.log(`  ノート： ${note.note_code}`);
        console.log(`  フォルダ： ${folder === null || folder === void 0 ? void 0 : folder.folder_id}`);
        const tags = (metadata.tags || '').split(',').map(s => s.trim()).filter(s => s !== '').map(s => new note_pm_1.Tag({ name: s }));
        console.log(`  タグ： ${tags.map(t => t.name).join(', ')}`);
        const page = new note_pm_1.Page({
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
