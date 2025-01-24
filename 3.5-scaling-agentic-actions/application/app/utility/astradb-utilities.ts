import {Collection, DataAPIClient, FoundDoc, SomeDoc} from "@datastax/astra-db-ts";
import {Document, IngestionPipeline, Settings} from "llamaindex";

export const queryAstraDb = async(query: string, collection: Collection) => {
    const vec = await embedText(query);

    const cursor = await collection.find({}, {
        sort: { $vector: vec },
        limit: parseInt(process.env.TOP_K ?? "5"),
        includeSimilarity: true,
    });

    const nodes: Array<FoundDoc<SomeDoc>> = [];
    for await (const doc of cursor) {
        nodes.push(doc);
    }
    return nodes;
}

const embedText = async(text: string): Promise<Array<number>> => {
    const documents = [new Document({text: text})];

    const pipeline = new IngestionPipeline({
        transformations: [
            Settings.embedModel,
        ],
    });
    const nodes = await pipeline.run({ documents });
    return nodes[0].embedding ?? [];
}

export const deleteAstraDoc = async(id: string) => {
    const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
    const db = client.db(process.env.ASTRA_DB_API_ENDPOINT ?? "");
    const collection = db.collection(process.env.ASTRA_DB_COLLECTION_NAME ?? "");
    await collection.deleteMany({fileId: id});
}
