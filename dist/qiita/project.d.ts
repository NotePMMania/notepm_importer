import User from './user';
import QiitaTeam from './index';
declare class Project {
    static QiitaTeam: QiitaTeam;
    rendered_body: string;
    archived: boolean;
    body: string;
    created_at: string;
    id: number;
    name: string;
    reactions_count: number;
    updated_at: string;
    user: User | null;
    constructor(params: ProjectJson);
    getImage(): string[];
    getAttachment(): string[];
    toPage(): notePM_Page;
}
export default Project;
