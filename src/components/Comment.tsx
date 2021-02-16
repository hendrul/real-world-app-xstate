import * as React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "../utils/dates";
import type { Comment } from "../types/api";

type CommentProps = Comment & {
  onDelete?: (id: Comment["id"]) => void;
};

export const CommentCard: React.FC<CommentProps> = ({
  id,
  body,
  author,
  createdAt,
  onDelete
}) => {
  return (
    <div className="card">
      <div className="card-block">
        <p className="card-text">{body}</p>
      </div>
      <div className="card-footer">
        <Link to={`/profile/${author.username}`} className="comment-author">
          <img src={author.image || ""} className="comment-author-img" />
        </Link>
        &nbsp;
        <Link to={`/profile/${author.username}`} className="comment-author">
          {author.username}
        </Link>
        <span className="date-posted">{formatDate(createdAt)}</span>
        {onDelete && (
          <button
            className="btn btn-sm pull-xs-right"
            onClick={() => onDelete(id)}
          >
            <i className="ion-trash-a" />
          </button>
        )}
      </div>
    </div>
  );
};
