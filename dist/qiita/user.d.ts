declare class User {
    id: string;
    permanent_id: number;
    profile_image_url: string;
    constructor(params: UserJson);
}
export default User;
