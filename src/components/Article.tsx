import * as React from "react";
import { Link } from "react-router-dom";
import type { Article } from "../types/api";
import { AuthorCard } from "../components/AuthorCard";

export const ArticlePreview: React.FC<
  Article & { onFavorite: (slug?: string) => void }
> = ({
  slug,
  title,
  author,
  description,
  favoritesCount,
  favorited,
  createdAt,
  tagList,
  onFavorite
}) => {
  return (
    <div className="article-preview">
      <AuthorCard
        {...author}
        slug={slug}
        favoritesCount={favoritesCount}
        favorited={favorited}
        createdAt={createdAt}
        onFavorite={onFavorite}
        variant="preview"
      />
      <Link to={`/article/${slug}`} className="preview-link">
        <h1>{title}</h1>
        <p>{description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {tagList.map(tag => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
};
