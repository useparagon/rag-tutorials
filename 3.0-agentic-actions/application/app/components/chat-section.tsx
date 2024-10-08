"use client";

import { useChat } from "ai/react";
import React, {useEffect, useState} from "react";
import {useClientConfig} from "@/app/components/ui/chat/hooks/use-config";
import {ChatInput, ChatMessages} from "@/app/components/ui/chat";
import {AuthenticatedConnectUser} from "@useparagon/connect";



interface ChildProps {
  user: AuthenticatedConnectUser | null,
}
const ChatSection: React.FC<ChildProps> = (props) => {
  const { backend } = useClientConfig();
  const [headers, setHeader] = useState<any>({"Content-Type": "application/json",})

  useEffect(() => {
    if(sessionStorage.getItem("jwt")){
      // @ts-ignore
      setHeader({...headers, "Authorization": "Bearer " + sessionStorage.getItem("jwt")});
    }
  }, [props.user]);


  const {
    messages,
    input,
    isLoading,
    handleSubmit,
    handleInputChange,
    reload,
    stop,
    append,
    setInput,
  } = useChat({
    api: `${backend}/api/chat`,
    headers: headers,
    onError: (error: unknown) => {
      if (!(error instanceof Error)) throw error;
      const message = JSON.parse(error.message);
      alert(message.detail);
    },
  });

  return (
      <div className="space-y-4 w-full h-full flex flex-col">
        <ChatMessages
            messages={messages}
            isLoading={isLoading}
            reload={reload}
            stop={stop}
            append={append}
        />
        <ChatInput
            input={input}
            handleSubmit={handleSubmit}
            handleInputChange={handleInputChange}
            isLoading={isLoading}
            messages={messages}
            append={append}
            setInput={setInput}
        />
      </div>
  );
}
export default ChatSection;