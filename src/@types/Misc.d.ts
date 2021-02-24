type UserJson = {
  id: string;
  permanent_id: number;
  profile_image_url: string;
};

type ProjectJson = {
  rendered_body: string;
  archived: boolean;
  body: string;
  created_at: string;
  id: number;
  name: string;
  reactions_count: number;
  updated_at: string;
  user: UserJson;
};

type GroupJson = {
  name: string;
  url_name: string;
  users: UserJson[] | null;
}

type CommentJson = {
  body: string;
  created_at: string;
  id: string;
  rendered_body: string;
  updated_at: string;
  user: UserJson;
};

type TagJson = {
  name: string;
};

type ArticleJson = {
  rendered_body: string;
  body: string;
  coediting: boolean;
  comments_count: number;
  created_at: string;
  group: GroupJson | null;
  id: string;
  likes_count: number;
  private: boolean;
  reactions_count: number;
  tags: TagJson[];
  title: string;
  updated_at: string;
  url: string;
  user: UserJson;
  page_views_count: number;
  comments: CommentJson[];
};


type locateChrome = Function;


type notePM_Note = {
  note_code?: string;
  name: string;
  description: string;
  icon_url?: string;
  archived?: boolean;
  scope: string;
  groups?: string[],
  users?: notePM_User[]
}

type notePM_User = {
  user_code: string;
  name: string;
}

type notePM_Page = {
  page_code?: string;
  note_code?: string;
  folder_id?: number;
  title: string;
  body: string;
  memo: string;
  created_at?: Date;
  updated_at?: string;
  created_by?: notePM_User;
  updated_by?: notePM_User;
  tags?: notePM_Tag[];
  users?: notePM_User[];
};

type notePM_Folder = {
  folder_id?: number;
  name: string;
  parent_folder_id?: number | null;
  note_code?: string;
};

type notePM_Tag = {
  name: string;
  page_count?: number;
}

type notePM_Attachment = {
  file_id: string;
  note_code: string;
  page_code: string;
  file_name: string;
  file_size: number;
  download_url: string;
  created_at: string;
}

type notePM_UploadImage = {
  url: string;
  download_url: string;
}

type notePM_Comment = {
  page_code: string;
  body: string;
  comment_number?: number;
  note_code?: string;
  created_at?: string;
  updated_at?: string;
  user?: notePM_User | string;
}

type Config = {
  users: {
    id: string;
    name: string;
    user_code: string;
  }[]
}

type Esa_Dir = {
  name: string;
  dirs?: Esa_Dir[];
}