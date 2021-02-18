class User {
  public id: string = '';
  public permanent_id: number = 0;
  public profile_image_url: string = '';
  
  constructor(params: UserJson) {
    this.id = params.id;
    this.permanent_id = params.permanent_id;
    this.profile_image_url = params.profile_image_url;
  }
}

export default User;