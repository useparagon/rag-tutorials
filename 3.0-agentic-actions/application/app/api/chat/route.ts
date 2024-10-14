import { initObservability } from "@/app/observability";
import { LlamaIndexAdapter, Message, StreamData } from "ai";
import {ChatMessage, ContextChatEngine, Settings, SimpleChatEngine} from "llamaindex";
import { NextRequest, NextResponse } from "next/server";
import {OpenAIAgent} from "llamaindex";
import { initSettings } from "./engine/settings";
import {
  isValidMessages,
  retrieveMessageContent,
} from "./llamaindex/streaming/annotations";
import { createCallbackManager } from "./llamaindex/streaming/events";
import { generateNextQuestions } from "./llamaindex/streaming/suggestion";
import jwt from "jsonwebtoken";
import {getPermittedDocuments} from "@/app/api/permissions";
import {createChatEngine} from "@/app/api/chat/engine/chat";
import {createAgent} from "@/app/api/chat/engine/agent";

initObservability();
initSettings();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Init Vercel AI StreamData and timeout
  const vercelStreamData = new StreamData();

  try {

    const body = await request.json();
    const headers = request.headers;
    let user: string | undefined | (() => string) = undefined;

    if(headers.get("authorization")){
      const token = headers.get("authorization")?.split(" ")[1];
      const verified = jwt.verify(token ?? "", process.env.SIGNING_KEY?.replaceAll("\\n", "\n") ?? "");
      user = verified.sub;
    }
    console.log("logged in user: " + user);

    const { messages, data }: { messages: Message[]; data?: any } = body;
    if (!isValidMessages(messages)) {
      return NextResponse.json(
        {
          error:
            "messages are required in the request body and the last message must be from the user",
        },
        { status: 400 },
      );
    }

    let chatEngine: OpenAIAgent | SimpleChatEngine | ContextChatEngine ;
    if(user){
      const ids = await getPermittedDocuments(user);
      console.log("Permitted Documents");
      console.log(ids);
      chatEngine = await createAgent(user, ids, data);
    } else{
      chatEngine = new SimpleChatEngine({
        llm:Settings.llm,
      });
    }

    // retrieve user message content from Vercel/AI format
    const userMessageContent = retrieveMessageContent(messages);

    // Setup callbacks
    const callbackManager = createCallbackManager(vercelStreamData);
    const chatHistory: ChatMessage[] = messages as ChatMessage[];

    // Calling LlamaIndex's ChatEngine to get a streamed response
    const response = await Settings.withCallbackManager(callbackManager, () => {
      return chatEngine.chat({
        message: userMessageContent,
        chatHistory,
        stream: true,
      });
    });

    const onFinal = (content: string) => {
      chatHistory.push({ role: "assistant", content: content });
      generateNextQuestions(chatHistory)
        .then((questions: string[]) => {
          if (questions.length > 0) {
            vercelStreamData.appendMessageAnnotation({
              type: "suggested_questions",
              data: questions,
            });
          }
        })
        .finally(() => {
          vercelStreamData.close();
        });
    };

    // @ts-ignore
    return LlamaIndexAdapter.toDataStreamResponse(response, {
      data: vercelStreamData,
      callbacks: { onFinal },
    });
  } catch (error) {
    console.error("[LlamaIndex]", error);
    return NextResponse.json(
      {
        detail: (error as Error).message,
      },
      {
        status: 500,
      },
    );
  }
}
