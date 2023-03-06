import * as React from "react";
import { Formik, Form, Field } from "formik";
import { useMachine } from "@xstate/react";
import { settingsMachine, settingsModel } from "../machines/settings.machine";
import { isProd } from "../utils/env";
import type { User } from "../types/api";
import { AppMachineContext } from "../App";
import { appModel } from "../machines/app.machine";

export const Settings: React.FC = () => {
  const [appState, sendToApp] = AppMachineContext.useActor();
  const currentUser = appState.context.user!;
  const onLogout = () => sendToApp(appModel.events.logOut())
  const onUpdate = (user: User) => sendToApp(appModel.events.updateUser(user))
  const [current, send] = useMachine(settingsMachine, {
    devTools: !isProd(),
    actions: {
      updateParent: ({ user }) => {
        if (user) onUpdate(user);
      }
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
                send(settingsModel.events.submit(values));
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
