"use client";

import { useChat } from "ai/react";
import React, { useEffect, useState } from "react";
import { useClientConfig } from "@/app/components/ui/chat/hooks/use-config";
import { ChatInput, ChatMessages } from "@/app/components/ui/chat";
import { Sidebar } from "./Sidebar";



interface ChildProps {
  user: { allowed: boolean },
  preprompt?: string
}
const ChatSection: React.FC<ChildProps> = (props) => {
  const { backend } = useClientConfig();
  const [chatState, setChatState] = useState<{ headers: any, body: { tools: any } }>({ headers: { "Content-Type": "application/json", }, body: { tools: {} } });

  useEffect(() => {
    if (sessionStorage.getItem("jwt")) {
      setChatState((prev) => ({ ...prev, headers: { ...prev.headers, "Authorization": "Bearer " + sessionStorage.getItem("jwt") } }));
    }
  }, [props.user]);

  const addFunctionTool = (action: any) => {
    const actionItem = { [action.function.name]: action };
    setChatState((prev) => ({ ...prev, body: { tools: { ...prev.body.tools, ...actionItem } } }));
  }

  const removeFunctionTool = (actionName: string) => {
    const functionTools = chatState.body.tools;
    delete functionTools[actionName];
    setChatState((prev) => ({ ...prev, body: { tools: functionTools } }));
  }

  const {
    messages,
    input,
    isLoading,
    handleSubmit,
    handleInputChange,
    reload,
    stop,
    append,
    setInput
  } = useChat({
    api: `${backend}/api/chat`,
    headers: chatState.headers,
    body: chatState.body,
    onError: (error: unknown) => {
      if (!(error instanceof Error)) throw error;
      const message = JSON.parse(error.message);
      alert(message.detail);
    },
  });

  console.log(chatState);

  return (
    <div className="h-[82vh] flex">
      <div className="w-[70%] h-full flex flex-col overflow-y-auto">
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
          preprompt={props.preprompt}
        />
      </div>
      <div className="w-[30%] h-full border-t-2 bg-stone-100">
        <Sidebar addFunctionTool={addFunctionTool} removeFunctionTool={removeFunctionTool} activeTools={chatState.body.tools} />
      </div>
    </div>
  );
}
export default ChatSection;
