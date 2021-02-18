"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class User {
    constructor(params) {
        this.id = '';
        this.permanent_id = 0;
        this.profile_image_url = '';
        this.id = params.id;
        this.permanent_id = params.permanent_id;
        this.profile_image_url = params.profile_image_url;
    }
}
exports.default = User;
