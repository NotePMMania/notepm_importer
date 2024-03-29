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
const func_1 = require("./func");
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
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const prepareTag = async (n, q) => {
    func_1.debugPrint(`  タグを取得します`);
    try {
        await n.getTags();
    }
    catch (e) {
        func_1.debugPrint(`  タグの取得に失敗しました。終了します。`);
        process.exit(1);
    }
    func_1.debugPrint(`  Qiita記事からのタグを取得します`);
    const names = Array.from(new Set(q.articles.map(a => { var _a; return (_a = a.tags) === null || _a === void 0 ? void 0 : _a.map(a => a.name); }).flat()));
    func_1.debugPrint(`  Qiita記事から${names.length}件のタグを取得しました`);
    const tagNames = [];
    func_1.debugPrint(`  未設定のタグがあるか確認します`);
    names.forEach(t => {
        const bol = n.tags.filter(tag => tag.name == t)[0];
        if (!bol) {
            tagNames.push(t);
        }
    });
    func_1.debugPrint(`  未設定のタグは${tagNames.length}件です`);
    if (tagNames.length === 0)
        return;
    const tags = [];
    for (const name of tagNames) {
        func_1.debugPrint(`    タグ${name}を作成します`);
        const t = new note_pm_1.Tag({
            name: name
        });
        await t.save();
        func_1.debugPrint(`    タグ${name}を作成しました`);
        sleep(1000);
        tags.push(t);
    }
    tags.forEach(t => n.tags.push(t));
    func_1.debugPrint(`  タグの準備完了です`);
};
(async (options) => {
    var _a, _b, _c, _d;
    // if (!options.domain || !options.domain.match(/.*\.qiita\.com/) ) throw new Error('Qiitaのドメインが指定されていない、または qiita.com で終わっていません');
    if (!options.path) {
        func_1.debugPrint(`取り込み対象のディレクトリが指定されていません（-p または --path）`);
        process.exit(1);
    }
    if (!options.qiita) {
        func_1.debugPrint(`Qiita Teamのアクセストークンが指定されていません（-q または --qiita）`);
        process.exit(1);
    }
    if (!options.accessToken) {
        func_1.debugPrint(`NotePMのアクセストークンが指定されていません（-a または --access-token）`);
        process.exit(1);
    }
    if (!options.team) {
        func_1.debugPrint(`NotePMのドメインが指定されていません（-t または --team）`);
        process.exit(1);
    }
    if (!options.userYaml) {
        func_1.debugPrint(`ユーザー設定用YAMLファイルが指定されていません（-u または --user-yaml）`);
        process.exit(1);
    }
    func_1.debugPrint(`取り込み対象ディレクトリ： ${options.path}`);
    func_1.debugPrint(`Qiita Teamへのアクセストークン： ${options.qiita}`);
    func_1.debugPrint(`NotePMのアクセストークン： ${options.accessToken}`);
    func_1.debugPrint(`NotePMのドメイン： ${options.team}.notepm.jp`);
    func_1.debugPrint(`ユーザー設定用YAMLファイル： ${options.userYaml}`);
    const str = await util_1.promisify(fs_1.default.readFile)(options.userYaml, 'utf-8');
    const config = await js_yaml_1.default.load(str);
    const q = new qiita_1.default(options.path, options.qiita);
    const n = new note_pm_1.default(options.accessToken, options.team);
    await q.load();
    // ブラウザを立ち上げて画像をダウンロード
    // debugPrint('ブラウザを立ち上げます。Qiita Teamへログインしてください');
    // await q.open();
    func_1.debugPrint('画像をダウンロードします');
    await q.downloadImage();
    await q.downloadAttachment();
    // await q.close();
    func_1.debugPrint('画像をダウンロードしました');
    func_1.debugPrint('ユーザ一覧を読み込みます');
    await n.getUsers();
    config.users.forEach(u => {
        n.users.push(new user_1.default({
            user_code: u.user_code,
            name: u.id,
        }));
    });
    func_1.debugPrint('ユーザ一覧の読み込み完了');
    // タグを準備
    func_1.debugPrint('タグを準備します');
    await prepareTag(n, q);
    func_1.debugPrint('グループがない記事を取り込む用のノートを準備します');
    const baseNote = await createImportNote();
    // プロジェクト記事の取り込み
    func_1.debugPrint('プロジェクト記事をインポートします');
    if (q.projects)
        executeProject(q);
    // グループごとにノートを作成
    func_1.debugPrint('グループのノートを作成します');
    const groups = [];
    for (const g of q.groups) {
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
        func_1.debugPrint(`  ${g.name}を作成します`);
        await note.save();
        func_1.debugPrint(`  ${g.name}を作成しました`);
        groups.push(note);
    }
    func_1.debugPrint('グループのノートを作成しました');
    func_1.debugPrint('ページを作成します');
    for (const a of q.articles) {
        const page = new note_pm_1.Page({
            title: a.title,
            body: a.body,
            created_at: new Date(a.created_at),
            memo: 'Qiita::Teamからインポートしました',
        });
        func_1.debugPrint(`  タイトル：${page.title} `);
        if (a.group) {
            page.note_code = groups.filter(g => { var _a; return g.name === ((_a = a.group) === null || _a === void 0 ? void 0 : _a.name); })[0].note_code;
        }
        else {
            page.note_code = baseNote.note_code;
        }
        func_1.debugPrint(`    ノートコードは${page.note_code}になります`);
        if (a.tags) {
            a.tags.forEach(t => { var _a; return (_a = page.tags) === null || _a === void 0 ? void 0 : _a.push(t.name); });
        }
        if (a.user) {
            page.user = a.user.id;
        }
        func_1.debugPrint(`    ノートを保存します`);
        await page.save();
        func_1.debugPrint(`    ノートを保存しました ${page.page_code}`);
        if (page.hasImage()) {
            func_1.debugPrint(`    画像があります。ページ内容を更新します`);
            await page.updateImageBody(q);
            func_1.debugPrint(`    画像のURLに合わせてページ内容を更新しました`);
        }
        // コメントの反映
        if (((_b = a.comments) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            if (!page.page_code) {
                // debugPrint(`データがありません： ${JSON.stringify(a)}`);
                func_1.debugPrint(`データがありません ${page.title} : ${a.title}`);
                return;
            }
            func_1.debugPrint(`  コメントが${(_c = a.comments) === null || _c === void 0 ? void 0 : _c.length}件あります（ページコード： ${page.page_code}） ${page.title}`);
            for (const c of a.comments) {
                const comment = new note_pm_1.Comment({
                    page_code: page.page_code,
                    created_at: c.created_at,
                    user: (_d = c.user) === null || _d === void 0 ? void 0 : _d.id,
                    body: c.body
                });
                func_1.debugPrint(`  コメントを保存します`);
                await comment.save();
                if (comment.images().length > 0) {
                    func_1.debugPrint(`  コメントに画像があります。内容を更新します`);
                    await comment.updateImageBody(q, page);
                }
            }
            ;
        }
    }
    func_1.debugPrint('インポート終了しました');
})(options);
