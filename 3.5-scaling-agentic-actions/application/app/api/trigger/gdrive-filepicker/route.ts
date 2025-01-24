import {NextRequest, NextResponse} from "next/server";
import jwt from "jsonwebtoken";
import {ingestFile, ingestPermission, signJwt, verifyUser} from "@/app/utility/request-utilities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const headers = request.headers;
        const user = verifyUser(headers);

        if(!user){
            return NextResponse.json(
                {
                    detail: "User is unauthorized",
                },
                {
                    status: 401,
                },
            );
        }

        await ingestFile(body.files.docs, signJwt(user));
        await ingestPermission(body.files.docs, signJwt(user));
        return NextResponse.json(
            {status: 200}
        )
    } catch (error) {
        console.error("[Drive Filepicker]", error);
        return NextResponse.json(
            {
                detail: (error as Error).message,
            },
            {
                status: 500,
            },
        );
    }
}
