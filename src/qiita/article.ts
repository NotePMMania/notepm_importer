import Group from './group';
import User from './user';
import Tag from './tag';
import Comment from './comment';
import QiitaTeam from './index';

class Article {
  public static QiitaTeam: QiitaTeam;

  public rendered_body: string = '';
  public body: string = '';
  public coediting: boolean = false;
  public comments_count: number = 0;
  public created_at: string = '';
  public id: string = '';
  public likes_count: number = 0;
  public private: boolean = true;
  public reactions_count: number = 0;
  public title: string = '';
  public updated_at: string = '';
  public url: string = '';
  public page_views_count: number = 0;

  public group: Group | null = null;
  public tags: Tag[] | null = [];
  public user: UserJson | null = null;
  public comments: Comment[] | null = [];

  constructor(params: ArticleJson) {
    this.id = params.id;
    this.rendered_body = params.rendered_body;
    this.body = params.body;
    this.coediting = params.coediting;
    this.comments_count = params.comments_count;
    this.created_at = params.created_at;  
    this.likes_count = params.likes_count;
    this.private = true;
    this.reactions_count = params.reactions_count;
    this.title = params.title;
    this.updated_at = params.updated_at;
    this.url = params.url;
    this.page_views_count = params.page_views_count;
    if (params.group) {
      this.group = new Group(params.group);
    }
    this.user = new User(params.user);
    params.tags?.forEach(t =>  this.tags?.push(t));
    params.comments?.forEach(c => this.comments?.push(c));
  }

  getImage(): string[] {
    const images = Article.QiitaTeam.regexpImage(this.rendered_body);
    const comments: (string | undefined)[] | undefined = this.comments?.map(c => Article.QiitaTeam.regexpImage(c.rendered_body)).flat();
    if (!comments) return images;
    return comments.length === 0 ? images : images.concat(comments as string[]);
  }

  getAttachment(): string[] {
    return Article.QiitaTeam.regexpAttachment(this.rendered_body);
  }
}

export default Article;

