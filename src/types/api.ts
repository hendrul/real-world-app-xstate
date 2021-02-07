export type Errors = Record<string, string[]>;

export interface User {
  email: string;
  token: string;
  username: string;
  bio: string;
  image: string | null;
}

export interface Profile {
  username: string;
  bio: string;
  image: string;
  following: boolean;
}

export type DateTime = string;

export interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: DateTime;
  updatedAt: DateTime;
  favorited: boolean;
  favoritesCount: number;
  author: {
    username: string;
    bio: string;
    image: string | null;
    following: boolean;
  };
}

export interface Comment {
  id: number;
  createdAt: DateTime;
  updatedAt: DateTime;
  body: string;
  author: Article["author"];
}

export interface APIError {
  body: string[];
}

export interface BaseResponse {
  errors?: Errors;
}

export interface UserResponse extends BaseResponse {
  user: User;
}

export interface ProfileResponse extends BaseResponse {
  profile: Profile;
}

export interface ArticleResponse extends BaseResponse {
  article: Article;
}

export interface ArticleListResponse extends BaseResponse {
  articles: Article[];
  articleCount: number;
}

export interface CommentResponse extends BaseResponse {
  comment: Comment;
}

export interface CommentListResponse extends BaseResponse {
  comments: Comment[];
}

export interface TagListResponse extends BaseResponse {
  tags: string[];
}
