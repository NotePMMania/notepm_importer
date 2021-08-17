"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("./user"));
const attachment_1 = __importDefault(require("./attachment"));
const dayjs_1 = __importDefault(require("dayjs"));
class Page {
    constructor(params) {
        this.page_code = '';
        this.note_code = '';
        this.folder_id = undefined;
        this.title = '';
        this.body = '';
        this.memo = '';
        this.created_at = undefined;
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
        this.user = params.user;
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
        const user = Page.NotePM.findUser(this.user);
        const response = await Page.NotePM.fetch('POST', `/pages`, {
            note_code: this.note_code,
            folder_id: this.folder_id,
            title: this.title,
            body: this.body,
            memo: this.memo,
            user: user || 'NotePM-bot',
            created_at: dayjs_1.default(this.created_at).format('YYYY-MM-DDTHH:mm:ssZ'),
            tags: this.tags,
        });
        if (response.messages)
            throw new Error(`Error: ${response.messages.join(', ')} タイトル ${this.title} page_code ${this.page_code}`);
        return await response.page;
    }
    async update() {
        const user = Page.NotePM.findUser(this.user);
        const response = await Page.NotePM.fetch('PATCH', `/pages/${this.page_code}`, {
            note_code: this.note_code,
            folder_id: this.folder_id,
            title: this.title,
            body: this.body,
            memo: this.memo,
            user: user || 'NotePM-bot',
            tags: this.tags,
        });
        if (response.messages)
            throw new Error(`Error: ${response.messages.join(', ')} page_code ${this.page_code}`);
        return await response.page;
    }
    hasImage() {
        const images = this.images();
        return images.length > 0;
    }
    images() {
        const ary = this.body.replace(/.*?!\[.*?\]\((.*?)\).*?/gs, "$1\n").split(/\n/);
        const ary2 = this.body.replace(/.*?<img .*?src=("|')(.*?)("|').*?>.*?/gs, "$2\n").split(/\n/);
        const ary3 = this.body.replace(/\[!\[.*?\]\((\.\.\/attachments\/.*?)\)/gs, "$1\n").split(/\n/);
        return ary.concat(ary2).concat(ary3).filter(s => s.match(/^(http.?:\/\/|\.\.)/));
    }
    async findOrCreate(note, title, body, memo, tags, folder) {
        const response1 = await Page.NotePM.fetch('GET', `/pages`);
        const page = response1.pages.filter((page) => page.title === title)[0];
        if (page)
            return page;
    }
    async updateImageBody(q, dir = '') {
        const images = this.images();
        const urls = [];
        for (const url of images) {
            const filePath = q ? q.filePath(url) : `${dir}${url}`;
            const fileName = url.replace(/^.*\/(.*)(\?|$)/, "$1");
            console.log(`    ${this.title}に画像をアップロードします。 ${fileName}`);
            try {
                const attachment = await attachment_1.default.add(this, fileName, filePath);
                urls.push({
                    url,
                    download_url: `https://${Page.NotePM.domain}.notepm.jp/private/${attachment.file_id}?ref=thumb`
                });
            }
            catch (e) {
                console.log(`      アップロードをスキップしました。 ${fileName}`);
            }
        }
        urls.forEach(params => {
            const r = new RegExp(params.url, 'gs');
            this.body = this.body.replace(r, params.download_url);
        });
        console.log(`    ${this.title}を更新します`);
        await this.save();
    }
}
exports.default = Page;
