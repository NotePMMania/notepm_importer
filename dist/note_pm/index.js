"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attachment = exports.Comment = exports.User = exports.Note = exports.Tag = exports.Page = exports.Folder = void 0;
const folder_1 = __importDefault(require("./folder"));
exports.Folder = folder_1.default;
const page_1 = __importDefault(require("./page"));
exports.Page = page_1.default;
const tag_1 = __importDefault(require("./tag"));
exports.Tag = tag_1.default;
const note_1 = __importDefault(require("./note"));
exports.Note = note_1.default;
const form_data_1 = __importDefault(require("form-data"));
const node_fetch_with_proxy_1 = __importDefault(require("node-fetch-with-proxy"));
const user_1 = __importDefault(require("./user"));
exports.User = user_1.default;
const attachment_1 = __importDefault(require("./attachment"));
exports.Attachment = attachment_1.default;
const comment_1 = __importDefault(require("./comment"));
exports.Comment = comment_1.default;
const func_1 = require("../func");
const sleep = (msec) => new Promise(resolve => setTimeout(resolve, msec));
class NotePM {
    constructor(accessToken, domain) {
        this.accessToken = '';
        this.domain = '';
        this.url = '';
        this.tags = [];
        this.users = [];
        this.accessToken = accessToken;
        this.domain = domain;
        this.url = `https://${this.domain}.notepm.jp/api/v1`;
        folder_1.default.NotePM = this;
        page_1.default.NotePM = this;
        tag_1.default.NotePM = this;
        note_1.default.NotePM = this;
        user_1.default.NotePM = this;
        attachment_1.default.NotePM = this;
        comment_1.default.NotePM = this;
    }
    async getUsers() {
        this.users = await user_1.default.fetchAll();
    }
    async getTags() {
        func_1.debugPrint(`  NotePMからタグを取得します`);
        this.tags = await tag_1.default.fetchAll();
        func_1.debugPrint(`  NotePMよりタグを取得しました`);
    }
    findUser(name) {
        const user = this.users.filter(u => u.name === name || u.user_code === name)[0];
        return user ? user.user_code : null;
    }
    async fetch(method, path, body) {
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
        };
        if (!(body instanceof form_data_1.default)) {
            headers['Content-Type'] = 'application/json';
        }
        await sleep(1000);
        const url = `${this.url}${path}`;
        func_1.debugPrint(`${method}: ${url}`);
        if (method === 'GET') {
            const res = await node_fetch_with_proxy_1.default(url, { headers });
            return await res.json();
        }
        if (method === 'POST') {
            if (!(body instanceof form_data_1.default)) {
                body = JSON.stringify(body);
            }
            const res = await node_fetch_with_proxy_1.default(url, { method, headers, body });
            return await res.json();
        }
        if (method === 'PATCH') {
            if (!(body instanceof form_data_1.default)) {
                body = JSON.stringify(body);
            }
            const res = await node_fetch_with_proxy_1.default(url, { method, headers, body });
            return await res.json();
        }
        if (method === 'DELETE') {
            const res = await node_fetch_with_proxy_1.default(url, { method, headers });
            const text = await res.text();
            if (text === '')
                return {};
        }
    }
}
exports.default = NotePM;
