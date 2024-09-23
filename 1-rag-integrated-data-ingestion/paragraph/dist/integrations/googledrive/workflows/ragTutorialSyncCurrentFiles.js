"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@useparagon/core");
const Operators = tslib_1.__importStar(require("@useparagon/core/operator"));
const googledrive_1 = require("@useparagon/integrations/googledrive");
const inputs_1 = tslib_1.__importDefault(require("../inputs"));
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'RAG Tutorial - Sync current files';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, googledrive_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = '208e8df9-c2a1-4f56-9497-5d435e1c5e3f';
    }
    define(integration, context, connectUser) {
        const triggerStep = new core_1.IntegrationEnabledStep();
        const actionStep = integration.actions.googleDriveListFiles({
            includeFolders: false,
            parentId: `${context.getInput(inputs_1.default.folder_to_share)}`,
        }, {
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get files in shared folder',
        });
        const forEachFileStep = new core_1.FanOutStep({
            description: 'For each file',
            iterator: actionStep.output.result,
        });
        const ifelseStep = new core_1.ConditionalStep({
            if: Operators.Or(Operators.And(Operators.StringExactlyMatches(forEachFileStep.output.instance.mimeType, 'application/vnd.google-apps.document')), Operators.And(Operators.StringExactlyMatches(forEachFileStep.output.instance.mimeType, 'application/vnd.google-apps.presentation')), Operators.And(Operators.StringContains(forEachFileStep.output.instance.mimeType, 'application/vnd.google-apps'))),
            description: 'Check if Google Workspace File',
        });
        const ifelseStep1 = new core_1.ConditionalStep({
            if: Operators.StringExactlyMatches(forEachFileStep.output.instance.mimeType, 'application/vnd.google-apps.spreadsheet'),
            description: 'Check if spreadsheet',
        });
        const integrationRequestStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get text from google sheets',
            method: 'GET',
            url: `files/${forEachFileStep.output.instance.id}/export?mimeType=text/csv`,
            params: { [`mimeType`]: `text/csv` },
            headers: {},
        });
        const requestStep = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send text to backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/gdrive-upload`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: {
                text: `${integrationRequestStep.output.response.body}`,
                filename: `${forEachFileStep.output.instance.name}`,
                fileId: `${forEachFileStep.output.instance.id}`,
                source: `googledrive`,
            },
            bodyType: 'json',
        });
        const integrationRequestStep1 = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get text from google doc or slides',
            method: 'GET',
            url: `files/${forEachFileStep.output.instance.id}/export?mimeType=text/plain`,
            params: { [`mimeType`]: `text/plain` },
            headers: {},
        });
        const requestStep1 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send text to backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/gdrive-upload`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: {
                text: `${integrationRequestStep1.output.response.body}`,
                filename: `${forEachFileStep.output.instance.name}`,
                fileId: `${forEachFileStep.output.instance.id}`,
                source: '',
            },
            bodyType: 'json',
        });
        const integrationRequestStep2 = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get from non Google doc',
            method: 'GET',
            url: `files/${forEachFileStep.output.instance.id}?alt=media&supportsTeamDrives=true`,
            params: { [`alt`]: `media`, [`supportsTeamDrives`]: `true` },
            headers: {},
        });
        const functionStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Convert file data',
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
            description: 'Send base64 to backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/upload`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: {
                base64: `${functionStep.output.result}`,
                fileId: `${forEachFileStep.output.instance.id}`,
                filename: `${forEachFileStep.output.instance.name}`,
                source: `googledrive`,
            },
            bodyType: 'json',
        });
        triggerStep
            .nextStep(actionStep)
            .nextStep(forEachFileStep.branch(ifelseStep
            .whenTrue(ifelseStep1
            .whenTrue(integrationRequestStep.nextStep(requestStep))
            .whenFalse(integrationRequestStep1.nextStep(requestStep1)))
            .whenFalse(integrationRequestStep2
            .nextStep(functionStep)
            .nextStep(requestStep2))));
        return this.register({
            triggerStep,
            actionStep,
            forEachFileStep,
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
//# sourceMappingURL=ragTutorialSyncCurrentFiles.js.map