"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Folder {
    constructor(params) {
        this.folder_id = 0;
        this.name = '';
        this.parent_folder_id = null;
        this.folder_id = params.folder_id;
        this.name = params.name;
        this.parent_folder_id = params.parent_folder_id;
    }
    async findOrCreate(note, name, parentFolder) {
        const folder = await this.find(note, name);
        if (folder)
            return folder;
        return this.create(note, name, parentFolder);
    }
    async find(note, name) {
        const response1 = await Folder.NotePM.fetch('GET', `/notes/${note.note_code}/folders`);
        const params = response1.folders.filter(folder => folder.name === name)[0];
        return params ? new Folder(params) : undefined;
    }
    async create(note, name, parentFolder) {
        const response = await Folder.NotePM.fetch('POST', `/notes/${note.note_code}/folders`, {
            name,
            parent_folder_id: parentFolder ? parentFolder.folder_id : null
        });
        return new Folder(response);
    }
}
exports.default = Folder;
