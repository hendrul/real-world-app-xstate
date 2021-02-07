import { createMachine, assign } from "xstate";
import { history } from "../utils/history";
import { put } from "../utils/api-client";
import type { User, UserResponse, Errors } from "../types/api";

export type SettingsContext = {
  user: User | null;
  errors: Errors | null;
};

export type SettingsEvent =
  | {
      type: "SUBMIT";
      values: User;
    }
  | {
      type: "done.invoke.updateUser";
      data: UserResponse;
    }
  | {
      type: "error.platform";
      data: { errors: Errors };
    };

export type SettingsState = {
  value: 'idle';
  context: {
    user: null;
    errors: null;
  }
} | {
  value: 'submitting';
  context: {
    user: null;
    errors: null;
  };
} | {
  value: 'success';
  context: {
    user: User;
    errors: null;
  };
} | {
  value: 'failed';
  context: {
    user: null;
    errors: Errors;
  };
}

export const settingsMachine = createMachine<SettingsContext, SettingsEvent, SettingsState>(
  {
    id: "settings-request",
    initial: "idle",
    context: {
      user: null,
      errors: null
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
        invoke: {
          id: "updateUser",
          src: "userRequest",
          onDone: {
            target: "success",
            actions: "assignData"
          },
          onError: {
            target: "failed",
            actions: "assignErrors"
          }
        }
      },
      success: {
        onEntry: ["updateParent", "goToProfile"]
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
      assignFormValues: assign({ user: (context, event) => {
        if (event.type === 'SUBMIT') return event.values;
        return context.user;
      }}),
      assignData: assign({ user: (context, event) => {
        if (event.type === 'done.invoke.updateUser') return event.data.user;
        return context.user;
      }}),
      assignErrors: assign({ errors: (context, event) => {
        if (event.type === 'error.platform') return event.data.errors;
        return context.errors;
      }}),
      goToProfile: context =>
        history.push(`/profile/${context.user?.username}`),
      clearErrors: assign<SettingsContext, SettingsEvent>({ errors: null })
    },
    services: {
      userRequest: ({ user }) =>
        put<UserResponse, { user: User | null }>("user", { user })
    }
  }
);
