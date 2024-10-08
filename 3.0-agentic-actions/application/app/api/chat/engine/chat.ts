import {ContextChatEngine, Settings, SimpleChatEngine} from "llamaindex";
import { getDataSource } from "./index";
import { nodeCitationProcessor } from "./nodePostprocessors";
import { generateFilters } from "./queryFilter";

export async function createChatEngine(documentIds?: string[], params?: any) {
  const index = await getDataSource(params);
  if (!index) {
    throw new Error(
      `StorageContext is empty - call 'npm run generate' to generate the storage first`,
    );
  }
  const permissionFilters = generateFilters(documentIds || []);

  if(!permissionFilters.filters.length){
    return new SimpleChatEngine({
      llm:Settings.llm,
    });
  }
  console.log("using context from the following documents");
  console.log(documentIds);

  console.log(permissionFilters);

  const retriever = index.asRetriever({
    similarityTopK: process.env.TOP_K ? parseInt(process.env.TOP_K) : 3,
    filters: permissionFilters,
  });

  const systemPrompt = process.env.SYSTEM_PROMPT;
  const citationPrompt = process.env.SYSTEM_CITATION_PROMPT;
  const prompt =
    [systemPrompt, citationPrompt].filter((p) => p).join("\n") || undefined;
  const nodePostprocessors = citationPrompt
    ? [nodeCitationProcessor]
    : undefined;

  return new ContextChatEngine({
    chatModel: Settings.llm,
    retriever,
    systemPrompt: prompt,
    nodePostprocessors,
  });
}
