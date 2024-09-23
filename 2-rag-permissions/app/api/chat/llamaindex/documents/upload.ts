import { VectorStoreIndex } from "llamaindex";
import { LlamaCloudIndex } from "llamaindex/cloud/LlamaCloudIndex";
import { loadDocuments, saveDocument } from "./helper";
import { runPipeline } from "./pipeline";

export async function uploadDocument(
  index: VectorStoreIndex | LlamaCloudIndex,
  raw: string,
  fileId: string,
  source: string,
): Promise<string[]> {
  const [header, content] = raw.split(",");
  const mimeType = header.replace("data:", "").replace(";base64", "");
  const fileBuffer = Buffer.from(content, "base64");
  const documents = await loadDocuments(fileBuffer, mimeType);
  const { filename } = await saveDocument(fileBuffer, mimeType);

  // Update documents with metadata
  for (const document of documents) {
    document.metadata = {
      ...document.metadata,
      fileId: fileId,
      file_name: filename,
      source: source,
      private: "true", // to separate private uploads from public documents
    };
  }

  return await runPipeline(index, documents);
}
