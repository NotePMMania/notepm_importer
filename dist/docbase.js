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
const index_1 = __importDefault(require("./docbase/index"));
const func_1 = require("./func");
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-p, --path [dir]', 'エクスポートしたZipファイルを展開したフォルダへのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
    .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
    .parse();
const options = commander_1.program.opts();
(async (options) => {
    if (!options.accessToken)
        throw new Error('アクセストークンは必須です（-a ACCESS_TOKEN）');
    if (!options.team)
        throw new Error('チームドメインは必須です（-t TEAM_DOMAIN）');
    if (!options.path)
        throw new Error('DocbaseのZipを展開したディレクトリは必須です（-p PATH_TO_DIR）');
    if (!options.userYaml)
        throw new Error('ユーザ設定ファイルが必要です（-u PATH_TO_YAML）');
    const n = new note_pm_1.default(options.accessToken, options.team);
    const d = new index_1.default(options.path);
    await d.loadFiles();
    const groups = ['ルート'].concat(Array.from(d.groups));
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
    for (const dir of Array.from(groups)) {
        // ノートを準備する
        const note = new note_pm_1.Note({
            name: dir,
            description: 'Docbaseからインポートしたノートです',
            scope: 'private'
        });
        await note.save();
        notes[note.name] = note;
    }
    // 記事を作成する
    const tags = [];
    for (const fileName in d.contents) {
        const file = d.contents[fileName];
        func_1.debugPrint(`    ${fileName}のタグ作成開始`);
        for (const tag of file.tags) {
            if (tags.indexOf(tag.name) > -1)
                continue;
            func_1.debugPrint(`      タグ： ${tag.name}`);
            const t = new note_pm_1.Tag({
                name: tag.name,
            });
            try {
                await t.save();
                tags.push(tag.name);
            }
            catch (e) {
                func_1.debugPrint(`      タグの作成に失敗しました。既に存在する可能性があります。 ${e.message}`);
            }
        }
        func_1.debugPrint(`    タグ保存完了`);
        // 該当するノートを抽出
        if (file.groups.length === 0)
            file.groups.push({ name: 'ルート' });
        for (const group of file.groups) {
            const note = notes[group.name];
            const body = file.body;
            const title = file.title;
            func_1.debugPrint('');
            func_1.debugPrint(`    タイトル： ${title}`);
            func_1.debugPrint(`    ノート： ${group.name} => ${note.name}`);
            func_1.debugPrint(`    タグ： ${file.tags.map(t => t.name).join(',')}`);
            const page = new note_pm_1.Page({
                title,
                body,
                note_code: note.note_code,
                memo: '',
                tags: file.tags.map(t => t.name),
                created_at: new Date(file.created_at)
            });
            page.user = file.user.name;
            await page.save();
            await page.updateImageBody(null, `${d.dir}/attachments/`);
            func_1.debugPrint(`    ページID： ${page.page_code}`);
            // コメント投稿
            if (file.comments) {
                for (const c of file.comments) {
                    const comment = new note_pm_1.Comment({
                        page_code: page.page_code,
                        body: c.body,
                        user: c.user.name,
                        created_at: c.created_at
                    });
                    await comment.save();
                    await comment.updateImageBody(null, page, `${d.dir}/attachments/`);
                }
            }
        }
    }
})(options);
