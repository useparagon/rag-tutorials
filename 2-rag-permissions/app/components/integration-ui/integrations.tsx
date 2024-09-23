"use client";

import { AuthenticatedConnectUser, paragon } from "@useparagon/connect";
import Login from "@/app/components/integration-ui/login";
import React, { useEffect, useState } from "react";
import { IIntegrationMetadata } from "@/node_modules/@useparagon/connect/dist/src/entities/integration.interface";

interface ChildProps {
    user: AuthenticatedConnectUser | null,
    setUser: (user: AuthenticatedConnectUser | null) => void
}
const Integrations: React.FC<ChildProps> = (props) => {
  const [integrationMetadata, setIntegrationMetadata] = useState<Array<IIntegrationMetadata>>([]);

  useEffect(() => {
    if(sessionStorage.getItem("jwt")){
      paragon.authenticate(process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID ?? "", sessionStorage.getItem("jwt") ?? "");
      const usr = paragon.getUser();
      if(usr.authenticated){
        props.setUser(usr);
      }
    }
  }, []);

  useEffect(() => {
    setIntegrationMetadata(paragon.getIntegrationMetadata());
  }, [props.user]);

  if(props.user !== null ) {
      return (
          <div className={"flex flex-col p-4 space-y-2"}>
            <h1 className={"text-2xl font-mono font-bold"}>Integrations:</h1>
            <div className={"flex justify-center space-x-8"}>
            {integrationMetadata.map((integration: IIntegrationMetadata) => {
              const integrationEnabled = props.user?.authenticated && props.user.integrations[integration.type]?.enabled;
              return (
                <div key={integration.type}
                     className={"flex space-x-2 border-2 border-gray-300 rounded-xl px-4 py-2 items-center justify-between"}>
                  <div className={"flex grow space-x-2"}>
                    <img src={integration.icon} style={{ maxWidth: "30px" }} />
                    <p>{integration.name}</p>
                  </div>
                  <button className={"text-white bg-blue-700 p-2 rounded-xl hover:bg-blue-400"}
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