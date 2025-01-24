import {SearchResult} from "@/app/components/ui/search/types/search-result";
import Image from "next/image";
import React, {useState} from "react";
import {Button} from "@/app/components/ui/button";
import {AuthenticatedConnectUser} from "@useparagon/connect";
import ChatSection from "@/app/components/chat-section";

export default function SearchCard(props: {
    searchResult: SearchResult,
    user: {allowed: boolean}
}){
    const [openParato, setOpenParato] = useState<boolean>(false);

    const toggleParato = () => {
        setOpenParato(!openParato);
    }

    return(
        <div className={"border-b-2 border-b-blue-300 m-4 flex-col"}>
            <div className={"flex justify-between items-center"}>
                <div className={"flex items-center"}>
                    {props.searchResult.source === "googledrive" &&
                        <Image
                            className="rounded-xl"
                            src="/google-drive-logo.png"
                            alt="Google Drive Logo"
                            width={40}
                            height={40}
                            priority
                        />
                    }
                    {props.searchResult.source === "notion" &&
                        <Image
                            className="rounded-xl"
                            src="/notion-logo.png"
                            alt="Notion Logo"
                            width={40}
                            height={40}
                            priority
                        />
                    }
                    {!props.searchResult.source &&
                        <Image
                            className="rounded-xl"
                            src="/pdf-logo.jpeg"
                            alt="PDF Logo"
                            width={40}
                            height={40}
                            priority
                        />
                    }
                    {props.searchResult.link &&
                        <a className={"text-indigo-700 font-semibold hover:text-indigo-500 hover:-translate-y-0.5"}
                            href={props.searchResult.link}
                            target="_blank"
                        >{props.searchResult.file_name}</a>
                    }
                    {!props.searchResult.link &&
                        <a className={"text-indigo-700 font-semibold hover:text-indigo-500 hover:-translate-y-0.5"}
                           href={"api/files/output/uploaded/" + props.searchResult.file_name}
                           target="_blank"
                        >{props.searchResult.file_name}</a>
                    }
                </div>
                <Button variant="outline" size="sm" className={"h-8 border-2"} onClick={toggleParato}>
                    {!openParato ? "Summarize & Ask Parato" : "Close Chat"}
                </Button>
            </div>
            <div className={"px-10 py-4 "}>
                <div className={"line-clamp-2 hover:line-clamp-4"}>
                    {props.searchResult.text}
                </div>
            </div>
            {openParato &&
                <div className={"h-[50vh]"}>
                    <ChatSection
                        user={props.user}
                        preprompt={"Summarize Document: " + props.searchResult.text}>
                    </ChatSection>
                </div>}
        </div>
    )
}