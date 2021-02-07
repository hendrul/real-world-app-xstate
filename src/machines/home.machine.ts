import { createMachine, assign } from "xstate";
import { get } from "../utils/api-client";
import type { Article, ArticleListResponse, Errors } from "../types/api";

export type HomeContext = {
  articles?: Article[];
  errors?: Errors;
};

export type HomeEvent =
  | {
      type: "done.invoke.getGlobalFeed" | "done.invoke.getUserFeed";
      data: ArticleListResponse;
    }
  | {
      type: "error.platform";
      data: { errors: Errors };
    }
  | {
      type: "RETRY" | "REFRESH";
    };

export type HomeState =
  | {
      value: "loading";
      context: HomeContext & {
        articles: undefined;
        errors: undefined;
      };
    }
  | {
      value: "feedLoaded";
      context: HomeContext & {
        articles: Article[];
        errors: undefined;
      };
    }
  | {
      value: "failedLoadingFeed";
      context: HomeContext & {
        articles: undefined;
        errors: Errors;
      };
    };

export const homeMachine = createMachine<HomeContext, HomeEvent, HomeState>(
  {
    id: "home",
    initial: "loading",
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
          REFRESH: "loading"
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
      assignData: assign({
        articles: (context, event) => {
          if (
            event.type === "done.invoke.getGlobalFeed" ||
            event.type === "done.invoke.getUserFeed"
          )
            return event.data.articles;
          return context.articles;
        }
      }),
      assignErrors: assign({
        errors: (context, event) => {
          if (event.type === "error.platform") return event.data.errors;
          return context.errors;
        }
      }),
      clearErrors: assign<HomeContext>({ errors: undefined })
    },
    guards: {},
    services: {
      globalFeedRequest: () => get<ArticleListResponse>("articles")
    }
  }
);
