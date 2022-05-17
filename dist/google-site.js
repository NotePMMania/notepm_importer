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
const jsdom_1 = require("jsdom");
const turndown_1 = __importDefault(require("turndown"));
const turndownPluginGfm = __importStar(require("turndown-plugin-gfm"));
const func_1 = require("./func");
const tables = turndownPluginGfm.tables;
const turndown = new turndown_1.default();
turndown.use(tables);
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-p, --path [dir]', 'Google Site(v1)のエクスポートしたファイルのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
    .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
    .parse();
const options = commander_1.program.opts();
const generateTree = async (baseDir, dir, base = '') => {
    const files = await util_1.promisify(fs_1.default.readdir)(`${base}${dir}`);
    if (!files)
        return null;
    const ary = [];
    for (const file of files) {
        if (file.match(/^\./))
            continue;
        const filePath = `${base}${dir}${file}`;
        const stat = await util_1.promisify(fs_1.default.lstat)(filePath);
        if (stat.isDirectory()) {
            const obj = {
                name: filePath.replace(`${base}${dir}`, ''),
                url: filePath.replace(`${base}${dir}`, ''),
                content: '',
                child: null,
            };
            const child = await generateTree(baseDir, `${file}/`, `${base}${dir}`);
            if (child.length > 0) {
                obj.child = child;
                ary.push(obj);
            }
        }
        else {
            if (!file.match(/\.html$/))
                continue;
            const content = await util_1.promisify(fs_1.default.readFile)(filePath, 'utf-8');
            const { document } = (new jsdom_1.JSDOM(content)).window;
            const obj = {
                name: document.querySelector('#sites-page-title').textContent.trim(),
                id: filePath.replace(`${base}${dir}`, '').replace(/\.html$/, ''),
                url: filePath.replace(`${base}${dir}`, ''),
                content: turndown.turndown(document.querySelector('#sites-canvas-main').innerHTML)
            };
            const attachments = document.querySelectorAll('.sites-attachments-name a');
            obj.attachments = [];
            for (const attachment of attachments) {
                obj.attachments.push({
                    name: attachment.getAttribute('href').replace(/.*\//, ''),
                    path: attachment.getAttribute('href')
                });
            }
            const comments = document.querySelectorAll('.comment');
            obj.comments = [];
            for (const comment of comments) {
                const username = comment.querySelector('.user-name').textContent;
                const body = comment.querySelector('.comment-content').textContent;
                const date = new Date(comment.querySelector('.created-date').textContent);
                obj.comments.push({
                    username, body, date
                });
                const replies = comment.querySelectorAll('.reply-box');
                if (replies.length > 0) {
                    for (const reply of replies) {
                        const username = reply.querySelector('.user-name').textContent;
                        const body = reply.querySelector('.comment-content').textContent;
                        const date = new Date(reply.querySelector('.created-date').textContent);
                        obj.comments.push({
                            username, body, date
                        });
                    }
                }
            }
            ary.push(obj);
        }
    }
    return ary;
};
const getFolderName = (name, ary) => {
    return ary.filter(a => a.id === name)[0].name;
};
const generatePage = async (dir, config, note, ary, folder) => {
    for (const params of ary) {
        let f;
        if (params.child) {
            // フォルダを作る
            const folderName = getFolderName(params.name, ary);
            func_1.debugPrint(`フォルダを作成します ${folderName}`);
            f = new note_pm_1.Folder({
                parent_folder_id: folder ? folder.folder_id : null,
                name: folderName,
            });
            await f.save(note);
            generatePage(`${dir}${params.name}/`, config, note, params.child, f);
        }
        else {
            func_1.debugPrint(`ページを作成します ${params.name}`);
            const page = new note_pm_1.Page({
                note_code: note.note_code,
                title: params.name,
                body: '',
                memo: '',
                folder_id: folder ? folder.folder_id : undefined,
            });
            await page.save();
            await uploadAttachment(dir, page, params.content);
            // 単純な添付ファイル
            if (params.attachments.length > 0) {
                func_1.debugPrint(`  添付ファイルを${params.name}にアップロードします`);
                for (const attachment of params.attachments) {
                    const name = decodeURIComponent(attachment.path);
                    func_1.debugPrint(`    添付ファイル（${name}）をアップロードします`);
                    const localPath = `${dir}${name}`;
                    try {
                        await note_pm_1.Attachment.add(page, name, localPath);
                        func_1.debugPrint(`    添付ファイル（${name}）をアップロードしました`);
                    }
                    catch (e) {
                        func_1.debugPrint(`    添付ファイル（${name}）をアップロードできませんでした`);
                    }
                }
                func_1.debugPrint('  添付ファイルをアップロードしました');
            }
            if (params.comments.length > 0) {
                func_1.debugPrint(`  ${params.name}にコメントを投稿します`);
                for (const c of params.comments) {
                    const comment = new note_pm_1.Comment({
                        page_code: page.page_code,
                        body: c.body,
                        user: c.username,
                        created_at: c.date
                    });
                    try {
                        await comment.save();
                        func_1.debugPrint(`    コメントを投稿しました`);
                    }
                    catch (e) {
                        func_1.debugPrint(`    コメントの投稿に失敗しました ${e.message}`);
                    }
                }
                func_1.debugPrint(`  ${params.name}にコメントを投稿しました`);
            }
        }
    }
};
const uploadAttachment = async (dir, page, body) => {
    const { document } = (new jsdom_1.JSDOM(body)).window;
    const dom = document.querySelectorAll('img');
    const images = [];
    for (const img of dom) {
        const src = img.getAttribute('src');
        if (!src.match(/^http/)) {
            images.push(src);
        }
    }
    page.body = body;
    if (images.length > 0) {
        func_1.debugPrint(`  画像をアップロードします`);
        for (const source of images) {
            func_1.debugPrint(`    ファイル名 ${source}`);
            const localPath = `${dir}${source}`;
            const attachment = await note_pm_1.Attachment.add(page, source, localPath);
            const url = attachment.download_url.replace(/https:\/\/(.*?)\.notepm\.jp\/api\/v1\/attachments\/download\//, "https://$1.notepm.jp/private/");
            const r = new RegExp(source, 'g');
            page.body = page.body.replace(r, url);
        }
        func_1.debugPrint(`  画像アップロード完了しました`);
    }
    await page.save();
};
(async (options) => {
    const n = new note_pm_1.default(options.accessToken, options.team);
    const dir = options.path.match(/.*\/$/) ? options.path : `${options.path}/`;
    let config;
    if (!options.userYaml) {
        config = { users: [] };
    }
    else {
        const str = await util_1.promisify(fs_1.default.readFile)(options.userYaml, 'utf-8');
        config = await js_yaml_1.default.load(str);
        config.users.forEach(u => {
            n.users.push(new note_pm_1.User({
                user_code: u.user_code,
                name: u.id,
            }));
        });
    }
    const indexPath = `${dir}home.html`;
    const indexContent = await util_1.promisify(fs_1.default.readFile)(indexPath, 'utf-8');
    const { document } = (new jsdom_1.JSDOM(indexContent)).window;
    const noteName = document.querySelector('#sites-chrome-userheader-title').textContent;
    const ary = await generateTree(dir, dir);
    const note = new note_pm_1.Note({
        name: noteName,
        description: 'Google Siteからインポートしたノート',
        scope: 'private',
    });
    await note.save();
    try {
        await generatePage(dir, config, note, ary);
    }
    catch (e) {
        // エラー
        func_1.debugPrint('エラーが出たのでノートを削除します');
        await note.delete();
    }
})(options);
