"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@useparagon/core");
const Operators = tslib_1.__importStar(require("@useparagon/core/operator"));
const slack_1 = require("@useparagon/integrations/slack");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'Paragon Tutorial - Initial Channel Sync';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, slack_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = '2af13f19-af7a-43d4-8610-0791ee442db2';
    }
    define(integration, context, connectUser) {
        const triggerStep = new core_1.IntegrationEnabledStep();
        const integrationRequestStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get All Channels',
            method: 'GET',
            url: `/conversations.list`,
            params: { ['']: '' },
            headers: {},
        });
        const mapStep = new core_1.FanOutStep({
            description: 'For each channel',
            iterator: integrationRequestStep.output.response.body.channels,
        });
        const integrationRequestStep1 = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Conversation History',
            method: 'GET',
            url: `/conversations.history?channel=${mapStep.output.instance.id}`,
            params: { [`channel`]: `${mapStep.output.instance.id}` },
            headers: {},
        });
        const functionStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Parse Message JSON',
            code: function yourFunction(params, libraries) {
                const messages = params.messages;
                if (!Array.isArray(messages) || params.error) {
                    return;
                }
                const parsedMessages = [];
                messages.forEach((message) => {
                    if (message.type === 'message' && !message.subtype) {
                        parsedMessages.push({
                            text: message.text,
                            channel: params.channel,
                        });
                    }
                });
                return parsedMessages;
            },
            parameters: {
                messages: integrationRequestStep1.output.response.body.messages,
                error: integrationRequestStep1.output.response.body.error,
                channel: mapStep.output.instance.name,
            },
        });
        const checkArrayStep = new core_1.ConditionalStep({
            if: Operators.IsNotNull(functionStep.output.result),
            description: 'Check Array',
        });
        const mapStep1 = new core_1.FanOutStep({
            description: 'For each message',
            iterator: functionStep.output.result,
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
                text: `${mapStep1.output.instance.text}`,
                channel: `${mapStep1.output.instance.channel}`,
            },
            bodyType: 'json',
        });
        triggerStep
            .nextStep(integrationRequestStep)
            .nextStep(mapStep.branch(integrationRequestStep1
            .nextStep(functionStep)
            .nextStep(checkArrayStep.whenTrue(mapStep1.branch(requestStep)))));
        return this.register({
            triggerStep,
            integrationRequestStep,
            mapStep,
            integrationRequestStep1,
            functionStep,
            checkArrayStep,
            mapStep1,
            requestStep,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=paragonTutorialInitialChannelSync.js.map