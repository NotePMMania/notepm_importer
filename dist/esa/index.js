"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const parse_md_1 = __importDefault(require("parse-md"));
class Esa {
    constructor(dir) {
        this.dir = '';
        this.files = {};
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
            if (`${dir}Templates` === path)
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
            if (`${dir}Templates` === path)
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
}
exports.default = Esa;
