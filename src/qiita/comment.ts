import User from './user';

class Comment {
  public body: string = '';
  public created_at: string = '';
  public id: string = '';
  public rendered_body: string = '';
  public updated_at: string = '';
  public user: User | null = null;

  constructor(params: CommentJson) {
    this.body = params.body;
    this.rendered_body = params.rendered_body;
    this.created_at = params.created_at;
    this.id = params.id;
    this.updated_at = params.updated_at;
    this.user = new User(params.user);
  }
}

export default Comment;
