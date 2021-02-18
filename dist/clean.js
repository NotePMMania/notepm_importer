#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const note_pm_1 = __importStar(require("./note_pm"));
const dir = process.argv[process.argv.length - 1];
commander_1.program
    .version('0.0.1')
    .option('-a, --access-token [accessToken]', 'notePMのアクセストークンを指定してください')
    .option('-t, --team [team]', 'notePMのチームドメインを入力してください')
    .parse();
const options = commander_1.program.opts();
(async (options) => {
    const n = new note_pm_1.default(options.accessToken, options.team);
    const notes = await note_pm_1.Note.fetchAll();
    if (!notes)
        return;
    if (notes.length === 0)
        return;
    await Promise.all(notes.forEach(async (n) => {
        await n.delete();
    }));
})(options);
