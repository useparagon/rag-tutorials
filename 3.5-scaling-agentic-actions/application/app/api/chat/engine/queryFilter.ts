import { MetadataFilter, MetadataFilters } from "llamaindex";

export function generateFilters(documentIds: string[]): MetadataFilters {
  const filters: Array<MetadataFilter>= [];

  filters.push({
    key: "fileId",
    value: 'Salesforce-Contac',
    operator: "contains",
  })

  return {
    filters: filters
  };
}