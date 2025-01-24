import {getDataSource} from "@/app/api/chat/engine";
import {generateFilters} from "@/app/api/chat/engine/queryFilter";

export const queryPinecone = async(searchTerm: string, documentIds?: string[], params?: any) => {
    const index = await getDataSource(params);
    const permissionFilters = generateFilters(documentIds || []);
    const queryEngine = index.asQueryEngine({
        similarityTopK: process.env.TOP_K ? parseInt(process.env.TOP_K) : 3,
        // preFilters: permissionFilters,
    });
    const response = await queryEngine.query({
        query: searchTerm,
        stream: false
    });

    const nodes: any = [];
    if(!response.sourceNodes) return nodes;
    for(const sourceNode of response.sourceNodes){
        console.log(sourceNode.node.metadata.file_name ? sourceNode.node.metadata.file_name : sourceNode.node.metadata.URL);
        console.log(sourceNode.score);
        const fileName = sourceNode.node.metadata.file_name ? sourceNode.node.metadata.file_name : sourceNode.node.metadata.URL;
        const source = {
            file_name: fileName,
            link: sourceNode.node.metadata.link,
            source: sourceNode.node.metadata.source,
            // @ts-ignore
            text: sourceNode.node.text
        }
        nodes.push(source);
    }
    return nodes;
}