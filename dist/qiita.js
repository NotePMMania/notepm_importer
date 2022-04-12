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
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
const qiita_1 = __importDefault(require("./qiita/"));
const note_pm_1 = __importStar(require("./note_pm/"));
const util_1 = require("util");
const user_1 = __importDefault(require("./note_pm/user"));
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    // .option('-d, --domain [domain]', 'Qiita::Teamのドメインを指定してください')
    .option('-q --qiita [token]', 'Qiita::Teamへのアクセストークンを指定してください')
    .option('-p, --path [dir]', 'エクスポートしたZipファイルを展開したフォルダへのパスを指定してください')
    .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
    .option('-u, --user-yaml [yamlPath]', 'ユーザ設定のファイルを指定してください')
    .parse();
const options = commander_1.program.opts();
const createImportNote = async () => {
    const note = new note_pm_1.Note({
        name: 'Qiita::Teamからのインポート用',
        description: 'Qiita::Teamからインポートしたページが入ります',
        scope: 'private',
    });
    await note.save();
    return note;
};
const executeProject = async (q) => {
    const note = new note_pm_1.Note({
        name: 'プロジェクト',
        description: 'プロジェクトから取り込んだノートです',
        scope: 'private',
    });
    await note.save();
    // プロジェクトページのアップロード
    const promises = [];
    q.projects.forEach(p => {
        const page = new note_pm_1.Page(p.toPage());
        page.note_code = note.note_code;
        if (p.user) {
            page.user = p.user.id;
        }
        promises.push(page.save());
    });
    const pages = await Promise.all(promises);
    // 画像添付の反映
    pages.forEach(async (page) => {
        if (!page.hasImage())
            return;
        await page.updateImageBody(q);
    });
};
const prepareTag = async (n, q) => {
    await n.getTags();
    const names = Array.from(new Set(q.articles.map(a => { var _a; return (_a = a.tags) === null || _a === void 0 ? void 0 : _a.map(a => a.name); }).flat()));
    const tagNames = [];
    names.forEach(t => {
        const bol = n.tags.filter(tag => tag.name == t)[0];
        if (!bol) {
            tagNames.push(t);
        }
    });
    if (tagNames.length === 0)
        return;
    const tags = await Promise.all(tagNames.map(async (name) => {
        const t = new note_pm_1.Tag({
            name: name
        });
        await t.save();
        return t;
    }));
    tags.forEach(t => n.tags.push(t));
};
(async (options) => {
    var _a, _b, _c;
    // if (!options.domain || !options.domain.match(/.*\.qiita\.com/) ) throw new Error('Qiitaのドメインが指定されていない、または qiita.com で終わっていません');
    if (!options.path)
        throw `取り込み対象のディレクトリが指定されていません（-p または --path）`;
    if (!options.qiita)
        throw `Qiita Teamのアクセストークンが指定されていません（-q または --qiita）`;
    if (!options.accessToken)
        throw `NotePMのアクセストークンが指定されていません（-a または --access-token）`;
    if (!options.team)
        throw `NotePMのドメインが指定されていません（-t または --team）`;
    if (!options.userYaml)
        throw `ユーザー設定用YAMLファイルが指定されていません（-u または --user-yaml）`;
    console.log(`取り込み対象ディレクトリ： ${options.path}`);
    console.log(`Qiita Teamへのアクセストークン： ${options.qiita}`);
    console.log(`NotePMのアクセストークン： ${options.accessToken}`);
    console.log(`NotePMのドメイン： ${options.team}.notepm.jp`);
    console.log(`ユーザー設定用YAMLファイル： ${options.userYaml}`);
    process.exit(0);
    const str = await util_1.promisify(fs_1.default.readFile)(options.userYaml, 'utf-8');
    const config = await js_yaml_1.default.load(str);
    const q = new qiita_1.default(options.path, options.qiita);
    const n = new note_pm_1.default(options.accessToken, options.team);
    await q.load();
    // ブラウザを立ち上げて画像をダウンロード
    // console.log('ブラウザを立ち上げます。Qiita Teamへログインしてください');
    // await q.open();
    console.log('画像をダウンロードします');
    await q.downloadImage();
    await q.downloadAttachment();
    // await q.close();
    console.log('画像をダウンロードしました');
    console.log('ユーザ一覧を読み込みます');
    await n.getUsers();
    config.users.forEach(u => {
        n.users.push(new user_1.default({
            user_code: u.user_code,
            name: u.id,
        }));
    });
    console.log('ユーザ一覧の読み込み完了');
    // タグを準備
    console.log('タグを準備します');
    await prepareTag(n, q);
    console.log('グループがない記事を取り込む用のノートを準備します');
    const baseNote = await createImportNote();
    // プロジェクト記事の取り込み
    console.log('プロジェクト記事をインポートします');
    if (q.projects)
        executeProject(q);
    // グループごとにノートを作成
    console.log('グループのノートを作成します');
    const groups = await Promise.all(q.groups.map(async (g) => {
        var _a;
        const note = new note_pm_1.Note({
            name: g.name,
            description: 'Qiita::Teamからのインポート',
            scope: 'private'
        });
        (_a = g.users) === null || _a === void 0 ? void 0 : _a.forEach(u => {
            var _a;
            const user = n.findUser(u.id);
            if (user) {
                (_a = note.users) === null || _a === void 0 ? void 0 : _a.push(user);
            }
        });
        console.log(`  ${g.name}を作成します`);
        await note.save();
        return note;
    }));
    console.log('ページを作成します');
    for (const a of q.articles) {
        const page = new note_pm_1.Page({
            title: a.title,
            body: a.body,
            created_at: new Date(a.created_at),
            memo: 'Qiita::Teamからインポートしました',
        });
        console.log(`  タイトル：${page.title} `);
        if (a.group) {
            page.note_code = groups.filter(g => { var _a; return g.name === ((_a = a.group) === null || _a === void 0 ? void 0 : _a.name); })[0].note_code;
        }
        else {
            page.note_code = baseNote.note_code;
        }
        console.log(`    ノートコードは${page.note_code}になります`);
        if (a.tags) {
            a.tags.forEach(t => { var _a; return (_a = page.tags) === null || _a === void 0 ? void 0 : _a.push(t.name); });
        }
        if (a.user) {
            page.user = a.user.id;
        }
        console.log(`    ノートを保存します`);
        await page.save();
        console.log(`    ノートを保存しました ${page.page_code}`);
        if (page.hasImage()) {
            console.log(`    画像があります。ページ内容を更新します`);
            await page.updateImageBody(q);
            console.log(`    画像のURLに合わせてページ内容を更新しました`);
        }
        // コメントの反映
        if (((_a = a.comments) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            if (!page.page_code) {
                // console.error(`データがありません： ${JSON.stringify(a)}`);
                console.log(`データがありません ${page.title} : ${a.title}`);
                return;
            }
            console.log(`  コメントが${(_b = a.comments) === null || _b === void 0 ? void 0 : _b.length}件あります（ページコード： ${page.page_code}） ${page.title}`);
            for (const c of a.comments) {
                const comment = new note_pm_1.Comment({
                    page_code: page.page_code,
                    created_at: c.created_at,
                    user: (_c = c.user) === null || _c === void 0 ? void 0 : _c.id,
                    body: c.body
                });
                console.log(`  コメントを保存します`);
                await comment.save();
                if (comment.images().length > 0) {
                    console.log(`  コメントに画像があります。内容を更新します`);
                    await comment.updateImageBody(q, page);
                }
            }
            ;
        }
    }
    console.log('インポート終了しました');
})(options);
