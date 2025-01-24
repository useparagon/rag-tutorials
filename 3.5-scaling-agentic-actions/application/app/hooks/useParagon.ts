import { useCallback, useEffect, useState } from "react";
import {AuthenticatedConnectUser, ConnectUser, paragon, SDK_EVENT} from "@useparagon/connect";

export default function useParagon() {
  const [paragonUser, setParagonUser] = useState<ConnectUser | null>(paragon.getUser());
  const [error, setError] = useState();

  const updateUser = useCallback(() => {
    const authedUser = paragon.getUser();
    if (authedUser.authenticated) {
      setParagonUser({ ...authedUser });
    }
  }, []);

  // Listen for account state changes
  useEffect(() => {
    paragon.subscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, updateUser);
    paragon.subscribe(SDK_EVENT.ON_INTEGRATION_UNINSTALL, updateUser);
    return () => {
      paragon.subscribe(SDK_EVENT.ON_INTEGRATION_INSTALL, updateUser);
      paragon.subscribe(SDK_EVENT.ON_INTEGRATION_UNINSTALL, updateUser);
    };
  }, []);

  useEffect(() => {
    if (!error) {
      paragon
        .authenticate(
          process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID ?? "",
          sessionStorage.getItem("jwt") ?? "",
        )
        .then(() => {
          const authedUser = paragon.getUser();
          if (authedUser.authenticated) {
            setParagonUser(authedUser);
          }
        })
        .catch(setError);
    }
  }, [error]);

  return {
    paragon,
    paragonUser,
    error,
    updateUser
  };
}