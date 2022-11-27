import User from './user';
import QiitaTeam from './index';
declare class Group {
    static QiitaTeam: QiitaTeam;
    name: string;
    url_name: string;
    users: User[] | null;
    constructor(params: GroupJson);
}
export default Group;
