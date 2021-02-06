import * as React from "react";
import { Formik, Form, Field } from "Formik";
import { createMachine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import { put } from "../utils/api-client";
import { history } from "../utils/history";
import type { User, UserResponse } from "../types/api";

const settingsMachine = createMachine(
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
          onDone: [
            {
              target: "success",
              cond: "userDataExists",
              actions: "assignData"
            },
            {
              target: "failed",
              actions: "assignErrors"
            }
          ],
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
      assignFormValues: assign({ user: (_context, event) => event.values }),
      assignData: assign({ user: (_context, event) => event.data.user }),
      assignErrors: assign({ errors: (_context, event) => event.data.errors }),
      goToProfile: context =>
        history.push(`/profile/${context.user?.username}`),
      clearErrors: assign({ errors: null })
    },
    guards: {
      userDataExists: (_context, event) => !!event.data.user
    },
    services: {
      userRequest: ({ user }) => put("user", { user })
    }
  }
);

type SettingsProps = {
  currentUser: User;
  onLogout: () => void;
  onUpdate: (user: User) => void;
};

export const Settings: React.FC<SettingsProps> = ({
  currentUser,
  onLogout,
  onUpdate
}) => {
  const [current, send] = useMachine(settingsMachine, {
    devTools: true,
    actions: {
      updateParent: ({ user }) => onUpdate(user)
    }
  });

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>
            <Formik<User>
              initialValues={currentUser}
              onSubmit={values => {
                send({ type: "SUBMIT", values });
              }}
              enableReinitialize={true}
            >
              <Form>
                <fieldset>
                  <fieldset className="form-group">
                    <Field
                      className="form-control"
                      type="text"
                      id="image"
                      name="image"
                      placeholder="URL of profile picture"
                    />
                  </fieldset>
                  <fieldset className="form-group">
                    <Field
                      className="form-control form-control-lg"
                      type="text"
                      id="username"
                      name="username"
                      placeholder="Your Name"
                    />
                  </fieldset>
                  <fieldset className="form-group">
                    <Field
                      as="textarea"
                      id="bio"
                      name="bio"
                      className="form-control form-control-lg"
                      rows="8"
                      placeholder="Short bio about you"
                    />
                  </fieldset>
                  <fieldset className="form-group">
                    <Field
                      className="form-control form-control-lg"
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email"
                    />
                  </fieldset>
                  <fieldset className="form-group">
                    <Field
                      id="password"
                      name="password"
                      className="form-control form-control-lg"
                      type="password"
                      placeholder="Password"
                    />
                  </fieldset>
                  <button
                    type="submit"
                    className="btn btn-lg btn-primary pull-xs-right"
                    disabled={current.matches("submitting")}
                  >
                    {current.matches("submitting")
                      ? "Updating..."
                      : "Update Settings"}
                  </button>
                </fieldset>
              </Form>
            </Formik>
            <hr />
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={onLogout}
            >
              Or click here to logout.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
