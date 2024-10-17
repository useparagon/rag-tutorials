"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@useparagon/core");
const notion_1 = require("@useparagon/integrations/notion");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'Paragon Tutorial - Send Notion Contents to API';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, notion_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = '9dacef6a-082f-4583-8baf-33e42f24a0d4';
    }
    define(integration, context, connectUser) {
        const triggerStep = integration.triggers.pageUpdated({});
        const actionStep = integration.actions.getPageContent({ blockId: `${triggerStep.output.result.id}` }, {
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Page Contents',
        });
        const parseContentsStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Parse Contents',
            code: function parseNotionPage(parameters) {
                if (!Array.isArray(parameters.blocks)) {
                    console.error('Invalid notion data provided. Expected an array.');
                    return [];
                }
                const parsedContent = [];
                parameters.blocks.forEach((block) => {
                    const blockType = block.type;
                    if (blockType === 'heading_3') {
                        const headingContent = block.heading_3.rich_text[0].plain_text;
                        parsedContent.push(`<h3>${headingContent}</h3>`);
                    }
                    else if (blockType === 'paragraph') {
                        const paragraphContent = block.paragraph.rich_text
                            .map((text) => text.plain_text)
                            .join(' ');
                        parsedContent.push(`<p>${paragraphContent}</p>`);
                    }
                    else if (blockType === 'child_page') {
                        const childPageTitle = block.child_page.title;
                        parsedContent.push(`<h2>${childPageTitle}</h2>`);
                    }
                });
                return { text: parsedContent.join('\n'), url: parameters.url };
            },
            parameters: {
                blocks: actionStep.output.result,
                url: triggerStep.output.result.url,
            },
        });
        const requestStep = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send to Backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/notion-upload`,
            method: 'POST',
            params: { [``]: `` },
            headers: {},
            body: {
                text: `${parseContentsStep.output.result.text}`,
                url: `${parseContentsStep.output.result.url}`,
            },
            bodyType: 'json',
        });
        triggerStep
            .nextStep(actionStep)
            .nextStep(parseContentsStep)
            .nextStep(requestStep);
        return this.register({
            triggerStep,
            actionStep,
            parseContentsStep,
            requestStep,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=paragonTutorialSendNotionContentsToApi.js.map