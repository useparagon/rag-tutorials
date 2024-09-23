"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@useparagon/core");
const Operators = tslib_1.__importStar(require("@useparagon/core/operator"));
const googledrive_1 = require("@useparagon/integrations/googledrive");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'RAG Tutorial - Sync New Files';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, googledrive_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = 'e9a7bbd5-b0a8-4ea3-9ba0-d56e62805a97';
    }
    define(integration, context, connectUser) {
        const triggerStep = integration.triggers.googleDriveTriggerFileCreated({});
        const ifelseStep = new core_1.ConditionalStep({
            if: Operators.Or(Operators.And(Operators.StringExactlyMatches(triggerStep.output.result.mimeType, 'application/vnd.google-apps.document')), Operators.And(Operators.StringExactlyMatches(triggerStep.output.result.mimeType, 'application/vnd.google-apps.presentation')), Operators.And(Operators.StringExactlyMatches(triggerStep.output.result.mimeType, 'application/vnd.google-apps.spreadsheet'))),
            description: 'Check if Google Workspace File',
        });
        const ifelseStep1 = new core_1.ConditionalStep({
            if: Operators.StringExactlyMatches(triggerStep.output.result.mimeType, 'application/vnd.google-apps.spreadsheet'),
            description: 'Check if spreadsheet',
        });
        const integrationRequestStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Google Sheets',
            method: 'GET',
            url: `files/${triggerStep.output.result.id}/export?mimeType=text/csv`,
            params: { [`mimeType`]: `text/csv` },
            headers: {},
        });
        const requestStep = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send contents to backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/gdrive-upload`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: {
                text: `${integrationRequestStep.output.response.body}`,
                filename: `${triggerStep.output.result.name}`,
            },
            bodyType: 'json',
        });
        const integrationRequestStep1 = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Google Doc or Slides',
            method: 'GET',
            url: `files/${triggerStep.output.result.id}/export?mimeType=text/plain`,
            params: { [`mimeType`]: `text/plain` },
            headers: {},
        });
        const requestStep1 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send contents to backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/gdrive-upload`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: {
                text: `${integrationRequestStep1.output.response.body}`,
                filename: `${triggerStep.output.result.name}`,
            },
            bodyType: 'json',
        });
        const integrationRequestStep2 = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Non-Google Native File',
            method: 'GET',
            url: `files/${triggerStep.output.result.id}?alt=media`,
            params: { [`alt`]: `media` },
            headers: {},
        });
        const functionStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Convert to base64 format',
            code: function yourFunction(param, libraries) {
                var buffer = libraries.Buffer;
                const fileData = param.file.data;
                const fileType = param.file.mimeType;
                return ('data:' + fileType + ';base64,' + buffer.from(fileData, 'hex').toString('base64'));
            },
            parameters: { file: integrationRequestStep2.output.response.body },
        });
        const requestStep2 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send contents to upload file backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/upload`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: { base64: `${functionStep.output.result}` },
            bodyType: 'json',
        });
        triggerStep.nextStep(ifelseStep
            .whenTrue(ifelseStep1
            .whenTrue(integrationRequestStep.nextStep(requestStep))
            .whenFalse(integrationRequestStep1.nextStep(requestStep1)))
            .whenFalse(integrationRequestStep2.nextStep(functionStep).nextStep(requestStep2)));
        return this.register({
            triggerStep,
            ifelseStep,
            ifelseStep1,
            integrationRequestStep,
            requestStep,
            integrationRequestStep1,
            requestStep1,
            integrationRequestStep2,
            functionStep,
            requestStep2,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=ragTutorialSyncNewFiles.js.map