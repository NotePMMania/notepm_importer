"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = __importDefault(require("./user"));
class Group {
    constructor(params) {
        var _a;
        this.name = '';
        this.url_name = '';
        this.users = [];
        this.name = params.name;
        this.url_name = params.url_name;
        (_a = params.users) === null || _a === void 0 ? void 0 : _a.forEach(u => {
            var _a;
            (_a = this.users) === null || _a === void 0 ? void 0 : _a.push(new user_1.default(u));
        });
    }
}
exports.default = Group;
