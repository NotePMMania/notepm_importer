"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
class Attachment {
    constructor(params) {
        this.file_id = null;
        this.note_code = null;
        this.page_code = null;
        this.file_name = null;
        this.file_size = null;
        this.download_url = null;
        this.created_at = null;
        this.setParams(params);
    }
    setParams(params) {
        this.file_id = params.file_id;
        this.note_code = params.note_code;
        this.page_code = params.page_code;
        this.file_name = params.file_name;
        this.file_size = params.file_size;
        this.download_url = params.download_url;
        this.created_at = params.created_at;
    }
    static async add(page, fileName, filePath) {
        const readStream = fs_1.default.createReadStream(filePath);
        const formData = new form_data_1.default;
        formData.append('file[name]', fileName);
        formData.append('file[contents]', readStream);
        formData.append('page_code', page.page_code);
        const response = await Attachment.NotePM.fetch('POST', `/attachments`, formData);
        const params = response.attachments;
        return new Attachment(params);
    }
}
exports.default = Attachment;
