"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const locate_chrome_1 = __importDefault(require("locate-chrome"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const util_1 = require("util");
const article_1 = __importDefault(require("./article"));
const group_1 = __importDefault(require("./group"));
const project_1 = __importDefault(require("./project"));
class QiitaTeam {
    constructor(domain, dir) {
        this.domain = '';
        this.dir = '';
        this.articles = [];
        this.groups = [];
        this.projects = [];
        this.page = null;
        this.browser = null;
        this.domain = domain;
        this.dir = dir;
        article_1.default.QiitaTeam = this;
        project_1.default.QiitaTeam = this;
        group_1.default.QiitaTeam = this;
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
                return document.querySelector('.sharedHeader_newItem_btn');
            }, { timeout: 0 });
            return true;
        }
        catch (e) {
            console.log(e);
            return false;
        }
    }
    load() {
        const p = [];
        p.push(this.loadArticles());
        p.push(this.loadGroups());
        p.push(this.loadProjects());
        return Promise.all(p);
    }
    async loadArticles() {
        const dir = `${this.getDir()}articles`;
        const articles = await this.loadFile(dir);
        articles.forEach(a => this.articles.push(new article_1.default(a)));
    }
    async loadGroups() {
        const dir = `${this.getDir()}groups`;
        const groups = await this.loadFile(dir);
        groups.forEach(a => this.groups.push(new group_1.default(a)));
    }
    async loadProjects() {
        const dir = `${this.getDir()}projects`;
        const projects = await this.loadFile(dir);
        projects.forEach(a => this.projects.push(new project_1.default(a)));
    }
    async loadFile(dir) {
        const ary = await util_1.promisify(fs_1.default.readdir)(dir);
        const promises = [];
        ary.forEach((fileName) => {
            if (fileName.match(/.*\.json$/)) {
                promises.push(util_1.promisify(fs_1.default.readFile)(`${dir}/${fileName}`, 'utf-8'));
            }
        });
        const res = await Promise.all(promises);
        return res.map(str => JSON.parse(str));
    }
    getDir() {
        if (this.dir.match(/.*\/$/)) {
            return this.dir;
        }
        else {
            return `${this.dir}/`;
        }
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
    getImage() {
        let images = this.articles.map(a => a.getImage()).flat();
        images = images.concat(this.projects.map(p => p.getImage()).flat());
        return images;
    }
    getAttachment() {
        let attachments = this.articles.map(a => a.getAttachment()).flat();
        attachments = attachments.concat(this.projects.map(p => p.getAttachment()).flat());
        return attachments;
    }
    regexpImage(str) {
        const ary = str.replace(/.*?<img .*?src="(.*?)".*?>/gs, "$1\n").split(/\n/);
        return ary.filter(s => s.match(/^https?:\/\//));
    }
    regexpAttachment(str) {
        const ary = str.replace(/.*<a .*?href="(https:\/\/.*?\.qiita.com\/files\/.*?\?dl=1)".*/ms, "$1\n").split(/\n/);
        return ary.filter(s => s.match(/^https:\/\//));
    }
    async upload(page) {
    }
    async downloadAttachment() {
        await this.createDir();
        const files = this.getAttachment();
        const p = [];
        files.forEach(file => {
            p.push(this.download(file));
        });
        await Promise.all(p);
    }
    async open() {
        await this.launchChrome();
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
    async downloadImage() {
        await this.createDir();
        const images = this.getImage();
        const p = [];
        images.forEach(image => {
            p.push(this.download(image));
        });
        await Promise.all(p);
    }
    close() {
        var _a;
        return (_a = this.browser) === null || _a === void 0 ? void 0 : _a.close();
    }
    attachmentDir() {
        return `${this.getDir()}/attachments`;
    }
    filePath(url) {
        const fileDir = this.attachmentDir();
        const hash = crypto_1.default.createHmac('sha256', 'notepm')
            .update(url)
            .digest('hex');
        return `${fileDir}/${hash}`;
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
    async getBinary(url) {
        const page = await this.browser.newPage();
        let loadPromise = page.waitForNavigation();
        const bin = await page.goto(url);
        await loadPromise;
        return await bin.buffer();
    }
}
exports.default = QiitaTeam;
