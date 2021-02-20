"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Note {
    constructor(params) {
        this.note_code = undefined;
        this.name = '';
        this.description = '';
        this.icon_url = undefined;
        this.archived = false;
        this.scope = '';
        this.groups = null;
        this.users = [];
        this.setParams(params);
    }
    setParams(params) {
        this.note_code = params.note_code;
        this.name = params.name;
        this.description = params.description;
        this.icon_url = params.icon_url;
        this.archived = params.archived || false;
        this.scope = params.scope;
        return this;
    }
    async save() {
        if (this.note_code) {
            await this.update();
        }
        else {
            const params = await this.create(this.name, this.description, this.scope, this.users);
            this.setParams(params);
        }
    }
    async findOrCreate(name, description, scope) {
        const params = await this.find(name);
        if (params)
            return new Note(params);
        return new Note(await this.create(name, description, scope, []));
    }
    async find(name) {
        const response1 = await Note.NotePM.fetch('GET', '/notes');
        const note = response1.notes.filter((note) => note.name === name)[0];
        return note;
    }
    async create(name, description, scope, users) {
        const response = await Note.NotePM.fetch('POST', '/notes', { name, description, scope, users });
        if (response.messages)
            throw new Error(`Note creating error. ${response.messages.join(',')}`);
        return response.note;
    }
    async update() {
        const response = await Note.NotePM.fetch('PATCH', `/notes/${this.note_code}`, {
            name: this.name,
            description: this.description,
            scope: this.scope
        });
        return this.setParams(response);
    }
    static async fetchAll(page = 1) {
        const perPage = 100;
        const res = await Note.NotePM.fetch('GET', `/notes?page=${page}&per_page=${perPage}`);
        if (res.messages)
            throw new Error(`Note fetchAll error. ${res.messages.join(',')}`);
        let notes = res.notes.map(t => new Note(t));
        if (notes.length > perPage) {
            const nextNotes = await Note.fetchAll(page + 1);
            notes = notes.concat(nextNotes);
        }
        else {
            return notes.map(t => new Note(t));
        }
        return notes;
    }
    async delete() {
        const response = await Note.NotePM.fetch('DELETE', `/notes/${this.note_code}`);
    }
}
exports.default = Note;
