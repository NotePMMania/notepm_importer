import User from './user';
import QiitaTeam from './index';

class Project {
  public static QiitaTeam: QiitaTeam;

  public rendered_body: string = '';
  public archived: boolean = false;
  public body: string = '';
  public created_at: string = '';
  public id: number = 0;
  public name: string = '';
  public reactions_count: number = 0;
  public updated_at: string = '';
  public user: User | null = null;

  constructor(params: ProjectJson) {
    this.rendered_body = params.rendered_body;
    this.archived = params.archived;
    this.body = params.body;
    this.created_at = params.created_at;
    this.id = params.id;
    this.name = params.name;
    this.reactions_count = params.reactions_count;
    this.updated_at = params.updated_at;
    this.user = new User(params.user);
  }

  getImage(): string[] {
    return Project.QiitaTeam.regexpImage(this.rendered_body);
  }

  getAttachment(): string[] {
    return Project.QiitaTeam.regexpAttachment(this.rendered_body);
  }

  toPage(): notePM_Page {
    return {
      title: this.name,
      body: this.body,
      created_at: new Date(this.created_at),
      memo: ''
    }
  }
}

export default Project;
