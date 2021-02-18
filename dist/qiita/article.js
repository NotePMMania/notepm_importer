"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const group_1 = __importDefault(require("./group"));
const user_1 = __importDefault(require("./user"));
class Article {
    constructor(params) {
        var _a, _b;
        this.rendered_body = '';
        this.body = '';
        this.coediting = false;
        this.comments_count = 0;
        this.created_at = '';
        this.id = '';
        this.likes_count = 0;
        this.private = true;
        this.reactions_count = 0;
        this.title = '';
        this.updated_at = '';
        this.url = '';
        this.page_views_count = 0;
        this.group = null;
        this.tags = [];
        this.user = null;
        this.comments = [];
        this.id = params.id;
        this.rendered_body = params.rendered_body;
        this.body = params.body;
        this.coediting = params.coediting;
        this.comments_count = params.comments_count;
        this.created_at = params.created_at;
        this.likes_count = params.likes_count;
        this.private = true;
        this.reactions_count = params.reactions_count;
        this.title = params.title;
        this.updated_at = params.updated_at;
        this.url = params.url;
        this.page_views_count = params.page_views_count;
        if (params.group) {
            this.group = new group_1.default(params.group);
        }
        this.user = new user_1.default(params.user);
        (_a = params.tags) === null || _a === void 0 ? void 0 : _a.forEach(t => { var _a; return (_a = this.tags) === null || _a === void 0 ? void 0 : _a.push(t); });
        (_b = params.comments) === null || _b === void 0 ? void 0 : _b.forEach(c => { var _a; return (_a = this.comments) === null || _a === void 0 ? void 0 : _a.push(c); });
    }
    getImage() {
        var _a;
        const images = Article.QiitaTeam.regexpImage(this.rendered_body);
        const comments = (_a = this.comments) === null || _a === void 0 ? void 0 : _a.map(c => Article.QiitaTeam.regexpImage(c.rendered_body)).flat();
        if (!comments)
            return images;
        return comments.length === 0 ? images : images.concat(comments);
    }
    getAttachment() {
        return Article.QiitaTeam.regexpAttachment(this.rendered_body);
    }
}
exports.default = Article;
