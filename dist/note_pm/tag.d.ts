import NotePM from './index';
declare class Tag {
    static NotePM: NotePM;
    name: string;
    page_count: number;
    constructor(params: notePM_Tag);
    setParams(params: notePM_Tag): void;
    save(): Promise<Tag>;
    static fetchAll(page?: number): Promise<Tag[]>;
}
export default Tag;
