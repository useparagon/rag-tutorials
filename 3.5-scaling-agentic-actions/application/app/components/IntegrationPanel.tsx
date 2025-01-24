import { paragon } from "@useparagon/connect";
import { useEffect, useState } from "react";
import { useClientConfig } from "@/app/components/ui/chat/hooks/use-config";
import { toast } from "react-toastify";
import useParagon from "@/app/hooks/useParagon";

export const IntegrationPanel = (integration: {
  name: string, workflows: Array<any>,
  addCheckedAction: (action: any) => void, removeCheckedAction: (actionName: string) => void, activeTools: any
}) => {
  const [panelState, setPanelState] = useState<{ active: string, actions: Array<any>, workflows: Array<any> }>({ active: "actions", actions: [], workflows: [] });
  const { backend } = useClientConfig();
  const { paragonUser } = useParagon();

  useEffect(() => {
    fetchActions().then((actions) => {
      setPanelState((prev) => ({ ...prev, workflows: integration.workflows, actions: actions[integration.name] }));
    });
  }, []);

  const disconnectIntegration = async () => {
    const cred = await paragon.uninstallIntegration(integration.name, {});
    console.log(cred);
  }

  const fetchActions = async () => {
    const response = await fetch("https://actionkit.useparagon.com/projects/" + process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID + "/actions/?integrations=" + integration.name, {
      method: "GET",
      headers: { Authorization: "Bearer " + sessionStorage.getItem("jwt") },
    });

    const body = await response.json();
    return body;
  }

  const parseNames = (name: string) => {
    const nameArray = name.split("_");
    let res = "";
    for (const name of nameArray) {
      let newName = name.toLowerCase();
      newName = String(newName.charAt(0).toUpperCase()) + newName.slice(1);
      res += newName + " ";
    }
    return res.slice(0, -1);
  }

  const handleActionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    for (const action of panelState.actions) {
      if (action.function.name === e.target.value) {
        if (e.target.checked) {
          integration.addCheckedAction(action);
        } else {
          integration.removeCheckedAction(action.function.name);
        }
      }
    }
  }

  async function handleFiles(files: any) {
    if (paragonUser?.authenticated) {
      await fetch(backend + "/api/trigger/gdrive-filepicker", {
        method: "POST",
        body: JSON.stringify({ files: files }),
        headers: {
          "Content-Type": "application/json",
          Authorization: "bearer " + sessionStorage.getItem("jwt"),
        },
      })
        .then((response) => {
          response.json();
          toast.success("Files picked for ingestion! It will take a moment to retrieve files", {
            position: "top-right"
          });
        })
        .catch((error) =>
          console.log("Error trigger gdrive: " + error),
        );
    }
  }

  const openDriveFilePicker = async () => {
    let picker = new paragon.ExternalFilePicker("googledrive", {
      allowMultiSelect: true,
      onFileSelect: (files) => {
        handleFiles(files)
      }
    });
    if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      await picker.init({ developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY });
      picker.open();
    }
  }

  return (
    <div className="flex flex-col items-center max-h-96 overflow-y-scroll">
      <div className="flex w-full">
        <button onClick={() => { setPanelState((prev) => ({ ...prev, active: "actions" })) }}
          className={panelState.active === "actions" ? "font-bold border-stone-300 bg-stone-300 border-t-2 basis-1/2 rounded-t-sm border-x-2" : "bg-stone-100 border-t-2 basis-1/2 rounded-t-sm border-x-2"}>
          Actions
        </button>
        <button onClick={() => { setPanelState((prev) => ({ ...prev, active: "workflows" })) }}
          className={panelState.active === "workflows" ? "font-bold border-stone-300 bg-stone-300 border-t-2 basis-1/2 rounded-t-sm border-x-2" : "bg-stone-100 border-t-2 basis-1/2 rounded-t-sm border-x-2"}>
          Workflows
        </button>
      </div>
      <div className="p-2 flex flex-col space-y-2 bg-stone-300 w-full rounded-b-sm">
        {panelState.active === "actions" &&
          panelState.actions?.map((action) => {
            return (
              <div key={action.function.name}
                className="flex space-x-1 text-sm">
                <input type="checkbox" onChange={handleActionChange} value={action.function.name}
                  checked={action.function.name in integration.activeTools ? true : false} />
                <div>
                  {parseNames(action.function.name)}
                </div>
              </div>
            )
          })
        }
        {panelState.active === "workflows" && <>
          {integration.workflows.map((workflow: any) => {
            return (
              <div key={workflow.description}
                className="flex space-x-1 text-sm">
                <input checked type="checkbox" />
                <div>
                  {workflow.description}
                </div>
              </div>
            )
          })}
          {integration.name === 'googledrive' &&
            <button onClick={openDriveFilePicker} className="bg-blue-700 text-white w-fit place-self-center rounded-md py-1 px-2 text-sm hover:bg-blue-500">
              Open Filepicker
            </button>
          }
        </>
        }

      </div>
      <button onClick={disconnectIntegration}
        className="mt-2 w-fit bg-red-100 px-2 text-sm font-semibold hover:bg-red-200 border-2 border-slate-300 rounded-md">
        Disconnect
      </button>
    </div>
  );
}
