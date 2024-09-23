import {
  ContextChatEngine,
  MetadataFilter,
  MetadataFilters,
  Settings, SimpleChatEngine,
} from "llamaindex";
import { getDataSource } from "./index";

export async function createChatEngine(documentIds?: string[]) {
  const index = await getDataSource();
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

  const retriever = index.asRetriever({
    similarityTopK: process.env.TOP_K ? parseInt(process.env.TOP_K) : 3,
    filters: permissionFilters,
  });

  return new ContextChatEngine({
    chatModel: Settings.llm,
    retriever,
    systemPrompt: process.env.SYSTEM_PROMPT,
  });
}

export function generateFilters(documentIds: string[]): MetadataFilters {
  const filters: Array<MetadataFilter>= []

  documentIds.forEach((documentId) => {
    filters.push({
      key: "fileId",
      value: documentId,
      operator: "==",
    })
  });

  return {
    filters: filters,
    condition: "or"
  };
}
