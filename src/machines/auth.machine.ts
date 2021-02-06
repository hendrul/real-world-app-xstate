import { createMachine, assign, sendParent } from "xstate";
import { history } from "../utils/history";
import { post } from "../utils/api-client";
import type { UserResponse } from "../types/api";

type Nullable<T> = Record<keyof T, null>;

export type AuthContext = {
  name: string | null;
  email: string | null;
  password: string | null;
  errors: Record<string, string[]> | null;
  token: string | null;
};

export type AuthEvent =
  | {
      type: "SUBMIT";
      email: string;
      password: string;
      name?: string;
    }
  | {
      type: "done.invoke.signupUser" | "done.invoke.loginUser";
      data: UserResponse;
    }
  | {
      type: "error.platform";
      data: {
        errors: Record<string, string[]>;
      };
    };

export type AuthState =
  | { value: "idle"; context: Nullable<AuthContext> }
  | {
      value: "submitting" | { submitting: "choosing" };
      context: Nullable<AuthContext> & { email: string; password: string };
    }
  | {
      value: { submitting: "signup" };
      context: Nullable<AuthContext> & {
        email: string;
        password: string;
        name: string;
      };
    }
  | {
      value: { submitting: "login" };
      context: Nullable<AuthContext> & { email: string; password: string };
    }
  | {
      value: "authenticated";
      context: Nullable<AuthContext> & {
        email: string;
        password: string;
        name: string | null;
        token: string;
      };
    }
  | {
      value: "failed";
      context: AuthContext & {
        email: string;
        password: string;
        name: string | null;
        errors: Record<string, string[]>;
      };
    };

export const authMachine = createMachine<AuthContext, AuthEvent, AuthState>(
  {
    id: "auth-request",
    initial: "idle",
    context: {
      name: null,
      email: null,
      password: null,
      errors: null,
      token: null
    },
    states: {
      idle: {
        on: {
          SUBMIT: {
            target: "submitting",
            actions: "assignFormValues"
          }
        }
      },
      submitting: {
        initial: "choosing",
        states: {
          choosing: {
            always: [
              {
                cond: "nameExists",
                target: "signup"
              },
              {
                target: "login"
              }
            ]
          },
          signup: {
            invoke: {
              id: "signupUser",
              src: "signupRequest",
              onDone: {
                target: "#auth-request.authenticated",
                actions: ["notifyParent", "assignData"]
              },
              onError: {
                target: "#auth-request.failed",
                actions: "assignErrors"
              }
            }
          },
          login: {
            invoke: {
              id: "loginUser",
              src: "loginRequest",
              onDone: {
                target: "#auth-request.authenticated",
                actions: ["notifyParent", "assignData"]
              },
              onError: {
                target: "#auth-request.failed",
                actions: "assignErrors"
              }
            }
          }
        }
      },
      authenticated: {
        onEntry: ["saveToken", "navigateHome"]
      },
      failed: {
        onExit: "clearErrors",
        on: {
          SUBMIT: {
            target: "submitting",
            actions: "assignFormValues"
          }
        }
      }
    }
  },
  {
    actions: {
      assignFormValues: assign((context, event) => {
        if (event.type === "SUBMIT") {
          return {
            ...context,
            name: event.name,
            email: event.email,
            password: event.password
          };
        }
        return context;
      }),
      assignData: assign({
        token: (context, event) => {
          if (
            event.type === "done.invoke.loginUser" ||
            event.type === "done.invoke.signupUser"
          ) {
            return event.data.user.token;
          }
          return context.token;
        }
      }),
      assignErrors: assign({
        errors: (context, event) => {
          if (event.type === "error.platform") {
            return event.data.errors;
          }
          return context.errors;
        }
      }),
      saveToken: context => {
        localStorage.setItem("conduit_token", context.token || "");
      },
      clearErrors: assign({
        errors: context => {
          if (!!context.errors) return null;
          return context.errors;
        }
      }),
      navigateHome: () => history.push("/"),
      notifyParent: sendParent((_context, event) => {
        if (
          event.type === "done.invoke.loginUser" ||
          event.type === "done.invoke.signupUser"
        ) {
          return {
            type: "LOGGED_IN",
            ...event.data
          };
        }
        return { type: "NEVER" };
      })
    },
    guards: {
      dataExists: (_context, event) => {
        if (
          event.type === "done.invoke.loginUser" ||
          event.type === "done.invoke.signupUser"
        ) {
          return !!event.data.user;
        }
        return false;
      },
      nameExists: context => !!context.name
    },
    services: {
      signupRequest: context =>
        post("users", {
          user: {
            username: context.name,
            email: context.email,
            password: context.password
          }
        }),
      loginRequest: context =>
        post("users/login", {
          user: { email: context.email, password: context.password }
        })
    }
  }
);
