import {CredentialsMethod, OpenFgaClient} from "@openfga/sdk";
import jwt from "jsonwebtoken";

export function getFga(): OpenFgaClient{
    return new OpenFgaClient({
        apiUrl: process.env.FGA_API_URL,
        storeId: process.env.FGA_STORE_ID,
        authorizationModelId: process.env.FGA_MODEL_ID,
        credentials: {
            method: CredentialsMethod.ClientCredentials,
            config: {
                apiTokenIssuer: process.env.FGA_API_TOKEN_ISSUER ?? "",
                apiAudience: process.env.FGA_API_AUDIENCE ?? "",
                clientId: process.env.FGA_CLIENT_ID ?? "",
                clientSecret: process.env.FGA_CLIENT_SECRET ?? "",
            },
        }
    });
}

export async function writePermissions(fga: OpenFgaClient, data: any, source: string){
    const object = data.object;
    const subject = data.subject;

    if(object.objectType === "application/vnd.google-apps.folder" || object.objectType === "folder"){
        object.objectType = "folder";
        object.objectName = object.objectId;
    } else{
        object.objectType = "doc";
    }

    if(subject.subjectType === "group"){
        subject.subjectType = "group";
    } else{
        subject.subjectType = "user";
    }

    if(subject.relationshipType === "editor"){
        subject.relationshipType = "writer";
    }else if(subject.relationshipType === "viewer"){
        subject.relationshipType = "reader";
    }


    await fga.write({
        writes: [
            {
                "user": subject.subjectType + ":" + subject.subjectId,
                "relation":subject.relationshipType,
                "object": object.objectType + ":" + object.objectId
            }
        ],
    }, {
        authorizationModelId: process.env.FGA_MODEL_ID
    });

    if(object.objectType === "doc"){
        await writeIntegrationRelationship(fga, source, object.objectId);
    }
}

export async function writeIntegrationRelationship(fga: OpenFgaClient, source: string, docId: string){
    await fga.write({
        writes: [
            {
                "user": "integration" + ":" + source,
                "relation":"parent",
                "object": "doc" + ":" + docId,
            }
        ],
    }, {
        authorizationModelId: process.env.FGA_MODEL_ID
    });
}

export async function writeFileRelationship(fga: OpenFgaClient, data: any){
    const object = data.object;
    const subject = data.subject;

    await fga.write({
        writes: [
            {
                "user": "folder" + ":" + subject.subjectId,
                "relation":"parent",
                "object": "doc:" + object.objectId
            }
        ],
    }, {
        authorizationModelId: process.env.FGA_MODEL_ID
    });
}

async function deletePermissions(fga: OpenFgaClient, user: string, role: string, docId: string) {
    let objectType = "doc";
    let subjectType = "user";

    await fga.write({
        deletes: [
            {
                "user": subjectType + ":" + user,
                "relation": role,
                "object": objectType + ":" + docId
            }
        ],
    }, {
        authorizationModelId: process.env.FGA_MODEL_ID
    });
}

export async function updatePermissions(fga: OpenFgaClient, data: any, source: string){
    const roles = ["owner", "writer", "reader"];
    const docId = data[0].object.objectId;

    for(const role of roles) {
        let curUsers = await getPermittedUsers(fga, docId, role);
        let updatedUserPermissions = getUsersOfType(data, role);

        console.log("current " + role);
        console.log(curUsers);
        console.log("updated " + role);
        console.log(updatedUserPermissions);

        const newUsers = Array.from(new Set(updatedUserPermissions.keys()).difference(curUsers));
        const revokedUsers = Array.from(curUsers.difference(new Set(updatedUserPermissions.keys())));

        for(const user of newUsers){
            try {
                await writePermissions(fga, updatedUserPermissions.get(user), source);
            }catch(err){
                console.log("Unable to update permission" + err);
            }
        }
        for(const user of revokedUsers){
            try{
                if(user){
                    await deletePermissions(fga, user, role, docId);
                }
            }catch(err){
                console.log("Unable to update permission" + err);
            }
        }
    }
}

function getUsersOfType(data: any, type: string): Map<string, any>{
    const resMap = new Map();

    data.forEach((elem: any) => {
        let subject = elem.permission;

        if(subject.permissionType === type){
            resMap.set(subject.permissionSubject, elem);
        }
    });
    return resMap;
}

async function getPermittedUsers(fga: OpenFgaClient, fileId: string, relationship: string): Promise<Set<string | undefined>>{
    const response = await fga.listUsers({
        object: {
            type: "doc",
            id: fileId,
        },
        user_filters: [{
            type: "user"
        }],
        relation: relationship,
    }, {
        authorizationModelId: process.env.FGA_MODEL_ID
    });
    const resSet = new Set<string>;
    response.users.forEach((obj) => resSet.add(obj.object?.id ?? ""));
    return resSet;
}


export async function getPermittedDocuments(userId: string | undefined | (() => string) = undefined): Promise<Array<string>>{
    if(userId === undefined){
        return [];
    }

    const fga = getFga();
    const roles = ["owner", "writer", "reader"];
    let allFiles: Array<string> = []

    for(const role of roles){
        const response = await fga.listObjects({
            user: "user:" + userId,
            relation: role,
            type: "doc",
        }, {
            authorizationModelId: process.env.FGA_MODEL_ID,
        });

        allFiles = allFiles.concat(response.objects.map((document: string) => {
            return document.split(":")[1]
        }));
    }
    return allFiles;
}

export async function checkThirdPartyPermissions(documentIds: Array<string>, userId: string | undefined | (() => string) = undefined): Promise<Array<string>>{
    if(userId === undefined){
        return [];
    }

    const token = signJwt(userId);
    const integrations = ["googledrive", "dropbox"];
    let verifiedIds: Array<string> = []

    for(const integration of integrations){
        try {
            let verUrl = "";
            if (integration === "googledrive") {
                verUrl = process.env.GOOGLE_DRIVE_VERIFICATION ?? "";
            } else if (integration === "dropbox") {
                verUrl = process.env.DROPBOX_VERIFICATION ?? "";
            }
            if (verUrl) {
                let verified = await checkSpecificThirdParty(documentIds, userId, token, integration, verUrl);
                verifiedIds = verifiedIds.concat(verified);
            }
        }catch(err){
            console.log("Unable to verify " + integration + " : " + err);
        }
    }
    return verifiedIds;
}

function signJwt(userId: string | undefined | (() => string)): string {
    const currentTime = Math.floor(Date.now() / 1000);

    return jwt.sign(
        {
            sub: userId,
            iat: currentTime,
            exp: currentTime + (60 * 60), // 1 hour from now
        },
        process.env.SIGNING_KEY?.replaceAll("\\n", "\n") ?? "",
        {
            algorithm: "RS256",
        }
    )
}

async function getIntegration(docId: string): Promise<string>{
    const integrations = ["googledrive", "dropbox"];
    const fga = getFga();

    for(const integr of integrations){
        const { allowed } = await fga.check({
            user: 'integration:' + integr,
            relation: 'parent',
            object: 'doc:' + docId,
        }, {
            authorizationModelId: process.env.FGA_MODEL_ID,
        });

        if(allowed){
            return integr;
        }
    }
    return "No Integration Linked";
}

async function checkSpecificThirdParty(documentIds: Array<string>,
                                       userId: string | undefined | (() => string) = undefined,
                                       jwt: string,
                                       integration: string,
                                       verificationUrl: string): Promise<Array<string>>{
    const docsOfIntegration = await getDocumentsOfIntegration(documentIds, integration);

    const response = await fetch(verificationUrl, {
        method: "POST",
        body: JSON.stringify({userId: userId, fileArr: docsOfIntegration}),
        headers: {
            "Content-Type": "application/json",
            "Authorization": "bearer " + jwt,
        },
    })
        .then((response) => response.json())
        .catch((error) => console.log("Error checking with " + integration + ": " + error));

    return await response.permittedFiles.map((permittedFile: {fileId: string, permitted: boolean}) => {
        if(permittedFile.permitted){
            return permittedFile.fileId;
        }
    });
}

async function getDocumentsOfIntegration(documentIds: Array<string>, integration: string): Promise<Array<string>>{
    const docsOfIntegration = []
    for(const id of documentIds){
        let integr = await getIntegration(id);
        if(integr == integration){
            docsOfIntegration.push(id);
        }
    }
    return docsOfIntegration
}

