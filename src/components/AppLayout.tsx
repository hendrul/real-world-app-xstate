import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { AppMachineContext } from '../App';
import { UserState } from '../machines/app.machine';
import { Footer } from './Footer';
import { Header } from './Header';

export const AppLayout: React.FC = () => {
  const [current] = AppMachineContext.useActor();
  const userState =
    (current.toStrings().find(state => state.includes("user.")) as UserState) ||
    "user.unauthenticated";
  return (
    <>
      <Header userState={userState} currentUser={current.context.user} />
      <Outlet />
      <Footer />
    </>
  )
}
