import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { marked } from "marked";
import { sanitize } from "dompurify";
import { articleMachine, articleModel } from "../machines/article.machine";
import { isProd } from "../utils/env";
import { AuthorCard } from "../components/AuthorCard";
import { CommentCard } from "../components/Comment";
import { Tag } from "../components/Tag";
import { useIsAuthenticated } from "../hooks/is-authenticated";
import { AppMachineContext } from "../App";

export const Article: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const currentUser = AppMachineContext.useSelector(state => state.context.user);
  const { slug } = useParams<{ slug: string }>();
  const [current, send] = useMachine(articleMachine, {
    devTools: !isProd(),
    guards: {
      notAuthenticated: () => !isAuthenticated
    },
    context: {
      slug
    }
  });

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bodyEl: HTMLTextAreaElement = event.currentTarget.elements.namedItem(
      "body"
    ) as HTMLTextAreaElement;
    send(articleModel.events.createComment(
      { body: bodyEl.value }
    ));
    bodyEl.value = "";
  };

  return (
    <div className="article-page">
      {current.matches({ article: "hasContent" }) && (
        <>
          <div className="banner">
            <div className="container">
              <h1>{current.context.article.title}</h1>

              <AuthorCard
                variant={
                  current.context.article.author.username ===
                    currentUser?.username
                    ? "currentAuthor"
                    : "post"
                }
                {...current.context.article.author}
                {...current.context.article}
                onDelete={() => send(articleModel.events.deleteArticle())}
                onFavorite={() => send(articleModel.events.toggleFavorite())}
                onFollow={() =>
                  send(articleModel.events.toggleFollow(current.context.article.author.username))
                }
              />
            </div>
          </div>

          <div className="container page">
            <div className="row article-content">
              <div className="col-md-12">
                <p>{current.context.article.description}</p>
                <div
                  dangerouslySetInnerHTML={{
                    __html: sanitize(marked(current.context.article.body))
                  }}
                />
                <ul className="tag-list">
                  {current.context.article.tagList.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </ul>
              </div>
            </div>

            <hr />

            <div className="article-actions">
              <AuthorCard
                variant={
                  current.context.article.author.username ===
                    currentUser?.username
                    ? "currentAuthor"
                    : "post"
                }
                {...current.context.article.author}
                {...current.context.article}
                onDelete={() => send(articleModel.events.deleteArticle())}
                onFavorite={() => send(articleModel.events.toggleFavorite())}
                onFollow={() =>
                  send(articleModel.events.toggleFollow(current.context.article.author.username))
                }
              />
            </div>
          </div>
        </>
      )}
      <div className="row">
        <div className="col-xs-12 col-md-8 offset-md-2">
          {isAuthenticated && (
            <form className="card comment-form" onSubmit={handleCommentSubmit}>
              <div className="card-block">
                <textarea
                  className="form-control"
                  placeholder="Write a comment..."
                  rows={3}
                  name="body"
                  id="body"
                ></textarea>
              </div>
              <div className="card-footer">
                <img
                  src={currentUser?.image || ""}
                  className="comment-author-img"
                />
                <button className="btn btn-sm btn-primary" type="submit">
                  Post Comment
                </button>
              </div>
            </form>
          )}
          {!isAuthenticated && (
            <p>
              <Link to="/login">Sign in</Link> or{" "}
              <Link to="/register">sign up</Link> to add comments on this
              article.
            </p>
          )}
          {current.matches({ comments: "hasContent" }) &&
            current.context.comments.map(comment => (
              <CommentCard
                key={comment.id}
                {...comment}
                onDelete={
                  comment.author.username === currentUser?.username
                    ? id => send(articleModel.events.deleteComment(id))
                    : undefined
                }
              />
            ))}
          {current.matches({ comments: "noContent" }) && (
            <p>
              <em>No comments yet. You can be the first!</em>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
