"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@useparagon/core");
const googledrive_1 = require("@useparagon/integrations/googledrive");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'Permissions Tutorial - Check Permission';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, googledrive_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = '4dc09f1f-1efc-4b13-b042-1da4adba437f';
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
        const getPermissionStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Permission',
            method: 'GET',
            url: `files/${mapStep.output.instance}/permissions?fields=*`,
            params: { [`fields`]: `*` },
            headers: {},
        });
        const functionStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Check if user is allowed',
            code: function yourFunction(parameters, libraries) {
                const permissions = parameters.permissions;
                const fileId = parameters.fileId;
                let result = false;
                permissions.forEach((perm) => {
                    if (perm.emailAddress == parameters.userId) {
                        result = true;
                    }
                });
                return { fileId: fileId, permitted: result };
            },
            parameters: {
                permissions: getPermissionStep.output.response.body.permissions,
                userId: triggerStep.output.request.body.userId,
                fileId: mapStep.output.instance,
            },
        });
        const responseStep = new core_1.ResponseStep({
            description: 'Send Boolean Array',
            statusCode: 200,
            responseType: 'JSON',
            body: { permittedFiles: functionStep.output.result },
        });
        triggerStep
            .nextStep(mapStep.branch(getPermissionStep.nextStep(functionStep)))
            .nextStep(responseStep);
        return this.register({
            triggerStep,
            mapStep,
            getPermissionStep,
            functionStep,
            responseStep,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=permissionsTutorialCheckPermission.js.map