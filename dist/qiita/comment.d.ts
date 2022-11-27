import User from './user';
declare class Comment {
    body: string;
    created_at: string;
    id: string;
    rendered_body: string;
    updated_at: string;
    user: User | null;
    constructor(params: CommentJson);
}
export default Comment;
