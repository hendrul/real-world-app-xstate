import { createMachine, assign } from "xstate";
import { get } from "../utils/api-client";
import type { TagListResponse, Errors } from "../types/api";

export type TagsContext = {
  tags?: string[];
  errors?: Errors;
};

export type TagsEvent =
  | {
      type: "done.invoke.tagsRequest";
      data: TagListResponse;
    }
  | {
      type: "error.platform";
      data: { errors: Errors };
    };

export type TagsState =
  | {
      value: "loading";
      context: {
        tags: undefined;
        errors: undefined;
      };
    }
  | {
      value: "tagsLoaded";
      context: {
        tags: string[];
        errors: undefined;
      };
    }
  | {
      value: "errored";
      context: {
        tags: undefined;
        errors: Errors;
      };
    };

export const tagsMachine = createMachine<TagsContext, TagsEvent, TagsState>(
  {
    id: "tags",
    initial: "loading",
    states: {
      loading: {
        invoke: {
          id: "tagsRequest",
          src: "requestTags",
          onDone: {
            target: "tagsLoaded",
            actions: "assignData"
          },
          onError: {
            target: "errored",
            actions: "assignErrors"
          }
        }
      },
      tagsLoaded: {},
      errored: {}
    }
  },
  {
    actions: {
      assignData: assign({
        tags: ({ tags }, event) => {
          if (event.type === "done.invoke.tagsRequest") return event.data.tags;
          return tags;
        }
      }),
      assignErrors: assign({
        errors: ({ errors }, event) => {
          if (event.type === "error.platform") return event.data.errors;
          return errors;
        }
      })
    },
    guards: {},
    services: {
      requestTags: () => get<TagListResponse>("tags")
    }
  }
);
