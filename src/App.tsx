import * as React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Auth } from "./pages/Auth";
import { Editor } from "./pages/Editor";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import { Article } from "./pages/Article";

export const App: React.FC = () => {
  return (
    <Router>
      <Header />
      <Switch>
        <Route exact={true} path="/">
          <Home />
        </Route>
        <Route path="/register">
          <Auth />
        </Route>
        <Route path="/editor">
          <Editor />
        </Route>
        <Route path="/settings">
          <Settings />
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
