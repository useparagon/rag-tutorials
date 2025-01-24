import {NextRequest, NextResponse} from "next/server";
import {signJwt} from "@/app/utility/request-utilities";

export async function POST(request: NextRequest) {
    try {
        const contents = await request.json();
        const email = contents.email;
        const jwt = signJwt(email);

        return NextResponse.json(
            {status: 200, jwt: jwt},
        );
    } catch (error) {
        console.error("[Upload API]", error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 },
        );
    }
}