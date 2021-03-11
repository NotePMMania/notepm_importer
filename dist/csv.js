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
const note_pm_1 = __importStar(require("./note_pm/"));
const util_1 = require("util");
const papaparse_1 = __importDefault(require("papaparse"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-p, --path [dir]', 'CSVファイルのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
    .parse();
const options = commander_1.program.opts();
(async (options) => {
    const n = new note_pm_1.default(options.accessToken, options.team);
    await n.getUsers();
    console.log('ノート「インポート」を作成します');
    const note = new note_pm_1.Note({
        name: 'インポート',
        description: 'CSVからインポートしたノート',
        scope: 'private',
    });
    await note.save();
    try {
        await util_1.promisify(fs_1.default.stat)(options.path);
    }
    catch (e) {
        throw new Error(`CSVファイルがありません ${options.path}`);
    }
    const data = await util_1.promisify(fs_1.default.readFile)(options.path);
    const buf = Buffer.from(data, 'binary');
    const csv = iconv_lite_1.default.decode(buf, 'Shift_JIS');
    const ary = papaparse_1.default.parse(csv, { header: true });
    for (const params of ary.data) {
        console.log(`ページ「${params.title}」を作成します`);
        const page = new note_pm_1.Page({
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
