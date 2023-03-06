import { AppMachineContext } from "../App"

export const useIsAuthenticated = () => {
  const { user } = AppMachineContext.useSelector(state => state.value);
  return user === "authenticated";
}
