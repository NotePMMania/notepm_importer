import NotePM from './index';

class User {
  static NotePM: NotePM;
  public user_code = '';
  public name = '';

  constructor(params: notePM_User) {
    this.setParams(params);
  }

  setParams(params: notePM_User) {
    this.user_code = params.user_code;
    this.name = params.name;
  }

  static async fetchAll(page = 1): Promise<User[]> {
    const perPage = 100;
    const res = await User.NotePM.fetch('GET', `/users?page=${page}&per_page=${perPage}`);
    if (res.messages) throw new Error(res.messages.join(', '));
    let users = (res.users as notePM_User[]).map(u => new User(u));
    if (users.length > perPage) {
      const nextUsers = await User.fetchAll(page + 1);
      users = users.concat(nextUsers);
    } else {
      return users.map(u => new User(u));
    }
    return users;
  }
}

export default User;
