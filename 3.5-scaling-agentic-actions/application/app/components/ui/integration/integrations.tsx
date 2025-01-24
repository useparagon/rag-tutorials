"use client";

import { paragon } from "@useparagon/connect";
import Login from "@/app/components/ui/integration/login";
import React, { useEffect, useState } from "react";
import { IIntegrationMetadata } from "@/node_modules/@useparagon/connect/dist/src/entities/integration.interface";
import useParagon from "@/app/hooks/useParagon";
import { useClientConfig } from "@/app/components/ui/chat/hooks/use-config";
import { toast, ToastContainer } from "react-toastify";

interface ChildProps {
    user: { allowed: boolean, email: string }
}
const Integrations: React.FC<ChildProps> = (props) => {
    const { paragonUser } = useParagon();
    const [integrationMetadata, setIntegrationMetadata] = useState<Array<IIntegrationMetadata>>([]);
    const { backend } = useClientConfig();

    useEffect(() => {
        fetchIntegrationMetadata().then((metadata) => {
            setIntegrationMetadata(metadata);
        });
    }, [props.user]);


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

    async function handleFiles(files: any) {
        console.log("in the handle file method");
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
            console.log(files);
        }
    }

    const openDriveFilePicker = async () => {
        let picker = new paragon.ExternalFilePicker("googledrive", {
            allowMultiSelect: true,
            onFileSelect: (files) => {
                // Handle file selection
                handleFiles(files)
            }
        });
        if (process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
            await picker.init({ developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY });
            picker.open();
        }
    }



    console.log(paragonUser);
    if (props.user.email) {
        return (
            <div className={"flex flex-col w-1/2 p-4 space-y-2 z-10 bg-gray-50 border-2 border-gray-400 rounded-xl " +
                "absolute top-44 left-1/2 transform -translate-x-1/2 -translate-y-1/2"}>
                <h1 className={"text-2xl font-['Helvetica'] font-bold"}>Integrations:</h1>
                <div className={"grid grid-cols-3 gap-4 justify-center"}>
                    {props.user.allowed && paragonUser?.authenticated && integrationMetadata.map((integration: IIntegrationMetadata) => {
                        const integrationEnabled = paragonUser.authenticated && paragonUser.integrations[integration.type]?.enabled;
                        return (
                            <div key={integration.type}
                                className={"col-span-1 flex space-x-2 border-2 border-gray-300 rounded-xl px-4 py-8 items-center " +
                                    "justify-between overflow-x-scroll"}>
                                <div className={"flex items-center space-x-2"}>
                                    <img src={integration.icon} style={{ maxWidth: "30px" }} />
                                    <p>{integration.name}</p>
                                </div>
                                <div className={"flex flex-col space-y-2"}>
                                    <button
                                        className={integrationEnabled ? "text-white bg-green-800 p-2 rounded-xl hover:bg-blue-400" : "text-white bg-blue-700 p-2 rounded-xl hover:bg-blue-400"}
                                        onClick={() => paragon.connect(integration.type, {})}>
                                        {integrationEnabled ? "Manage" : "Enable"}
                                    </button>
                                    {integrationEnabled && integration.type === "googledrive" && <button
                                        className={"text-white bg-blue-700 p-2 rounded-xl hover:bg-blue-400 text-xs"}
                                        onClick={openDriveFilePicker}>
                                        File Picker
                                    </button>}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        );
    } else {
        return (
            <div className={"flex justify-center absolute top-36 left-1/2 transform -translate-x-1/2 -translate-y-1/2"}>
                <Login />
            </div>
        );
    }
}
export default Integrations;
