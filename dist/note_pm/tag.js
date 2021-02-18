"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Tag {
    constructor(params) {
        this.name = '';
        this.page_count = 0;
        this.setParams(params);
    }
    setParams(params) {
        this.name = params.name;
        if (params.page_count) {
            this.page_count = params.page_count;
        }
    }
    async add(name) {
    }
    async save() {
        const response = await Tag.NotePM.fetch('POST', `/tags`, {
            name: this.name,
        });
        const params = response.tag;
        this.setParams(params);
        return this;
    }
    static async fetchAll(page = 1) {
        const perPage = 100;
        const res = await Tag.NotePM.fetch('GET', `/tags?page=${page}&per_page=${perPage}`);
        let tags = res.tags.map(t => new Tag(t));
        if (tags.length > perPage) {
            const nextTags = await Tag.fetchAll(page + 1);
            tags = tags.concat(nextTags);
        }
        else {
            return tags.map(t => new Tag(t));
        }
        return tags;
    }
}
exports.default = Tag;
