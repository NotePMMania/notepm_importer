import Folder from './folder';
import Page from './page';
import Tag from './tag';
import Note from './note';
import FormData from 'form-data';
import User from './user';
import Attachment from './attachment';
import Comment from './comment';
declare class NotePM {
    accessToken: string;
    domain: string;
    url: string;
    tags: Tag[];
    users: User[];
    constructor(accessToken: string, domain: string);
    getUsers(): Promise<void>;
    getTags(): Promise<void>;
    findUser(name: string): string | null;
    fetch(method: string, path: string, body?: object | string | FormData | null): Promise<any>;
}
export default NotePM;
export { Folder, Page, Tag, Note, User, Comment, Attachment };
