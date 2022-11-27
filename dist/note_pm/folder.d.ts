import NotePM, { Note } from './index';
declare class Folder {
    static NotePM: NotePM;
    folder_id: number;
    name: string;
    parent_folder_id: number | null;
    note_code: string;
    constructor(params: notePM_Folder);
    setParams(params: notePM_Folder): void;
    save(note: Note): Promise<void>;
    findOrCreate(note: notePM_Note, name: string, parentFolder?: Folder): Promise<notePM_Folder>;
    find(note: notePM_Note, name: string): Promise<Folder | undefined>;
    create(note: notePM_Note | Note): Promise<notePM_Folder>;
}
export default Folder;
