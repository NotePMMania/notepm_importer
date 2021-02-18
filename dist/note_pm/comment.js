"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const attachment_1 = __importDefault(require("./attachment"));
class Comment {
    constructor(params) {
        this.page_code = '';
        this.body = '';
        this.comment_number = null;
        this.setParams(params);
    }
    setParams(params) {
        this.page_code = params.page_code;
        this.body = params.body;
        if (params.comment_number) {
            this.comment_number = params.comment_number;
        }
    }
    images() {
        const ary = this.body.replace(/.*?!\[.*?\]\((.*?)\).*?/gs, "$1\n").split(/\n/);
        const ary2 = this.body.replace(/.*?<img .*?src="(.*?)".*?>.*?/gs, "$1\n").split(/\n/);
        return ary.concat(ary2).filter(s => s.match(/^http.?:\/\//));
    }
    async save() {
        if (this.comment_number) {
            await this.update();
        }
        else {
            await this.create();
        }
    }
    async create() {
        const response = await Comment.NotePM.fetch('POST', `/pages/${this.page_code}/comments`, {
            body: this.body
        });
        const params = response.comment;
        this.setParams(params);
        return this;
    }
    async update() {
        console.log(`/pages/${this.page_code}/comments/${this.comment_number}`);
        const response = await Comment.NotePM.fetch('PATCH', `/pages/${this.page_code}/comments/${this.comment_number}`, {
            body: this.body
        });
        console.log(response);
        const params = response.comment;
        this.setParams(params);
        return this;
    }
    async updateImageBody(q, page) {
        const images = this.images();
        const urls = await Promise.all(images.map(url => {
            return new Promise((res, rej) => {
                const filePath = q.filePath(url);
                const fileName = url.replace(/^.*\/(.*)(\?|$)/, "$1");
                attachment_1.default.add(page, fileName, filePath)
                    .then(attachment => {
                    res({
                        url,
                        download_url: `https://${Comment.NotePM.domain}.notepm.jp/private/${attachment.file_id}?ref=thumb`
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
exports.default = Comment;
