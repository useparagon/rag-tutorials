import {NextRequest, NextResponse} from "next/server";
import {queryPinecone} from "@/app/api/search/index";

export async function POST(request: NextRequest) {
    const response = await request.json();
    console.log("search term: " + response.searchTerm);
    const queryResult = await queryPinecone(response.searchTerm);
    return NextResponse.json(
        { status: 200 ,nodes: queryResult }
    );
}