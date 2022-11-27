import NotePM from './index';
import Page from './page';
declare class Attachment {
    static NotePM: NotePM;
    file_id: string | null;
    note_code: string | null;
    page_code: string | null;
    file_name: string | null;
    file_size: number | null;
    download_url: string | null;
    created_at: string | null;
    constructor(params: notePM_Attachment);
    setParams(params: notePM_Attachment): void;
    static add(page: Page, fileName: string, filePath: string): Promise<Attachment>;
}
export default Attachment;
