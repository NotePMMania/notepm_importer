"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class User {
    constructor(params) {
        this.user_code = '';
        this.name = '';
        this.setParams(params);
    }
    setParams(params) {
        this.user_code = params.user_code;
        this.name = params.name;
    }
    static async fetchAll(page = 1) {
        const perPage = 100;
        const res = await User.NotePM.fetch('GET', `/users?page=${page}&per_page=${perPage}`);
        if (res.messages)
            throw new Error(res.messages.join(', '));
        let users = res.users.map(u => new User(u));
        if (users.length === perPage) {
            const nextUsers = await User.fetchAll(page + 1);
            users = users.concat(nextUsers);
        }
        else {
            return users.map(u => new User(u));
        }
        return users;
    }
}
exports.default = User;
