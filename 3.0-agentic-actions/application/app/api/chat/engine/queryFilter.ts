import { MetadataFilter, MetadataFilters } from "llamaindex";

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