import {NextRequest, NextResponse} from "next/server";
import {DataAPIClient} from "@datastax/astra-db-ts";
import {queryAstraDb} from "@/app/utility/astradb-utilities";

export async function POST(request: NextRequest) {
    const response = await request.json();

    try {
        const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
        const db = client.db(process.env.ASTRA_DB_API_ENDPOINT ?? "");
        const collection = db.collection(process.env.ASTRA_DB_COLLECTION_NAME ?? "");

        await queryAstraDb(response.data, collection);
        return NextResponse.json(
            { status: 200 }
        );
    } catch (error) {
        console.log(response);
        console.error("[AstraDb Route]", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        );
    }
}