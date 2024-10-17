"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@useparagon/core");
const Operators = tslib_1.__importStar(require("@useparagon/core/operator"));
const slack_1 = require("@useparagon/integrations/slack");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'Paragon Tutorial - New Message Sync';
        this.description = 'Allow RAG application to parse through messages in the Q&A channel';
        this.inputs = (0, slack_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = '9fda5b17-67d6-4d59-bd73-d3e51809a45a';
    }
    define(integration, context, connectUser) {
        const triggerStep = integration.triggers.channelMessagePosted({});
        const parseMessageStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Parse Message',
            code: function yourFunction(params, libraries) {
                const message = params.message;
                if (params.error) {
                    return;
                }
                else if (message.type === 'message' && !message.subtype) {
                    return { text: message.text, channel: message.channel };
                }
                else {
                    return;
                }
            },
            parameters: { message: triggerStep.output.result },
        });
        const ifelseStep = new core_1.ConditionalStep({
            if: Operators.IsNotNull(parseMessageStep.output.result),
            description: "Message isn't empty?",
        });
        const requestStep = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send to Backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/slack-upload`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: {
                text: `${parseMessageStep.output.result.text}`,
                channel: `${parseMessageStep.output.result.channel}`,
            },
            bodyType: 'json',
        });
        triggerStep
            .nextStep(parseMessageStep)
            .nextStep(ifelseStep.whenTrue(requestStep));
        return this.register({
            triggerStep,
            parseMessageStep,
            ifelseStep,
            requestStep,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=paragonTutorialNewMessageSync.js.map