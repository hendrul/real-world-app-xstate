import { createMachine, spawn, assign, ActorRefFrom } from "xstate";
import { authMachine } from "./auth.machine";
import { get } from "../utils/api-client";
import { history } from "../utils/history";
import type { UserResponse, User } from "../types/api";

type AppContext = {
  auth: ActorRefFrom<typeof authMachine> | null;
  user?: User;
};

type AppEvent =
  | {
      type: "LOGGED_IN" | "UPDATE_USER";
      user: User;
    }
  | {
      type: "done.invoke.userRequest";
      data: UserResponse;
    }
  | { type: "LOGGED_OUT" }
  | {
      type: "error.platform";
      data: {
        errors: Record<string, string[]>;
      };
    };

export const appMachine = createMachine<AppContext, AppEvent>(
  {
    id: "app",
    type: "parallel",
    context: {
      auth: null,
      user: undefined
    },
    states: {
      user: {
        onEntry: "createAuthMachine",
        initial: "unauthenticated",
        states: {
          unauthenticated: {
            always: [
              {
                cond: "userExists",
                target: "#app.user.authenticated"
              },
              {
                cond: "tokenAvailable",
                target: "#app.user.authenticating"
              }
            ]
          },
          authenticating: {
            invoke: {
              id: "userRequest",
              src: "requestUser",
              onDone: {
                target: "#app.user.authenticated",
                actions: "assignUserData"
              },
              onError: "#app.user.unauthenticated"
            }
          },
          authenticated: {
            on: {
              LOGGED_OUT: {
                actions: ["resetUserData", "resetToken", "goHome"],
                target: "#app.user.unauthenticated"
              }
            }
          }
        },
        on: {
          LOGGED_IN: {
            target: ".authenticated",
            actions: "assignUserFromEvent"
          },
          UPDATE_USER: {
            actions: "assignUserFromEvent"
          }
        }
      }
    }
  },
  {
    actions: {
      assignUserFromEvent: assign({
        user: (context, event) => {
          if (event.type === "UPDATE_USER" || event.type === "LOGGED_IN") {
            return event.user;
          }
          return context.user;
        }
      }),
      assignUserData: assign({
        user: (context, event) => {
          if (event.type === "done.invoke.userRequest") return event.data.user;
          return context.user;
        }
      }),
      createAuthMachine: assign<AppContext, AppEvent>({
        auth: () => spawn(authMachine) as ActorRefFrom<typeof authMachine>
      }),
      goHome: () => history.push("/"),
      resetToken: () => localStorage.removeItem("conduit_token"),
      resetUserData: assign<AppContext, AppEvent>({ user: undefined })
    },
    guards: {
      userExists: context => !!context.user,
      tokenAvailable: () => localStorage.getItem("conduit_token") !== null
    },
    services: {
      requestUser: () => get<UserResponse>("user")
    }
  }
);
