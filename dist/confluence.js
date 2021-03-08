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
const js_yaml_1 = __importDefault(require("js-yaml"));
const note_pm_1 = __importStar(require("./note_pm/"));
const util_1 = require("util");
const jsdom_1 = require("jsdom");
const turndown_1 = __importDefault(require("turndown"));
const turndown = new turndown_1.default();
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-p, --path [dir]', 'Confluenceのエクスポートしたファイルのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'NotePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'NotePMのチームドメインを入力してください')
    .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
    .parse();
const options = commander_1.program.opts();
const generateTree = async (dir, li) => {
    const uls = li.querySelectorAll(`:scope > ul`);
    if (!uls)
        return null;
    const ary = [];
    for (const ul of uls) {
        if (ul.parentElement !== li)
            continue;
        const { document } = (new jsdom_1.JSDOM(ul.outerHTML)).window;
        const lis = document.querySelectorAll('ul:first-child > li');
        for (const li of lis) {
            if (li.parentElement.outerHTML !== ul.outerHTML)
                continue;
            const obj = {
                name: li.querySelector('a').textContent,
                url: li.querySelector('a').getAttribute('href'),
                child: null
            };
            if (obj.url) {
                const content = await util_1.promisify(fs_1.default.readFile)(`${dir}${obj.url}`, 'utf-8');
                const { document } = (new jsdom_1.JSDOM(content)).window;
                const main = document.querySelector('#main-content');
                obj.author = document.querySelector('.author').textContent.trim();
                obj.content = await saveLocal(dir, turndown.turndown(main.innerHTML));
            }
            const { document } = (new jsdom_1.JSDOM(li.outerHTML)).window;
            if (document.querySelectorAll('ul')) {
                obj.child = await generateTree(dir, li);
            }
            ary.push(obj);
        }
    }
    return ary;
};
const saveLocal = async (dir, str) => {
    const match = str.match(/!\[\]\(data:(.*?)\)/mg);
    if (!match)
        return str;
    for (const source of match) {
        const src = source.replace('![](', '').replace(/\)$/, '');
        const type = src.split(',')[0].replace(/data:(.*);.*/, "$1");
        const ext = type.split('/')[1];
        const data = src.split(',')[1];
        const localFileName = `${(new Date).getTime()}.${ext}`;
        const localPath = `${dir}attachments/${localFileName}`;
        await util_1.promisify(fs_1.default.writeFile)(localPath, data, 'base64');
        str = str.replace(src, `attachments/${localFileName}`);
    }
    return str;
};
const generatePage = async (dir, config, note, ary, folder) => {
    for (const params of ary) {
        let f;
        if (params.child.length > 0) {
            // フォルダを作る
            f = new note_pm_1.Folder({
                parent_folder_id: folder ? folder.folder_id : null,
                name: params.name,
            });
            await f.save(note);
        }
        const page = new note_pm_1.Page({
            note_code: note.note_code,
            title: params.name,
            body: '',
            memo: '',
            folder_id: f ? f.folder_id : (folder ? folder.folder_id : undefined),
        });
        const u = config.users.filter(u => u.id === params.author)[0];
        if (u) {
            page.user = u.user_code;
        }
        await page.save();
        await uploadAttachment(dir, page, params.content);
        if (params.child.length > 0) {
            generatePage(dir, config, note, params.child, f);
        }
    }
};
const uploadAttachment = async (dir, page, body) => {
    const match = body.match(/!\[\]\((.*?)\)/mg);
    page.body = body;
    if (!match) {
        await page.save();
        return;
    }
    for (const source of match) {
        const src = source.replace('![](', '').replace(/\)$/, '').replace(/\?.*$/, '');
        const localFileName = path_1.default.basename(src);
        const localPath = `${dir}${src}`;
        const attachment = await note_pm_1.Attachment.add(page, localFileName, localPath);
        const url = attachment.download_url.replace(/https:\/\/(.*?)\.notepm\.jp\/api\/v1\/attachments\/download\//, "https://$1.notepm.jp/private/");
        page.body = page.body.replace(src, url);
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
    const indexPath = `${dir}index.html`;
    const indexContent = await util_1.promisify(fs_1.default.readFile)(indexPath, 'utf-8');
    const { document } = (new jsdom_1.JSDOM(indexContent)).window;
    const list = document.querySelectorAll('.pageSection')[1];
    const ary = await generateTree(dir, list);
    const note = new note_pm_1.Note({
        name: ary[0].name,
        description: 'Confluenceからインポートしたノート',
        scope: 'private',
    });
    await note.save();
    if (ary[0].content) {
        const page = new note_pm_1.Page({
            note_code: note.note_code,
            title: ary[0].name,
            body: '',
            memo: '',
        });
        const u = config.users.filter(u => u.id === ary[0].author)[0];
        if (u) {
            page.user = u.user_code;
        }
        await page.save();
        uploadAttachment(dir, page, ary[0].content);
    }
    await generatePage(dir, config, note, ary[0].child);
    // childがない場合はページとして作成
    // childがある場合は、フォルダを作成
    // フォルダの中に「概要」ページを作成して、内容を記述
    // フォルダの中に子要素のページを作成
})(options);
