"use client";

import { paragon } from "@useparagon/connect";
import React, { useEffect, useState } from "react";
import { IIntegrationMetadata } from "@/node_modules/@useparagon/connect/dist/src/entities/integration.interface";
import useParagon from "@/app/hooks/useParagon";
import { IntegrationPanel } from "./IntegrationPanel";



export const Sidebar = (chatProps: { addFunctionTool: (tool: any) => void, removeFunctionTool: (actionName: string) => void, activeTools: any }) => {
  const { paragonUser } = useParagon();
  const [sidebarState, setSidebarState] = useState<{ workflows: any, integrations: Array<IIntegrationMetadata>, activeIntegration: string, checkedActions: any }>
    ({ workflows: {}, integrations: [], activeIntegration: "", checkedActions: {} });

  useEffect(() => {
    fetchIntegrationMetadata().then((metadata) => {
      fetchIntegrations().then((integrations) => {
        fetchUserConfigs().then((configs) => {
          const workflowMap = {};
          const integrationMap = {};
          for (const integration of Object.keys(configs.integrations)) {
            for (const workflowId of Object.keys(configs.integrations[integration].configuredWorkflows)) {
              //@ts-ignore
              workflowMap[workflowId] = configs.integrations[integration].configuredWorkflows[workflowId];
            }
          }
          for (const integration of integrations) {
            for (let workflow of integration.workflows) {
              if (workflow.id in workflowMap) {
                console.log(workflow.id);
                //@ts-ignore
                workflow["config"] = workflowMap[workflow.id];
              }
            }
            //@ts-ignore
            integrationMap[integration.type] = integration.workflows;
          }
          setSidebarState((prev) => ({ ...prev, integrations: metadata, workflows: integrationMap }));
        });
      });
    });
  }, []);

  const fetchIntegrations = async () => {
    const url = "https://api.useparagon.com/projects/" + process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID + "/sdk/integrations";

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + sessionStorage.getItem("jwt"));
    const response = await fetch(url, {
      method: "GET",
      headers: headers
    });
    const body = await response.json();
    return body;
  }

  const fetchUserConfigs = async () => {
    const url = "https://api.useparagon.com/projects/" + process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID + "/sdk/me";

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + sessionStorage.getItem("jwt"));
    const response = await fetch(url, {
      method: "GET",
      headers: headers
    });
    const body = await response.json();
    return body;
  }


  const fetchIntegrationMetadata = async () => {
    const metadataUrl = "https://api.useparagon.com/projects/" + process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID + "/sdk/metadata";

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", "Bearer " + sessionStorage.getItem("jwt"));
    const metadataResponse = await fetch(metadataUrl, {
      method: "GET",
      headers: headers
    });
    const metadataBody = await metadataResponse.json();
    return metadataBody;
  }

  const toggleIntegrationPanel = async (integration: string, enabled: boolean) => {
    if (!enabled) {
      const credential = await paragon.installIntegration(integration, {});
      console.log(credential);
    }
    else if (integration === sidebarState.activeIntegration) {
      setSidebarState((prev) => ({ ...prev, activeIntegration: "" }));
    } else {
      setSidebarState((prev) => ({ ...prev, activeIntegration: integration }))
    }
  }

  return (
    <div className="p-2 flex flex-col space-y-2 overflow-y-scroll">
      {paragonUser?.authenticated && sidebarState.integrations.map((integration: IIntegrationMetadata) => {
        const integrationEnabled = paragonUser.authenticated && paragonUser.integrations[integration.type]?.enabled;
        return (
          <div key={integration.type}
            className="flex flex-col space-y-2 border-2 border-gray-300 rounded-md px-4 py-2">
            <button onClick={() => toggleIntegrationPanel(integration.type, integrationEnabled ?? false)}
              className={"col-span-1 flex space-x-2  items-center " +
                "justify-between overflow-x-scroll"}>
              <div className={"flex items-center space-x-2 w-1/2"}>
                <img src={integration.icon} style={{ maxHeight: "30px", maxWidth: "30px" }} />
                <p>{integration.name}</p>
              </div>
              <div className="flex items-center space-x-2 ">
                <div className={integrationEnabled ? "text-sm text-gray-800" : "text-sm text-gray-400"}>{integrationEnabled ? "Connected" : "Not Connected"}</div>
                <div className={integrationEnabled ? "rounded-full h-3 w-3 bg-green-400" : "rounded-full h-3 w-3 bg-gray-400"} />
              </div>
            </button>
            {integration.type === sidebarState.activeIntegration && <IntegrationPanel name={integration.type} workflows={sidebarState.workflows[integration.type]}
              addCheckedAction={chatProps.addFunctionTool} removeCheckedAction={chatProps.removeFunctionTool} activeTools={chatProps.activeTools} />}
          </div>
        );
      })}

    </div>
  );
}
