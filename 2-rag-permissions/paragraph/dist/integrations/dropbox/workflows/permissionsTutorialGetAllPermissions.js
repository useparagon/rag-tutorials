"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@useparagon/core");
const Operators = tslib_1.__importStar(require("@useparagon/core/operator"));
const dropbox_1 = require("@useparagon/integrations/dropbox");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'Permissions Tutorial - Get All Permissions';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, dropbox_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = '173bcfd0-ee45-472d-b194-75014b2d4a62';
    }
    define(integration, context, connectUser) {
        const triggerStep = new core_1.EndpointStep({
            allowArbitraryPayload: false,
            paramValidations: [
                {
                    key: 'folder',
                    required: false,
                },
            ],
            headerValidations: [],
            bodyValidations: [],
        });
        const getAllItemsStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get All Items',
            method: 'POST',
            url: `https://api.dropboxapi.com/2/files/list_folder`,
            params: { ['']: '' },
            headers: {},
            body: { path: `${triggerStep.output.request.params}` },
            bodyType: 'json',
        });
        const forEachItemStep = new core_1.FanOutStep({
            description: 'For Each Item',
            iterator: getAllItemsStep.output.response.body.entries,
        });
        const ifelseStep = new core_1.ConditionalStep({
            if: Operators.StringExactlyMatches(forEachItemStep.output.instance['.tag'], 'file'),
            description: 'Check if File vs Folder',
        });
        const integrationRequestStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Permissions',
            method: 'POST',
            url: `https://api.dropboxapi.com/2/sharing/list_file_members`,
            params: { [``]: `` },
            headers: {},
            body: { file: `${forEachItemStep.output.instance.id}` },
            bodyType: 'json',
        });
        const mapStep = new core_1.FanOutStep({
            description: 'For Each Permission',
            iterator: integrationRequestStep.output.response.body.users,
        });
        const functionStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Parse permission',
            code: function yourFunction(parameters, libraries) {
                const objectName = parameters.objectName;
                const objectId = parameters.objectId.split(':')[1];
                const objectType = parameters.objectType;
                const permissionType = parameters.permissions.access_type['.tag'];
                const permissionSubject = parameters.permissions.user.email;
                return {
                    object: {
                        objectName: objectName,
                        objectId: objectId,
                        objectType: objectType,
                    },
                    subject: {
                        relationshipType: permissionType,
                        subjectId: permissionSubject,
                        subjectType: 'user',
                    },
                };
            },
            parameters: {
                permissions: mapStep.output.instance,
                objectId: forEachItemStep.output.instance.id,
                objectName: forEachItemStep.output.instance.name,
                objectType: forEachItemStep.output.instance['.tag'],
            },
        });
        const requestStep = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: true,
            description: 'Send to Backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: { data: `${functionStep.output.result}`, source: `dropbox` },
            bodyType: 'json',
        });
        const functionStep1 = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Parse permission',
            code: function yourFunction(parameters, libraries) {
                const objectName = parameters.objectName;
                const objectId = parameters.objectId;
                const objectType = parameters.objectType;
                return {
                    object: {
                        objectName: objectName,
                        objectId: objectId,
                        objectType: objectType,
                    },
                    subject: {
                        subjectId: parameters.subject.folder,
                    },
                };
            },
            parameters: {
                subject: triggerStep.output.request.params,
                objectId: forEachItemStep.output.instance.id,
                objectName: forEachItemStep.output.instance.name,
                objectType: forEachItemStep.output.instance['.tag'],
            },
        });
        const requestStep1 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: true,
            description: 'Send to Backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: { data: `${functionStep.output.result}` },
            bodyType: 'json',
        });
        const integrationRequestStep1 = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: true,
            description: 'Get Permissions',
            method: 'POST',
            url: `https://api.dropboxapi.com/2/sharing/list_folder_members`,
            params: { [``]: `` },
            headers: {},
            body: { shared_folder_id: `${forEachItemStep.output.instance.id}` },
            bodyType: 'json',
        });
        const getEmailStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Email',
            method: 'POST',
            url: `https://api.dropboxapi.com/2/users/get_account`,
            params: { ['']: '' },
            headers: {},
            body: { account_id: `${connectUser.providerId}` },
            bodyType: 'json',
        });
        const signJwtStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Sign JWT',
            code: function yourFunction(parameters, libraries) {
                const { jsonwebtoken } = libraries;
                const userId = parameters.userId;
                const key = parameters.signingKey.replaceAll('\\n', '\n');
                const currentTime = Math.floor(Date.now() / 1000);
                return jsonwebtoken.sign({
                    sub: userId,
                    iat: currentTime,
                    exp: currentTime + 60 * 60,
                }, key, {
                    algorithm: 'RS256',
                });
            },
            parameters: {
                userId: getEmailStep.output.response.body.email,
                signingKey: context.getEnvironmentSecret('signingKey4'),
            },
        });
        const recurseFolderStep = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Recurse Folder',
            url: `https://zeus.useparagon.com/projects/ff6863bd-29d3-4f86-baee-26a061c059f0/sdk/triggers/173bcfd0-ee45-472d-b194-75014b2d4a62`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            authorization: {
                type: 'bearer',
                token: `${signJwtStep.output.result}`,
            },
            body: { folder: `${forEachItemStep.output.instance.path_display}` },
            bodyType: 'json',
        });
        triggerStep
            .nextStep(getAllItemsStep)
            .nextStep(forEachItemStep.branch(ifelseStep
            .whenTrue(integrationRequestStep.nextStep(mapStep.branch(functionStep
            .nextStep(requestStep)
            .nextStep(functionStep1)
            .nextStep(requestStep1))))
            .whenFalse(integrationRequestStep1
            .nextStep(getEmailStep)
            .nextStep(signJwtStep)
            .nextStep(recurseFolderStep))));
        return this.register({
            triggerStep,
            getAllItemsStep,
            forEachItemStep,
            ifelseStep,
            integrationRequestStep,
            mapStep,
            functionStep,
            requestStep,
            functionStep1,
            requestStep1,
            integrationRequestStep1,
            getEmailStep,
            signJwtStep,
            recurseFolderStep,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=permissionsTutorialGetAllPermissions.js.map