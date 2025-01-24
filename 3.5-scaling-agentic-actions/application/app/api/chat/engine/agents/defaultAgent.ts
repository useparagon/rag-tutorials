import { FunctionTool, OpenAIAgent } from "llamaindex";
import {
    sendSlack,
    signJwt
} from "@/app/utility/request-utilities";
import { queryAstraDb } from "@/app/utility/astradb-utilities";
import { Collection } from "@datastax/astra-db-ts";

export async function createAgent(userId: string | (() => string), collection: Collection, documentIds?: string[], params?: any, tools?: any, jwt?: string): Promise<OpenAIAgent> {

    type MapSchemaTypes = {
        string: string;
        integer: number;
        boolean: boolean;
        // others?
    }

    type MapSchema<T extends Record<string, keyof MapSchemaTypes>> = {
        -readonly [K in keyof T]: MapSchemaTypes[T[K]]
    }


    const getParameters = (actions: any, actionName: string) => {
        const toolParameters = {};
        for (const parameterName of Object.keys(actions[actionName].function.parameters.properties)) {
            //@ts-ignore
            toolParameters[parameterName] = actions[actionName].function.parameters.properties[parameterName].type
        }
        return toolParameters;
    }

    const createActionKitTools = (actions: any) => {
        const toolList = [];
        for (const actionName of Object.keys(actions)) {
            const toolParameters = getParameters(actions, actionName);
            type parameterType = MapSchema<typeof toolParameters>;

            const createdTool = FunctionTool.from(
                async (parameters: parameterType) => {
                    const response = await fetch("https://actionkit.useparagon.com/projects/" + process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID + "/actions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + jwt },
                        body: JSON.stringify({ action: actionName, parameters: parameters })
                    });
                    const body = await response.json();
                    console.log(parameters);
                    console.log(body);
                    return body;
                },
                actions[actionName].function
            );
            toolList.push(createdTool);
        }
        return toolList;
    }

    const checkForConfirmation = FunctionTool.from(
        async ({ confirmation }: { confirmation: string }) => {
            console.log("Confirmed: " + confirmation);
            return "Confirmation received";
        },
        {
            name: "checkForConfirmation",
            description: `Use this function whenever a DELETE function call is performed. Ask user if they are sure and only perform 
                subsequent delete operation if the confirmation is affirmative`,
            parameters: {
                type: "object",
                properties: {
                    confirmation: {
                        type: "string",
                        description: "affirmative confirmation to delete",
                    }
                },
                required: ["confirmation"],
            },
        }
    );

    const chainEmailWithSlack = FunctionTool.from(
        async ({ email, message }: { email: string, message: string }) => {
            const parameters = {
                toRecipients: email,
                from: 'jack.mu@useparagon.com',
                subject: 'Slack Message from ' + email,
                messageContent: '<p>' + message + '</p>'
            };
            const response = await fetch("https://actionkit.useparagon.com/projects/" + process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID + "/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + jwt },
                body: JSON.stringify({ action: 'GMAIL_SEND_EMAIL', parameters: parameters })
            });
            const body = await response.json();
            console.log(parameters);
            console.log(body);
            return body;
        },
        {
            name: "chainEmailWithSlack",
            description: `Whenever an email is sent via the "SLACK_SEND_DIRECT_MESSAGE" function tool, use this tool to send an email as well`,
            parameters: {
                type: "object",
                properties: {
                    email: {
                        type: "string",
                        description: "email address that an email was sent to",
                    },
                    message: {
                        type: "string",
                        description: "the contents of the Slack message",
                    }

                },
                required: ["email", "message"],
            },
        }
    );

    const chainGetNotionPageContentWithSearch = FunctionTool.from(
        async ({ pageId }: { pageId: string }) => {
            const parameters = {
                blockId: pageId,
            };
            const response = await fetch("https://actionkit.useparagon.com/projects/" + process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID + "/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + jwt },
                body: JSON.stringify({ action: 'NOTION_GET_PAGE_CONTENT', parameters: parameters })
            });
            const body = await response.json();
            console.log(parameters);
            console.log(body);
            return body;
        },
        {
            name: "chainGetNotionPageContentWithSearch",
            description: `Whenever the "NOTION_SEARCH_PAGES" tool is used, use this function to get the page contents`,
            parameters: {
                type: "object",
                properties: {
                    pageId: {
                        type: "string",
                        description: "the ID of the page returned from the NOTION_SEARCH_PAGES tool",
                    },
                },
                required: ["pageId"],
            },
        }
    );



    const astraDbQueryTool = FunctionTool.from(
        async ({ question }: { question: string }) => {
            const res = [];
            console.log("querying for question: " + question);
            const docs = new Set(documentIds);

            const nodes = await queryAstraDb(question, collection);
            for (const node of nodes) {
                if (docs.has(node.fileId) || (node.asset && docs.has(node.asset))) {
                    res.push(node);
                }
            }
            console.log(res);
            if (res) {
                return res;
            }
            return "no context found from astra db";
        },
        {
            name: "astraDbQueryTool",
            description: "Use this function with every user prompt",
            parameters: {
                type: "object",
                properties: {
                    question: {
                        type: "string",
                        description: "question about Paragon"
                    },
                },
                required: ["question"],
            },
        }
    );


    let functionTools = createActionKitTools(tools);
    //@ts-ignore
    functionTools = functionTools.concat([checkForConfirmation, astraDbQueryTool, chainGetNotionPageContentWithSearch, chainEmailWithSlack]);

    return new OpenAIAgent({
        tools: functionTools
    });
}
