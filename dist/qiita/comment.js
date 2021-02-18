"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("./user"));
class Comment {
    constructor(params) {
        this.body = '';
        this.created_at = '';
        this.id = '';
        this.rendered_body = '';
        this.updated_at = '';
        this.user = null;
        this.body = params.body;
        this.rendered_body = params.rendered_body;
        this.created_at = params.created_at;
        this.id = params.id;
        this.updated_at = params.updated_at;
        this.user = new user_1.default(params.user);
    }
}
exports.default = Comment;
