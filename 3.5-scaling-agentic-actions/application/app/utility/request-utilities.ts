import jwt from "jsonwebtoken";
import {NextRequest, NextResponse} from "next/server";

export function signJwt(userId: string | undefined | (() => string)): string {
  const currentTime = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      sub: userId,
      iat: currentTime,
      exp: currentTime + (60 * 60 * 24 * 7), // 1 week from now
    },
    process.env.SIGNING_KEY?.replaceAll("\\n", "\n") ?? "",
    {
      algorithm: "RS256",
    },
  );
}

export function verifyUser(headers: NextRequest["headers"]): string | undefined | (() => string) {
    let user: string | undefined | (() => string) = undefined;

    if(headers.get("authorization")){
        const token = headers.get("authorization")?.split(" ")[1];
        const verified = jwt.verify(token ?? "", process.env.SIGNING_KEY?.replaceAll("\\n", "\n") ?? "");
        user = verified.sub;
    }
    console.log("logged in user: " + user);
    if(typeof(user) === "string" && user.split("@")[1] !== (process.env.NEXT_PUBLIC_AUTHORIZED_DOMAIN ?? "useparagon.com")){
        return "";
    }
    return user;
}

export async function sendSlack(message: string, jwt: string) {
  return await fetch(process.env.SEND_SLACK_ENDPOINT ?? "", {
      method: "POST",
      body: JSON.stringify({ message: message }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "bearer " + jwt,
      },
    })
  .then((response) => response.json())
  .catch((error) =>
    console.log("Error sending Slack message: " + message + " - " + error),
    );
}

export async function createSalesforceContact(contact: {first_name: string, last_name: string, email: string, title: string}, jwt: string) {
    return await fetch(process.env.CREATE_SALESFORCE_CONTACT_ENDPOINT ?? "", {
        method: "POST",
        body: JSON.stringify(contact),
        headers: {
            "Content-Type": "application/json",
            Authorization: "bearer " + jwt,
        },
    })
        .then((response) => response.json())
        .catch((error) =>
            console.log("Error creating Salesforce contact: " + error)
        )}

export async function ingestFile(files: Array<{id: string}>, jwt: string) {
    return await fetch(process.env.INGEST_DRIVE_FILE_ENDPOINT ?? "", {
        method: "POST",
        body: JSON.stringify({ files: files }),
        headers: {
            "Content-Type": "application/json",
            Authorization: "bearer " + jwt,
        },
    })
        .then((response) => response.json())
        .catch((error) =>
            console.log("Error triggering file ingestion"),
        );
}

export async function ingestPermission(files: Array<{id: string}>, jwt: string) {
    return await fetch(process.env.INGEST_DRIVE_PERMISSION_ENDPOINT ?? "", {
        method: "POST",
        body: JSON.stringify({ files: files }),
        headers: {
            "Content-Type": "application/json",
            Authorization: "bearer " + jwt,
        },
    })
        .then((response) => response.json())
        .catch((error) =>
            console.log("Error triggering permission ingestion"),
        );
}