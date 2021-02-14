import { createMachine, assign } from "xstate";
import { get, post, put } from "../utils/api-client";
import { history } from "../utils/history";
import type { ArticleResponse, Article, Errors } from "../types/api";

export type FormValues = Pick<
  Article,
  "title" | "description" | "body" | "tagList"
>;

type EditorContext = {
  article?: Article;
  errors?: Errors;
  formValues?: FormValues;
  slug?: string;
};

type EditorEvent =
  | {
      type: "done.invoke.articleRequest";
      data: ArticleResponse;
    }
  | {
      type: "done.invoke.getArticle";
      data: ArticleResponse;
    }
  | {
      type: "error.platform";
      data: { errors: Errors };
    }
  | {
      type: "SUBMIT";
      values: FormValues;
    };

type EditorState =
  | {
      value: "idle" | { idle: "creating" };
      context: {
        article: undefined;
        errors: undefined;
        formValues: undefined;
      };
    }
  | {
      value: { idle: "updating" };
      context: EditorContext & {
        article: Article;
        formValues: FormValues;
        slug: string;
      };
    }
  | {
      value: "submitting" | { submitting: "creating" };
      context: EditorContext & {
        formValues: FormValues;
      };
    }
  | {
      value: { submitting: "updating" };
      context: EditorContext & {
        article: Article;
        formValues: FormValues;
        slug: string;
      };
    }
  | {
      value: "success";
      context: EditorContext & {
        article: Article;
        formValues: FormValues;
      };
    }
  | {
      value: "errored";
      context: EditorContext & {
        errors: Errors;
        formValues: FormValues;
      };
    };

export const editorMachine = createMachine<
  EditorContext,
  EditorEvent,
  EditorState
>(
  {
    id: "editor",
    initial: "idle",
    states: {
      idle: {
        initial: "choosing",
        states: {
          choosing: {
            always: [
              {
                target: "updating",
                cond: "slugExists"
              },
              {
                target: "creating"
              }
            ]
          },
          creating: {
            on: {
              SUBMIT: {
                target: "#editor.submitting.creating",
                actions: "assignValues"
              }
            }
          },
          updating: {
            invoke: {
              id: "getArticle",
              src: "getArticle",
              onDone: {
                actions: "assignArticleValues"
              }
            },
            on: {
              SUBMIT: {
                target: "#editor.submitting.updating",
                actions: "assignValues"
              }
            }
          }
        }
      },
      submitting: {
        states: {
          creating: {
            invoke: {
              id: "articleRequest",
              src: "createArticle",
              onDone: {
                target: "#success",
                actions: "assignData"
              }
            }
          },
          updating: {
            invoke: {
              id: "articleRequest",
              src: "updateArticle",
              onDone: {
                target: "#success",
                actions: "assignData"
              }
            }
          }
        },
        on: {
          "error.platform": {
            target: "#errored",
            actions: "assignErrors"
          }
        }
      },
      success: {
        id: "success",
        onEntry: "goToArticle"
      },
      errored: {
        id: "errored",
        on: {
          SUBMIT: {
            target: "submitting",
            actions: "assignValues"
          }
        }
      }
    }
  },
  {
    actions: {
      assignArticleValues: assign({
        article: (context, event) => {
          if (event.type === "done.invoke.getArticle")
            return event.data.article;
          return context.article;
        },
        formValues: (context, event) => {
          if (event.type === "done.invoke.getArticle") {
            return {
              title: event.data.article.title,
              description: event.data.article.description,
              body: event.data.article.body,
              tagList: event.data.article.tagList
            };
          }
          return context.formValues;
        }
      }),
      assignData: assign({
        article: (context, event) => {
          if (event.type === "done.invoke.articleRequest") {
            return event.data.article;
          }
          return context.article;
        }
      }),
      assignErrors: assign({
        errors: (context, event) => {
          if (event.type === "error.platform") return event.data.errors;
          return context.errors;
        }
      }),
      assignValues: assign({
        formValues: (context, event) => {
          if (event.type === "SUBMIT") return event.values;
          return context.formValues;
        }
      }),
      goToArticle: context => history.push(`/article/${context.article?.slug}`)
    },
    guards: {
      slugExists: context => !!context.slug
    },
    services: {
      createArticle: context => {
        if (context.formValues) {
          return post<ArticleResponse, { article: FormValues }>("articles", {
            article: context.formValues
          });
        }
        return Promise.reject();
      },
      getArticle: context => {
        if (context.slug) {
          return get<ArticleResponse>(`articles/${context.slug}`);
        }
        return Promise.reject();
      },
      updateArticle: context => {
        if (context.formValues && context.slug) {
          return put<ArticleResponse, { article: FormValues }>(
            `articles/${context.slug}`,
            {
              article: context.formValues
            }
          );
        }
        return Promise.reject();
      }
    }
  }
);
