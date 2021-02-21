"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const parse_md_1 = __importDefault(require("parse-md"));
class Kibela {
    constructor(dir) {
        this.dir = '';
        this.contents = {};
        this.groups = new Set();
        this.dirs = [];
        this.dir = dir;
    }
    async load() {
    }
    async loadFiles(dir = '') {
        dir = dir === '' ? `${this.dir}/notes` : dir;
        if (!dir.match(/.*\/$/))
            dir = `${dir}/`;
        const ary = await util_1.promisify(fs_1.default.readdir)(dir);
        const res = [];
        for (const filePath of ary) {
            if (filePath.match(/^\./))
                continue;
            const path = `${dir}${filePath}`;
            const file = await util_1.promisify(fs_1.default.stat)(path);
            if (file.isDirectory()) {
                const dir = {
                    name: filePath,
                    dirs: [],
                };
                dir.dirs = await this.loadFiles(path);
                res.push(dir);
            }
            else {
                const contents = await util_1.promisify(fs_1.default.readFile)(path, 'utf-8');
                const json = parse_md_1.default(contents);
                this.contents[path.replace(`${this.dir}/notes/`, '')] = json;
                json.metadata.groups.forEach(g => {
                    this.groups.add(g);
                });
            }
        }
        this.dirs = res;
        return res;
    }
}
exports.default = Kibela;
