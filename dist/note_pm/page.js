"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("./user"));
const attachment_1 = __importDefault(require("./attachment"));
class Page {
    constructor(params) {
        this.page_code = '';
        this.note_code = '';
        this.folder_id = undefined;
        this.title = '';
        this.body = '';
        this.memo = '';
        this.created_at = '';
        this.updated_at = '';
        this.created_by = null;
        this.updated_by = null;
        this.tags = [];
        this.users = [];
        this.user = null;
        this.setParams(params);
    }
    setParams(params) {
        this.page_code = params.page_code;
        this.note_code = params.note_code;
        this.folder_id = params.folder_id;
        this.title = params.title;
        this.body = params.body;
        this.memo = params.memo;
        this.created_at = params.created_at;
        this.updated_at = params.updated_at;
        if (params.created_by) {
            this.created_by = new user_1.default(params.created_by);
        }
        if (params.updated_by) {
            this.updated_by = new user_1.default(params.updated_by);
        }
        if (params.tags) {
            params.tags.forEach(t => {
                if (this.tags.indexOf(t.name) > -1)
                    return;
                this.tags.push(t.name);
            });
        }
        if (params.users) {
            params.users.forEach(u => this.users.push(new user_1.default(u)));
        }
    }
    async save() {
        if (this.page_code) {
            const params = await this.update();
            this.setParams(params);
        }
        else {
            const params = await this.create();
            this.setParams(params);
        }
        return this;
    }
    async create() {
        const response = await Page.NotePM.fetch('POST', `/pages`, {
            note_code: this.note_code,
            folder_id: this.folder_id,
            title: this.title,
            body: this.body,
            memo: this.memo,
            user: Page.NotePM.findUser(this.user) || 'NotePM-bot',
            tags: this.tags,
        });
        if (response.messages)
            throw new Error(response.messages.join(','));
        return await response.page;
    }
    async update() {
        const response = await Page.NotePM.fetch('PATCH', `/pages/${this.page_code}`, {
            note_code: this.note_code,
            folder_id: this.folder_id,
            title: this.title,
            body: this.body,
            memo: this.memo,
            tags: this.tags,
        });
        if (response.messages)
            throw new Error(`Error: ${response.messages.join(', ')} page_code ${this.page_code}`);
        return await response;
    }
    hasImage() {
        const images = this.images();
        return images.length > 0;
    }
    images() {
        const ary = this.body.replace(/.*?!\[.*?\]\((.*?)\).*?/gs, "$1\n").split(/\n/);
        const ary2 = this.body.replace(/.*?<img .*?src="(.*?)".*?>.*?/gs, "$1\n").split(/\n/);
        return ary.concat(ary2).filter(s => s.match(/^http.?:\/\//));
    }
    async findOrCreate(note, title, body, memo, tags, folder) {
        const response1 = await Page.NotePM.fetch('GET', `/pages`);
        const page = response1.pages.filter((page) => page.title === title)[0];
        if (page)
            return page;
    }
    async updateImageBody(q) {
        const images = this.images();
        const urls = await Promise.all(images.map(url => {
            return new Promise((res, rej) => {
                const filePath = q.filePath(url);
                const fileName = url.replace(/^.*\/(.*)(\?|$)/, "$1");
                attachment_1.default.add(this, fileName, filePath)
                    .then(attachment => {
                    res({
                        url,
                        download_url: `https://${Page.NotePM.domain}.notepm.jp/private/${attachment.file_id}?ref=thumb`
                    });
                });
            });
        }));
        urls.forEach(params => {
            const r = new RegExp(params.url, 'gs');
            this.body = this.body.replace(r, params.download_url);
        });
        await this.save();
    }
}
exports.default = Page;
