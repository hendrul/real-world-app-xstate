import { createMachine, assign } from "xstate";
import { get } from "../utils/api-client";
import type { Article, ArticleListResponse, Errors } from "../types/api";

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
};

export type HomeEvent =
  | {
      type: "done.invoke.getGlobalFeed";
      data: ArticleListResponse;
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
      value:
        | "feedLoaded"
        | "feedLoaded.noArticles"
        | "feedLoaded.articlesAvailable";
      context: HomeContext & {
        articles: Article[];
        articlesCount: number;
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
          id: "getGlobalFeed",
          src: "globalFeedRequest",
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
        on: {
          REFRESH: "loading",
          UPDATE_FEED: {
            target: "loading",
            actions: "updateParams"
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
      assignData: assign((context, event) => {
        if (event.type === "done.invoke.getGlobalFeed") {
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
    guards: {},
    services: {
      globalFeedRequest: context => {
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
