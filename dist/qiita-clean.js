#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const js_yaml_1 = __importDefault(require("js-yaml"));
const fs_1 = __importDefault(require("fs"));
const note_pm_1 = __importDefault(require("./note_pm/"));
const util_1 = require("util");
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
    .parse();
const options = commander_1.program.opts();
(async (options) => {
    const str = await util_1.promisify(fs_1.default.readFile)(options.userYaml, 'utf-8');
    const config = await js_yaml_1.default.load(str);
    const n = new note_pm_1.default(options.accessToken, options.team);
})(options);
