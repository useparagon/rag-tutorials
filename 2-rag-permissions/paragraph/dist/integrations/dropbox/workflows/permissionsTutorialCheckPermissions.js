"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@useparagon/core");
const dropbox_1 = require("@useparagon/integrations/dropbox");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'Permissions Tutorial - Check Permissions';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, dropbox_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = 'c5492a43-f63b-44f8-b32b-784649b8c009';
    }
    define(integration, context, connectUser) {
        const triggerStep = new core_1.EndpointStep({
            allowArbitraryPayload: false,
            paramValidations: [],
            headerValidations: [],
            bodyValidations: [
                {
                    key: 'fileArr',
                    dataType: 'ARRAY',
                    required: true,
                },
                {
                    key: 'userId',
                    dataType: 'STRING',
                    required: true,
                },
            ],
        });
        const mapStep = new core_1.FanOutStep({
            description: 'description',
            iterator: triggerStep.output.request.body.fileArr,
        });
        const functionStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Add File Formatting',
            code: function yourFunction(parameters, libraries) {
                return 'id:' + parameters.id;
            },
            parameters: { id: mapStep.output.instance },
        });
        const integrationRequestStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Permissions',
            method: 'POST',
            url: `https://api.dropboxapi.com/2/sharing/list_file_members`,
            params: { ['']: '' },
            headers: {},
            body: { file: `${functionStep.output.result}` },
            bodyType: 'json',
        });
        const functionStep1 = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Check if user is allowed',
            code: function yourFunction(parameters, libraries) {
                let result = false;
                parameters.permissions.forEach((elem) => {
                    if (elem.user.email === parameters.userId) {
                        result = true;
                    }
                });
                return { fileId: parameters.fileId, permitted: result };
            },
            parameters: {
                permissions: integrationRequestStep.output.response.body.users,
                fileId: mapStep.output.instance,
                userId: triggerStep.output.request.body.userId,
            },
        });
        const responseStep = new core_1.ResponseStep({
            description: 'Send Permitted Array',
            statusCode: 200,
            responseType: 'JSON',
            body: { permittedFiles: functionStep1.output.result },
        });
        triggerStep
            .nextStep(mapStep.branch(functionStep.nextStep(integrationRequestStep).nextStep(functionStep1)))
            .nextStep(responseStep);
        return this.register({
            triggerStep,
            mapStep,
            functionStep,
            integrationRequestStep,
            functionStep1,
            responseStep,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=permissionsTutorialCheckPermissions.js.map