import NotePM from './index';
declare class User {
    static NotePM: NotePM;
    user_code: string;
    name: string;
    constructor(params: notePM_User);
    setParams(params: notePM_User): void;
    static fetchAll(page?: number): Promise<User[]>;
}
export default User;
