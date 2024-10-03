import { NextRequest, NextResponse } from "next/server";
import {getFga, updatePermissions, writeFileRelationship, writePermissions} from "@/app/api/permissions/index"; // OR import { CredentialsMethod, OpenFgaClient } from '@openfga/sdk';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const response = await request.json();

    try {
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
            return NextResponse.json(
                { error : "data format not supported" },
                { status: 400 },
            );
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

