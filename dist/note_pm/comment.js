"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const attachment_1 = __importDefault(require("./attachment"));
const page_1 = __importDefault(require("./page"));
const dayjs_1 = __importDefault(require("dayjs"));
class Comment {
    constructor(params) {
        this.page_code = '';
        this.body = '';
        this.user = '';
        this.created_at = '';
        this.comment_number = null;
        this.setParams(params);
    }
    setParams(params) {
        this.page_code = params.page_code;
        this.body = params.body;
        this.user = params.user;
        this.created_at = params.created_at;
        if (params.comment_number) {
            this.comment_number = params.comment_number;
        }
    }
    images() {
        const ary = this.body.replace(/.*?!\[.*?\]\((.*?)\).*?/gs, "$1\n").split(/\n/);
        const ary2 = this.body.replace(/.*?<img .*?src=("|')(.*?)("|').*?>.*?/gs, "$2\n").split(/\n/);
        return ary.concat(ary2).filter(s => s.match(/^(http.?:\/\/|\.\.)/));
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
        const user = Comment.NotePM.findUser(this.user);
        const response = await Comment.NotePM.fetch('POST', `/pages/${this.page_code}/comments`, {
            body: this.body,
            created_at: dayjs_1.default(this.created_at).format('YYYY-MM-DDTHH:mm:ssZ'),
            user
        });
        const params = response.comment;
        this.setParams(params);
        return this;
    }
    async update() {
        const response = await Comment.NotePM.fetch('PATCH', `/pages/${this.page_code}/comments/${this.comment_number}`, {
            body: this.body
        });
        const params = response.comment;
        if (params) {
            this.setParams(params);
        }
        return this;
    }
    async updateImageBody(q, page, dir = '') {
        const images = this.images();
        const urls = [];
        console.log(`      コメントに画像をアップロードします`);
        for (const url of images) {
            const filePath = q ? q.filePath(url) : `${dir}${url}`;
            const fileName = url.replace(/^.*\/(.*)(\?|$)/, "$1");
            try {
                const attachment = await attachment_1.default.add(page, fileName, filePath);
                urls.push({
                    url,
                    download_url: `https://${page_1.default.NotePM.domain}.notepm.jp/private/${attachment.file_id}?ref=thumb`
                });
            }
            catch (e) {
                console.log(`      ${fileName}のアップロードをスキップしました`);
            }
        }
        urls.forEach(params => {
            const r = new RegExp(params.url, 'gs');
            this.body = this.body.replace(r, params.download_url);
        });
        await this.save();
    }
}
exports.default = Comment;
