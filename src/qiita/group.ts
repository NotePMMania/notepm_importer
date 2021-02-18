import User from './user';
import QiitaTeam from './index';

class Group {
  public static QiitaTeam: QiitaTeam;

  public name: string = '';
  public url_name: string = '';
  public users: User[] | null = [];

  constructor(params: GroupJson) {
    this.name = params.name;
    this.url_name = params.url_name;
    params.users?.forEach(u => {
      this.users?.push(new User(u));
    });
  }
}

export default Group;
