"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const locate_chrome_1 = __importDefault(require("locate-chrome"));
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const crypto_1 = __importDefault(require("crypto"));
const parse_md_1 = __importDefault(require("parse-md"));
const func_1 = require("../func");
class Esa {
    constructor(domain, dir) {
        this.domain = '';
        this.dir = '';
        this.browser = null;
        this.files = {};
        this.domain = domain;
        this.dir = dir;
    }
    async dirs(dir = '') {
        dir = dir === '' ? this.dir : dir;
        if (!dir.match(/.*\/$/))
            dir = `${dir}/`;
        const res = [];
        const ary = await util_1.promisify(fs_1.default.readdir)(dir);
        for (const filePath of ary) {
            if (filePath.match(/^\./))
                continue;
            const path = `${dir}${filePath}`;
            if (`${this.dir}/Templates` === path)
                continue;
            const file = await util_1.promisify(fs_1.default.stat)(path);
            if (!file.isDirectory())
                continue;
            const subDir = {
                name: filePath.normalize('NFC'),
            };
            const child = await this.dirs(path);
            if (child) {
                subDir.dirs = child;
            }
            res.push(subDir);
        }
        return res;
    }
    async downloadImage() {
        await this.createDir();
        const images = this.getImage();
        const p = [];
        images.forEach(image => {
            p.push(this.download(image));
        });
        await Promise.all(p);
    }
    getImage() {
        let images = this.articles.map(a => a.getImage()).flat();
        images = images.concat(this.projects.map(p => p.getImage()).flat());
        return images;
    }
    async createDir() {
        const fileDir = this.attachmentDir();
        try {
            await util_1.promisify(fs_1.default.stat)(fileDir);
        }
        catch {
            // No directory
            await util_1.promisify(fs_1.default.mkdir)(fileDir);
        }
    }
    attachmentDir() {
        return `${this.getDir()}/attachments`;
    }
    getDir() {
        if (this.dir.match(/.*\/$/)) {
            return this.dir;
        }
        else {
            return `${this.dir}/`;
        }
    }
    async loadFiles(dir = '') {
        dir = dir === '' ? this.dir : dir;
        if (!dir.match(/.*\/$/))
            dir = `${dir}/`;
        const res = {};
        const ary = await util_1.promisify(fs_1.default.readdir)(dir);
        for (const filePath of ary) {
            if (filePath.match(/^\./))
                continue;
            const path = `${dir}${filePath}`;
            if (`${this.dir}/Templates` === path)
                continue;
            const file = await util_1.promisify(fs_1.default.stat)(path);
            if (file.isDirectory()) {
                const files = await this.loadFiles(path);
                for (const key in files) {
                    res[key] = files[key];
                }
            }
            else {
                const contents = await util_1.promisify(fs_1.default.readFile)(path, 'utf-8');
                res[path] = parse_md_1.default(contents);
            }
        }
        this.files = res;
        return res;
    }
    async launchChrome() {
        try {
            // ブラウザ起動
            this.browser = await puppeteer_core_1.default.launch({
                headless: false,
                executablePath: await this.getChromePath(),
                ignoreDefaultArgs: ['--guest', '--disable-extensions', '--start-fullscreen', '--incognito',],
                slowMo: 150,
            });
            const page = await this.browser.newPage();
            const navigationPromise = page.waitForNavigation();
            await page.goto(this.getUrl());
            await page.setViewport({ width: 1200, height: 900 });
            await navigationPromise;
            // ログイン待ち
            await page.waitForFunction(() => {
                return document.querySelector('.btn-new__label');
            }, { timeout: 0 });
            return true;
        }
        catch (e) {
            func_1.debugPrint(e);
            return false;
        }
    }
    async open() {
        await this.launchChrome();
    }
    close() {
        var _a;
        (_a = this.browser) === null || _a === void 0 ? void 0 : _a.close();
    }
    getUrl() {
        if (this.domain.match(/https:\/\//)) {
            return this.domain;
        }
        else {
            return `https://${this.domain}`;
        }
    }
    async getChromePath() {
        return await locate_chrome_1.default();
    }
    async download(url) {
        const filePath = this.filePath(url);
        try {
            const bol = fs_1.default.statSync(filePath);
            return true;
        }
        catch (e) { }
        const buffer = await this.getBinary(url);
        await util_1.promisify(fs_1.default.writeFile)(filePath, buffer);
        return true;
    }
    filePath(url) {
        const fileDir = this.attachmentDir();
        const hash = crypto_1.default.createHmac('sha256', 'notepm')
            .update(url)
            .digest('hex');
        return `${fileDir}/${hash}`;
    }
    async getBinary(url) {
        const page = await this.browser.newPage();
        let loadPromise = page.waitForNavigation();
        const bin = await page.goto(url);
        await loadPromise;
        return await bin.buffer();
    }
}
exports.default = Esa;
