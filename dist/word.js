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
const mammoth_1 = __importDefault(require("mammoth"));
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-p, --path [dir]', 'フォルダのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
    .parse();
const options = commander_1.program.opts();
(async (options) => {
    const n = new note_pm_1.default(options.accessToken, options.team);
    const dir = (!options.path.match(/.*\/$/)) ? `${options.path}/` : options.path;
    try {
        await util_1.promisify(fs_1.default.stat)(`${dir}images`);
    }
    catch (e) {
        await util_1.promisify(fs_1.default.mkdir)(`${dir}images`);
    }
    console.log('ノート「インポート」を作成します');
    const note = new note_pm_1.Note({
        name: 'インポート',
        description: 'フォルダからインポートしたノート',
        scope: 'private',
    });
    await note.save();
    const ary = await util_1.promisify(fs_1.default.readdir)(dir);
    for (const filePath of ary) {
        if (filePath.match(/^\./))
            continue;
        const dirPath = `${dir}${filePath}`;
        const file = await util_1.promisify(fs_1.default.stat)(dirPath);
        if (file.isDirectory())
            continue;
        const word = await mammoth_1.default.convertToMarkdown({ path: dirPath });
        const basename = path_1.default.basename(filePath).normalize('NFC');
        console.log(`Wordファイル ${basename} を処理します`);
        const title = basename.match(/.*\..*$/) ? basename.replace(/(.*)\..*$/, "$1") : basename;
        const page = new note_pm_1.Page({
            note_code: note.note_code,
            title: title,
            body: '',
            memo: ''
        });
        await page.save();
        console.log(`ページ ${title} を作成しました`);
        const match = word.value.match(/!\[\]\((.*?)\)/mg);
        if (match) {
            console.log(`  画像を処理します`);
            for (const source of match) {
                const src = source.replace('![](', '').replace(/\)$/, '');
                const type = src.split(',')[0].replace(/data:(.*);.*/, "$1");
                const ext = type.split('/')[1];
                const data = src.split(',')[1];
                const localFileName = `${(new Date).getTime()}.${ext}`;
                console.log(`  画像 ${localFileName} をアップロードします`);
                const localPath = `${dir}images/${localFileName}`;
                await util_1.promisify(fs_1.default.writeFile)(localPath, data, 'base64');
                const attachment = await note_pm_1.Attachment.add(page, localFileName, localPath);
                const url = attachment.download_url.replace(/https:\/\/(.*?)\.notepm\.jp\/api\/v1\/attachments\/download\//, "https://$1.notepm.jp/private/");
                word.value = word.value.replace(src, url);
                await util_1.promisify(fs_1.default.unlink)(localPath);
            }
        }
        console.log(`  ページ本文を更新します`);
        page.body = word.value;
        await page.save();
    }
    // await promisify(fs.unlink)(`${dir}images`);
})(options);
