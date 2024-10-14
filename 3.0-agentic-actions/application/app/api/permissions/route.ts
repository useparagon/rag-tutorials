import { NextRequest, NextResponse } from "next/server";
import {getFga, updatePermissions, writeFileRelationship, writePermissions} from "@/app/api/permissions/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const response = await request.json();

    try {
        if(Array.isArray(response.data) && response.type !== "update"){
            for(const res of response.data){
                let resObject = {type: response.type, source: response.source, data: res}
                await handlePermission(resObject);
            }
        } else{
            await handlePermission(response);
        }

        return NextResponse.json(
          { status: 200 }
        );

    } catch (error) {
        console.log(response);
        console.error("[Permissions API]", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        );
    }
}

const handlePermission = async(response: any) => {
    const fga = getFga();

    if(response.type && response.type === "update"){
        console.log("updating");
        await updatePermissions(fga, response.data, response.source);
    } else if(response.type && response.type === "permission"){
        console.log("Writing new permission");
        await writePermissions(fga, response.data, response.source);
    } else if(response.type && response.type === "parent"){
        await writeFileRelationship(fga, response.data);
    } else{
        console.log("data format not supported");
    }
}

