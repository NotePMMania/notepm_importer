"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const func_1 = require("../func");
class Folder {
    constructor(params) {
        this.folder_id = 0;
        this.name = '';
        this.parent_folder_id = null;
        this.note_code = '';
        this.setParams(params);
    }
    setParams(params) {
        if (params.folder_id)
            this.folder_id = params.folder_id;
        this.name = params.name.normalize('NFC');
        if (params.parent_folder_id)
            this.parent_folder_id = params.parent_folder_id;
        if (params.note_code)
            this.note_code = params.note_code;
    }
    async save(note) {
        const params = await this.create(note);
        this.setParams(params);
    }
    async findOrCreate(note, name, parentFolder) {
        const folder = await this.find(note, name);
        if (folder)
            return folder;
        return this.create(note);
    }
    async find(note, name) {
        const response1 = await Folder.NotePM.fetch('GET', `/notes/${note.note_code}/folders`);
        const params = response1.folders.filter(folder => folder.name === name)[0];
        return params ? new Folder(params) : undefined;
    }
    async create(note) {
        func_1.debugPrint(`フォルダを作成します : ${this.name}`);
        const response = await Folder.NotePM.fetch('POST', `/notes/${note.note_code}/folders`, {
            name: this.name,
            parent_folder_id: this.parent_folder_id
        });
        if (response.messages)
            throw new Error(`Error: ${response.messages.join(', ')} エラーになったフォルダ名「${this.name}」`);
        return response.folder;
    }
}
exports.default = Folder;
