"use client";

import { AuthenticatedConnectUser, paragon, SDK_EVENT } from "@useparagon/connect";
import Login from "@/app/components/integration-ui/login";
import React, { useCallback, useEffect, useState } from "react";
import { IIntegrationMetadata } from "@/node_modules/@useparagon/connect/dist/src/entities/integration.interface";
import useParagon from "@/app/hooks/useParagon";

interface ChildProps {
    user: AuthenticatedConnectUser | null,
    setUser: (user: AuthenticatedConnectUser | null) => void
}
const Integrations: React.FC<ChildProps> = (props) => {
  const [integrationMetadata, setIntegrationMetadata] = useState<Array<IIntegrationMetadata>>([]);
  const {user} = useParagon();

  useEffect(() => {
    if(sessionStorage.getItem("jwt") && user.authenticated){
      props.setUser(user);
    }
  }, [])

  useEffect(() => {
    setIntegrationMetadata(paragon.getIntegrationMetadata());
  }, [props.user]);

  console.log(props.user);
  console.log(integrationMetadata);

  if(props.user !== null ) {
      return (
          <div className={"flex flex-col p-4 space-y-2"}>
            <h1 className={"text-2xl font-mono font-bold"}>Integrations:</h1>
            <div className={"flex justify-center space-x-8"}>
            {integrationMetadata.map((integration: IIntegrationMetadata) => {
              const integrationEnabled = props.user?.authenticated && props.user.integrations[integration.type]?.enabled;
              console.log(integrationEnabled);
              return (
                <div key={integration.type}
                     className={"flex space-x-2 border-2 border-gray-300 rounded-xl px-4 py-2 items-center justify-between"}>
                  <div className={"flex grow space-x-2"}>
                    <img src={integration.icon} style={{ maxWidth: "30px" }} />
                    <p>{integration.name}</p>
                  </div>
                  <button className={integrationEnabled ? "text-white bg-green-800 p-2 rounded-xl hover:bg-blue-400" : "text-white bg-blue-700 p-2 rounded-xl hover:bg-blue-400"}
                          onClick={() => paragon.connect(integration.type, {})}>
                    {integrationEnabled ? "Manage" : "Enable"}
                  </button>
                </div>
              );
            })}
            </div>
          </div>
      );
    } else{
    return (
      <div className={"flex justify-center"}>
        <Login setUser={props.setUser} />
      </div>
    );
  }
}
export default Integrations;