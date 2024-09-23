import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "../engine";
import { initSettings } from "../engine/settings";
import { Document } from "llamaindex";
import { runPipeline } from "@/app/api/chat/llamaindex/documents/pipeline";
initSettings();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const contents = await request.json();
    const documents = [new Document({text: contents.text,
      metadata:{
        URL: "Google Drive filename:" + contents.filename,
        fileId: contents.fileId,
        source: contents.source,
      }})];

    const index = await getDataSource();
    if (!index) {
      throw new Error(
        `StorageContext is empty - call 'npm run generate' to generate the storage first`,
      );
    } else{
      await runPipeline(index, documents)
      return NextResponse.json(
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("[Upload API]", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
