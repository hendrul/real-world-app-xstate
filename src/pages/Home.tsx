import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { Tag } from "../components/Tag";
import { Pagination } from "../components/Pagination";
import { ArticlePreview } from "../components/Article";
import { homeMachine } from "../machines/home.machine";
import type { UserState } from "../machines/app.machine";
import type { User } from "../types/api";

type HomeProps =
  | {
      currentUser?: User;
      userState: UserState;
    }
  | {
      currentUser: User;
      userState: "user.authenticated";
    };

/*
TODO:

- update feed endpoint / requested data when location changes
*/
export const Home: React.FC<HomeProps> = ({ userState }) => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const feed = params.get("feed") ?? undefined;
  const offset = parseInt(params.get("offset") || "0", 10);
  const limit = parseInt(params.get("limit") || "20", 10);
  const author = params.get("author") ?? undefined;
  const tag = params.get("tag") ?? undefined;
  const favorited = params.get("favorited") ?? undefined;

  const [current, send] = useMachine(homeMachine, {
    devTools: process.env.NODE_ENV !== "production",
    context: {
      limit,
      offset,
      author,
      tag,
      favorited,
      feed
    }
  });

  React.useEffect(() => {
    if (current.matches("feedLoaded")) {
      send({
        type: "UPDATE_FEED",
        offset,
        limit,
        feed,
        author,
        tag,
        favorited
      });
    }
  }, [send, offset, feed, author, tag, favorited, limit]);

  return (
    <div className="home-page">
      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {userState === "user.authenticated" && (
                  <li className="nav-item">
                    <NavLink
                      activeClassName="active"
                      className="nav-link"
                      isActive={(match, location) =>
                        !!match && location.search.includes("feed=me")
                      }
                      to="/?feed=me"
                    >
                      Your Feed
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <NavLink
                    activeClassName="active"
                    exact={true}
                    isActive={(match, location) =>
                      !!match && !location.search.includes("feed=me")
                    }
                    className="nav-link"
                    to="/"
                  >
                    Global Feed
                  </NavLink>
                </li>
              </ul>
            </div>

            {current.matches("loading") && (
              <div className="article-preview">
                <p>Loading articles...</p>
              </div>
            )}

            {current.matches("feedLoaded") && (
              <>
                {current.context.articles.map(article => (
                  <ArticlePreview key={article.slug} {...article} />
                ))}
                <Pagination
                  pageCount={Math.ceil(current.context.articlesCount / limit)}
                  limit={limit}
                  offset={offset}
                />
              </>
            )}
          </div>

          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>

              <div className="tag-list">
                <Tag>programming</Tag>
                <Tag>javascript</Tag>
                <Tag>emberjs</Tag>
                <Tag>angularjs</Tag>
                <Tag>react</Tag>
                <Tag>mean</Tag>
                <Tag>node</Tag>
                <Tag>rails</Tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
