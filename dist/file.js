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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const note_pm_1 = __importStar(require("./note_pm/"));
const util_1 = require("util");
// import FileDir from './file/index';
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-p, --path [dir]', 'フォルダのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
    .parse();
const options = commander_1.program.opts();
const importExecute = async (note, folder, dir) => {
    var _a;
    if (!dir.match(/.*\/$/))
        dir = `${dir}/`;
    const res = {};
    const ary = await util_1.promisify(fs_1.default.readdir)(dir);
    for (const filePath of ary) {
        if (filePath.match(/^\./))
            continue;
        const dirPath = `${dir}${filePath}`;
        const file = await util_1.promisify(fs_1.default.stat)(dirPath);
        if (file.isDirectory()) {
            // フォルダを作る
            const f = new note_pm_1.Folder({
                name: filePath.normalize('NFC'),
                parent_folder_id: folder ? folder.folder_id : null,
            });
            await f.save(note);
            if (folder)
                console.log(`  フォルダ ${folder.name} の下にフォルダ ${f.name} を作成しました`);
            await importExecute(note, f, dirPath);
        }
        else {
            const basename = path_1.default.basename(filePath).normalize('NFC');
            const title = basename.match(/.*\..*$/) ? basename.replace(/(.*)\..*$/, "$1") : basename;
            const page = new note_pm_1.Page({
                note_code: note.note_code,
                folder_id: folder ? folder.folder_id : null,
                title: title,
                body: filePath,
                memo: ''
            });
            await page.save();
            if (folder) {
                console.log(`  フォルダ ${folder.name} の下にページ ${page.title} を作成しました ${folder.folder_id}`);
            }
            else {
                console.log(`  ノート ${note.name} の下にページ ${page.title} を作成しました`);
            }
            // ファイルアップロード
            const attachment = await note_pm_1.Attachment.add(page, basename, dirPath);
            page.body = `[${basename}](${(_a = attachment.download_url) === null || _a === void 0 ? void 0 : _a.replace(/https:\/\/(.*?)\.notepm\.jp\/api\/v1\/attachments\/download\//, "https://$1.notepm.jp/private/")})`;
            await page.save();
        }
    }
};
(async (options) => {
    const n = new note_pm_1.default(options.accessToken, options.team);
    const note = new note_pm_1.Note({
        name: 'インポート',
        description: 'フォルダからインポートしたノート',
        scope: 'private',
    });
    await note.save();
    await importExecute(note, null, options.path);
})(options);
