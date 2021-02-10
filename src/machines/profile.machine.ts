import {
  createMachine,
  assign,
  spawn,
  actions,
  ActorRef,
  EventObject
} from "xstate";
import { history } from "../utils/history";
import { get, post, del } from "../utils/api-client";
import type { Profile, ProfileResponse, Errors } from "../types/api";

const { choose } = actions;

type ProfileContext = {
  profile?: Profile | Partial<Profile>;
  errors?: Errors;
  followerRef?: ActorRef<EventObject>;
};

type ProfileEvent =
  | {
      type: "done.invoke.profileRequest";
      data: ProfileResponse;
    }
  | {
      type: "error.platform";
      data: { errors: Errors };
    }
  | {
      type: "TOGGLE_FOLLOWING";
    }
  | {
      type: "done.invoke.followRequest";
      data: ProfileResponse;
    };

type ProfileState =
  | {
      value: "loading";
      context: {
        profile: Partial<Profile>;
        errors: undefined;
      };
    }
  | {
      value: "profileLoaded";
      context: {
        profile: Profile;
        errors: undefined;
      };
    }
  | {
      value: "errored";
      context: {
        profile: undefined;
        errors: Errors;
      };
    };

export const profileMachine = createMachine<
  ProfileContext,
  ProfileEvent,
  ProfileState
>(
  {
    id: "profile-loader",
    initial: "loading",
    states: {
      loading: {
        invoke: {
          id: "profileRequest",
          src: "getProfile",
          onDone: {
            target: "profileLoaded",
            actions: "assignData"
          },
          onError: {
            target: "errored",
            actions: "assignErrors"
          }
        }
      },
      profileLoaded: {
        on: {
          TOGGLE_FOLLOWING: {
            actions: choose([
              {
                cond: "notAuthenticated",
                actions: "goToSignup"
              },
              {
                cond: "isFollowing",
                actions: "unfollowProfile"
              },
              {
                actions: "followProfile"
              }
            ])
          }
        }
      },
      errored: {}
    }
  },
  {
    actions: {
      assignData: assign({
        profile: (context, event) => {
          if (
            event.type === "done.invoke.profileRequest" ||
            event.type === "done.invoke.followRequest"
          )
            return event.data.profile;
          return context.profile;
        }
      }),
      assignErrors: assign({
        errors: (context, event) => {
          if (event.type === "error.platform") return event.data.errors;
          return context.errors;
        }
      }),
      followProfile: assign(context => {
        const { profile } = context;
        return {
          ...context,
          profile: {
            ...profile,
            following: true
          },
          followerRef: spawn(
            post<ProfileResponse, undefined>(
              `profiles/${profile?.username}/follow`,
              undefined
            ),
            "followRequest"
          )
        };
      }),
      goToSignup: () => history.push("/register"),
      unfollowProfile: assign(context => {
        const { profile } = context;
        return {
          ...context,
          profile: {
            ...profile,
            following: false
          },
          followerRef: spawn(
            del<ProfileResponse>(`profiles/${profile?.username}/follow`),
            "followRequest"
          )
        };
      })
    },
    guards: {
      isFollowing: ({ profile }) => !!profile?.following
    },
    services: {
      getProfile: ({ profile }) =>
        get<ProfileResponse>(`profiles/${profile?.username}`)
    }
  }
);
