import Group from './group';
import Tag from './tag';
import Comment from './comment';
import QiitaTeam from './index';
declare class Article {
    static QiitaTeam: QiitaTeam;
    rendered_body: string;
    body: string;
    coediting: boolean;
    comments_count: number;
    created_at: string;
    id: string;
    likes_count: number;
    private: boolean;
    reactions_count: number;
    title: string;
    updated_at: string;
    url: string;
    page_views_count: number;
    group: Group | null;
    tags: Tag[] | null;
    user: UserJson | null;
    comments: Comment[] | null;
    constructor(params: ArticleJson);
    getImage(): string[];
    getAttachment(): string[];
}
export default Article;
