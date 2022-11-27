import NotePM from './index';
import User from './user';
import Group from './group';
declare class Note {
    static NotePM: NotePM;
    note_code: string | undefined;
    name: string;
    description: string;
    icon_url: string | undefined;
    archived: boolean;
    scope: string;
    groups: Group[] | null;
    users: (User | string)[] | null;
    constructor(params: notePM_Note);
    setParams(params: notePM_Note): Note;
    save(): Promise<void>;
    findOrCreate(name: string, description: string, scope: string): Promise<Note>;
    find(name: string): Promise<notePM_Note | null>;
    create(name: string, description: string, scope: string, users: string[]): Promise<notePM_Note>;
    update(): Promise<Note>;
    static fetchAll(page?: number): Promise<Note[]>;
    delete(): Promise<void>;
}
export default Note;
