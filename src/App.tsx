import * as React from "react";
import { Router, Switch, Route } from "react-router-dom";
import { useMachine } from "@xstate/react";
import { inspect } from "@xstate/inspect";
import { history } from "./utils/history";
import { appMachine } from "./machines/app.machine";
import type { User } from "./types/api";
import { Header, UserState } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Auth } from "./pages/Auth";
import { Editor } from "./pages/Editor";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import { Article } from "./pages/Article";

if (process.env.NODE_ENV !== "production") {
  inspect({
    iframe: false
  });
}

/*
TODO:

- feed view
- editor view
- article view
- profile view

*/
export const App: React.FC = () => {
  const [current, send] = useMachine(appMachine, { devTools: true });

  if (current.context.auth === null) return null;
  const userState = current
    .toStrings()
    .find(state => state.includes("user.")) as UserState | undefined;

  return (
    <Router history={history}>
      <Header
        userState={userState || "user.unauthenticated"}
        currentUser={current.context.user}
      />
      <Switch>
        <Route exact={true} path="/">
          <Home />
        </Route>
        <Route path="/register">
          <Auth authService={current.context.auth} />
        </Route>
        <Route path="/login">
          <Auth key="login" mode="login" authService={current.context.auth} />
        </Route>
        <Route path="/editor">
          <Editor />
        </Route>
        <Route path="/settings">
          {current.context.user && (
            <Settings
              currentUser={current.context.user}
              onLogout={() => send({ type: "LOGGED_OUT" })}
              onUpdate={(user: User) => send({ type: "UPDATE_USER", user })}
            />
          )}
        </Route>
        <Route path="/profile/:username">
          <Profile />
        </Route>
        <Route path="/profile/:username/favorites">
          <Profile />
        </Route>
        <Route path="/article/:slug">
          <Article />
        </Route>
      </Switch>
      <Footer />
    </Router>
  );
};
