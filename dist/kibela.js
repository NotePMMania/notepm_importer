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
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const note_pm_1 = __importStar(require("./note_pm/"));
const util_1 = require("util");
const index_1 = __importDefault(require("./kibela/index"));
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-p, --path [dir]', 'エクスポートしたZipファイルを展開したフォルダへのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
    .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
    .parse();
const options = commander_1.program.opts();
const findOrCreateFolder = async (note, folders, paths, parentFolder = null) => {
    let folder = folders.filter(f => f.folder.name === paths[0].normalize('NFC') && f.folder.note_code == note.note_code)[0];
    if (!folder) {
        const n = new note_pm_1.Folder({
            name: paths[0].normalize('NFC'),
            parent_folder_id: parentFolder ? parentFolder.folder_id : null,
            note_code: note.note_code,
        });
        console.log(`　　存在しないフォルダを作成します`);
        console.log(`　　ノート： ${note.name}`);
        console.log(`　　フォルダ名： ${paths[0]}`);
        await n.save(note);
        folder = {
            folder: n,
            child: []
        };
        folders.push(folder);
    }
    if (paths.length === 1)
        return folder.folder;
    return findOrCreateFolder(note, folder.child, paths.splice(1), folder.folder);
};
(async (options) => {
    if (!options.accessToken)
        throw new Error('アクセストークンは必須です（-a ACCESS_TOKEN）');
    if (!options.team)
        throw new Error('チームドメインは必須です（-t TEAM_DOMAIN）');
    if (!options.path)
        throw new Error('KibelaのZipを展開したディレクトリは必須です（-p PATH_TO_DIR）');
    if (!options.userYaml)
        throw new Error('Kiberaのユーザ設定ファイルが必要です（-u PATH_TO_FILE）');
    const n = new note_pm_1.default(options.accessToken, options.team);
    const k = new index_1.default(options.path);
    await k.loadFiles();
    const str = await util_1.promisify(fs_1.default.readFile)(options.userYaml, 'utf-8');
    const config = await js_yaml_1.default.load(str);
    await n.getUsers();
    config.users.forEach(u => {
        n.users.push(new note_pm_1.User({
            user_code: u.user_code,
            name: u.id,
        }));
    });
    const notes = {};
    for (const dir of Array.from(k.groups)) {
        // ノートを準備する
        const note = new note_pm_1.Note({
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
            }
            else {
                console.log('メタデータにフォルダ情報がありません。このファイルは取り込めません');
                console.log('=======以下デバッグ情報です=======');
                console.log(file.metadata);
                console.log('=======以上デバッグ情報です=======');
                throw new Error('Unknown error');
            }
            const ary = file.content.split(/\n/);
            const body = ary.slice(3).join("\n");
            const title = ary.filter(s => s !== '')[0].replace(/^# /, '');
            console.log('');
            console.log(`　　タイトル： ${title}`);
            console.log(`　　ノート： ${group} => ${note.name}`);
            console.log(`　　フォルダ： ${file.metadata.folders} => ${folder ? folder.name : 'なし'}, (${folder ? folder.folder_id : ''})`);
            console.log(`    作成日： ${file.metadata.published_at}`);
            const page = new note_pm_1.Page({
                title,
                body,
                folder_id: folder ? folder.folder_id : null,
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
                    const comment = new note_pm_1.Comment({
                        page_code: page.page_code,
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
