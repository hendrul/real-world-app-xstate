import * as React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { Tag } from "../components/Tag";
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
  const [current] = useMachine(homeMachine, { devTools: true });
  // const { search } = useLocation();

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
                        !!match && location.search === "?feed=me"
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
                      !!match && location.search === ""
                    }
                    className="nav-link"
                    to="/"
                  >
                    Global Feed
                  </NavLink>
                </li>
              </ul>
            </div>

            {current.matches("loading") && <p>Loading articles...</p>}

            {current.matches("feedLoaded") &&
              current.context.articles.map(article => (
                <ArticlePreview key={article.slug} {...article} />
              ))}
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
