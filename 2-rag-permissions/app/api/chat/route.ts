import { initObservability } from "@/app/observability";
import { JSONValue, Message, StreamData, StreamingTextResponse } from "ai";
import { ChatMessage, Settings } from "llamaindex";
import { NextRequest, NextResponse } from "next/server";
import { createChatEngine } from "./engine/chat";
import { initSettings } from "./engine/settings";
import {
  convertMessageContent,
} from "./llamaindex/streaming/annotations";
import {
  createCallbackManager,
  createStreamTimeout,
} from "./llamaindex/streaming/events";
import { LlamaIndexStream } from "./llamaindex/streaming/stream";
import jwt from "jsonwebtoken";
import {checkThirdPartyPermissions, getPermittedDocuments} from "@/app/api/permissions";

initObservability();
initSettings();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Init Vercel AI StreamData and timeout
  const vercelStreamData = new StreamData();
  const streamTimeout = createStreamTimeout(vercelStreamData);

  try {
    const body = await request.json();
    const headers = request.headers;
    let user: string | undefined | (() => string) = undefined;

    if(headers.get("authorization")){
      const token = headers.get("authorization")?.split(" ")[1];
      const verified = jwt.verify(token ?? "", process.env.SIGNING_KEY?.replaceAll("\\n", "\n") ?? "");
      user = verified.sub;
    }

    const { messages }: { messages: Message[] } = body;
    const userMessage = messages.pop();
    if (!messages || !userMessage || userMessage.role !== "user") {
      return NextResponse.json(
        {
          error:
            "messages are required in the request body and the last message must be from the user",
        },
        { status: 400 },
      );
    }

    let annotations = userMessage.annotations;
    if (!annotations) {
      // the user didn't send any new annotations with the last message
      // so use the annotations from the last user message that has annotations
      // REASON: GPT4 doesn't consider MessageContentDetail from previous messages, only strings
      annotations = messages
        .slice()
        .reverse()
        .find(
          (message) => message.role === "user" && message.annotations,
        )?.annotations;
    }

    console.log("logged in user: " + user);

    //gets permitted document IDs using fga graph (managed cache), then checks third party permissions
    const ids = await getPermittedDocuments(user);
    console.log("fga permitted documents:");
    console.log(ids);
    const verifiedIds = await checkThirdPartyPermissions(ids, user);
    const chatEngine = await createChatEngine(verifiedIds);

    // Convert message content from Vercel/AI format to LlamaIndex/OpenAI format
    const userMessageContent = convertMessageContent(
      userMessage.content,
      annotations,
    );

    // Setup callbacks
    const callbackManager = createCallbackManager(vercelStreamData);

    // Calling LlamaIndex's ChatEngine to get a streamed response
    const response = await Settings.withCallbackManager(callbackManager, () => {
      return chatEngine.chat({
        message: userMessageContent,
        chatHistory: messages as ChatMessage[],
        stream: true,
      });
    });

    // Transform LlamaIndex stream to Vercel/AI format
    const stream = LlamaIndexStream(
      response,
      vercelStreamData,
      messages as ChatMessage[],
    );

    // Return a StreamingTextResponse, which can be consumed by the Vercel/AI client
    return new StreamingTextResponse(stream, {}, vercelStreamData);
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
  } finally {
    clearTimeout(streamTimeout);
  }
}

