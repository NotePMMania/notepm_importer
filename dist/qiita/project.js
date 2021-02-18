"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("./user"));
class Project {
    constructor(params) {
        this.rendered_body = '';
        this.archived = false;
        this.body = '';
        this.created_at = '';
        this.id = 0;
        this.name = '';
        this.reactions_count = 0;
        this.updated_at = '';
        this.user = null;
        this.rendered_body = params.rendered_body;
        this.archived = params.archived;
        this.body = params.body;
        this.created_at = params.created_at;
        this.id = params.id;
        this.name = params.name;
        this.reactions_count = params.reactions_count;
        this.updated_at = params.updated_at;
        this.user = new user_1.default(params.user);
    }
    getImage() {
        return Project.QiitaTeam.regexpImage(this.rendered_body);
    }
    getAttachment() {
        return Project.QiitaTeam.regexpAttachment(this.rendered_body);
    }
    toPage() {
        return {
            title: this.name,
            body: this.body,
            memo: ''
        };
    }
}
exports.default = Project;
