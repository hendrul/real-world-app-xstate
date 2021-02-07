import React from "react";
import { Link } from "react-router-dom";
import type { Article } from "../types/api";

export const ArticlePreview: React.FC<Article> = ({
  slug,
  title,
  author,
  description,
  favoritesCount,
  updatedAt
}) => {
  const publishDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric"
  }).format(new Date(updatedAt));
  return (
    <div className="article-preview">
      <div className="article-meta">
        <Link to={`/profile/${author.username}`}>
          <img src={author.image || ""} />
        </Link>
        <div className="info">
          <Link to={`/profile/${author.username}`} className="author">
            {author.username}
          </Link>
          <span className="date">{publishDate}</span>
        </div>
        <button className="btn btn-outline-primary btn-sm pull-xs-right">
          <i className="ion-heart"></i> {favoritesCount}
        </button>
      </div>
      <Link to={`/article/${slug}`} className="preview-link">
        <h1>{title}</h1>
        <p>{description}</p>
        <span>Read more...</span>
      </Link>
    </div>
  );
};
