"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
class Docbase {
    constructor(dir) {
        this.dir = '';
        this.contents = {};
        this.groups = new Set();
        this.dirs = [];
        this.images = [];
        this.dir = dir;
    }
    async loadImageFile() {
        let dir = `${this.dir}/attachments/`;
        if (!dir.match(/.*\/$/))
            dir = `${dir}/`;
        try {
            await util_1.promisify(fs_1.default.stat)(dir);
        }
        catch (e) {
            throw new Error(`ディレクトリ ${dir} が存在しません`);
        }
        const ary = await util_1.promisify(fs_1.default.readdir)(dir);
        for (const imagePath of ary) {
            if (imagePath.match(/^\./))
                continue;
            this.images.push(imagePath);
        }
    }
    async loadFiles() {
        await this.loadImageFile();
        let dir = `${this.dir}/articles/`;
        if (!dir.match(/.*\/$/))
            dir = `${dir}/`;
        const ary = await util_1.promisify(fs_1.default.readdir)(dir);
        for (const filePath of ary) {
            if (filePath.match(/^\./))
                continue;
            const path = `${dir}${filePath}`;
            const contents = await util_1.promisify(fs_1.default.readFile)(path, 'utf-8');
            const json = JSON.parse(contents);
            json.body = this.replaceContent(json.body);
            if (json.comments) {
                for (const key in json.comments) {
                    json.comments[key].body = this.replaceContent(json.comments[key].body);
                }
            }
            this.contents[path.replace(`${this.dir}/articles/`, '')] = json;
            json.groups.forEach(g => {
                this.groups.add(g.name);
            });
        }
    }
    replaceContent(body) {
        this.images.forEach(fileName => {
            const name = fileName.replace(/.*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}.*)/, "$1");
            const re1 = new RegExp(`https://image.docbase.io/uploads/${name}`, 'g');
            body = body.replace(re1, `../attachments/${fileName}`);
            const re2 = new RegExp(`https://docbase.io/file_attachments/${name}`, 'g');
            body = body.replace(re2, `../attachments/${fileName}`);
        });
        body = body.replace(/!\[(.*?)\]\((.*?) =WxH\)/g, "![$1]($2)");
        return body;
    }
}
exports.default = Docbase;
