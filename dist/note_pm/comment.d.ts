import NotePM from './index';
import Page from './page';
import QiitaTeam from '../qiita/index';
declare class Comment {
    static NotePM: NotePM;
    page_code: string;
    body: string;
    user: string;
    created_at: string;
    comment_number: number | null;
    constructor(params: notePM_Comment);
    setParams(params: notePM_Comment): void;
    images(): string[];
    save(): Promise<Comment>;
    create(): Promise<Comment>;
    update(): Promise<Comment>;
    updateImageBody(q: QiitaTeam | null, page: Page, dir?: string): Promise<void>;
}
export default Comment;
