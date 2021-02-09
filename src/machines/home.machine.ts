import {
  createMachine,
  assign,
  actions,
  spawn,
  ActorRef,
  EventObject
} from "xstate";
import { get, del, post } from "../utils/api-client";
import { history } from "../utils/history";
import type {
  Article,
  ArticleListResponse,
  ArticleResponse,
  Errors
} from "../types/api";

const { choose } = actions;

export type HomeContext = {
  articles?: Article[];
  articlesCount?: number;
  errors?: Errors;
  limit: number;
  offset: number;
  feed?: string;
  author?: string;
  tag?: string;
  favorited?: string;
  favoriteRef?: ActorRef<EventObject>;
};

export type HomeEvent =
  | {
      type: "done.invoke.getFeed";
      data: ArticleListResponse;
    }
  | {
      type: "done.invoke.favoriting";
      data: ArticleResponse;
    }
  | {
      type: "error.platform";
      data: { errors: Errors };
    }
  | {
      type: "RETRY" | "REFRESH";
    }
  | {
      type: "UPDATE_FEED";
      offset: number;
      limit: number;
      feed?: string;
      author?: string;
      tag?: string;
      favorited?: string;
    }
  | {
      type: "TOGGLE_FAVORITE";
      slug: string;
    };

export type HomeState =
  | {
      value: "loading";
      context: HomeContext & {
        articles: undefined;
        articlesCount: undefined;
        errors: undefined;
      };
    }
  | {
      value: "feedLoaded";
      context: HomeContext & {
        articles: Article[] | [];
        articlesCount: number;
        errors: undefined;
      };
    }
  | {
      value: { feedLoaded: "articlesAvailable" };
      context: HomeContext & {
        articles: Article[];
        articlesCount: number;
        errors: undefined;
      };
    }
  | {
      value: { feedLoaded: "noArticles" };
      context: HomeContext & {
        articles: [];
        articlesCount: 0;
        errors: undefined;
      };
    }
  | {
      value: "failedLoadingFeed";
      context: HomeContext & {
        articles: undefined;
        articlesCount: undefined;
        errors: Errors;
      };
    };

export const homeMachine = createMachine<HomeContext, HomeEvent, HomeState>(
  {
    id: "home",
    initial: "loading",
    context: {
      articles: undefined,
      articlesCount: undefined,
      errors: undefined,
      limit: 20,
      offset: 0
    },
    states: {
      loading: {
        invoke: {
          id: "getFeed",
          src: "feedRequest",
          onDone: {
            target: "feedLoaded",
            actions: "assignData"
          },
          onError: {
            target: "failedLoadingFeed",
            actions: "assignErrors"
          }
        }
      },
      feedLoaded: {
        initial: "pending",
        states: {
          pending: {
            always: [
              {
                target: "noArticles",
                cond: "dataIsEmpty"
              },
              {
                target: "articlesAvailable"
              }
            ]
          },
          noArticles: {},
          articlesAvailable: {}
        },
        on: {
          REFRESH: "loading",
          UPDATE_FEED: {
            target: "loading",
            actions: "updateParams"
          },
          TOGGLE_FAVORITE: {
            actions: choose([
              {
                cond: "notAuthenticated",
                actions: "goToSignup"
              },
              {
                cond: "articleIsFavorited",
                actions: "deleteFavorite"
              },
              {
                actions: "favoriteArticle"
              }
            ])
          },
          "done.invoke.favoriting": {
            actions: "assignArticleData"
          }
        }
      },
      failedLoadingFeed: {
        on: {
          RETRY: "loading"
        }
      }
    }
  },
  {
    actions: {
      assignArticleData: assign({
        articles: (context, event) => {
          if (event.type === "done.invoke.favoriting") {
            const data = event.data.article;
            return context.articles?.map(article =>
              article.slug === data.slug ? data : article
            );
          }
          return context.articles;
        }
      }),
      assignData: assign((context, event) => {
        if (event.type === "done.invoke.getFeed") {
          return {
            ...context,
            ...event.data
          };
        }
        return context;
      }),
      assignErrors: assign({
        errors: (context, event) => {
          if (event.type === "error.platform") return event.data.errors;
          return context.errors;
        }
      }),
      clearErrors: assign<HomeContext, HomeEvent>({ errors: undefined }),
      goToSignup: () => history.push("/register"),
      deleteFavorite: assign((context, event) => {
        if (event.type === "TOGGLE_FAVORITE") {
          const articles = context.articles?.map(article => {
            if (article.slug === event.slug) {
              return {
                ...article,
                favorited: false,
                favoritesCount: article.favoritesCount - 1
              };
            }
            return article;
          });
          return {
            ...context,
            articles,
            favoriteRef: spawn(
              del<ArticleResponse>(`articles/${event.slug}/favorite`),
              "favoriting"
            )
          };
        }
        return context;
      }),
      favoriteArticle: assign((context, event) => {
        if (event.type === "TOGGLE_FAVORITE") {
          const articles = context.articles?.map(article => {
            if (article.slug === event.slug) {
              return {
                ...article,
                favorited: true,
                favoritesCount: article.favoritesCount + 1
              };
            }
            return article;
          });
          return {
            ...context,
            articles,
            favoriteRef: spawn(
              post<ArticleResponse>(
                `articles/${event.slug}/favorite`,
                undefined
              ),
              "favoriting"
            )
          };
        }
        return context;
      }),
      updateParams: assign((context, event) => {
        if (event.type === "UPDATE_FEED") {
          return {
            ...context,
            ...event
          };
        }
        return context;
      })
    },
    guards: {
      dataIsEmpty: context => context.articles?.length === 0,
      articleIsFavorited: (context, event) =>
        event.type === "TOGGLE_FAVORITE" &&
        !!context.articles?.find(
          article => article.slug === event.slug && article.favorited
        )
    },
    services: {
      feedRequest: context => {
        const params = new URLSearchParams({
          limit: context.limit.toString(),
          offset: context.offset.toString()
        });
        if (context.author) params.set("author", context.author);
        if (context.tag) params.set("tag", context.tag);
        if (context.favorited) params.set("favorited", context.favorited);

        return get<ArticleListResponse>(
          (context.feed === "me" ? "articles/feed?" : "articles?") +
            params.toString()
        );
      }
    }
  }
);
