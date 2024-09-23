"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@useparagon/core");
const Operators = tslib_1.__importStar(require("@useparagon/core/operator"));
const googledrive_1 = require("@useparagon/integrations/googledrive");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'Permissions Tutorial - Get All Permissions';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, googledrive_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = 'dc5b98cd-9725-401c-b1d8-9c5536c5371d';
    }
    define(integration, context, connectUser) {
        const triggerStep = new core_1.EndpointStep({
            allowArbitraryPayload: false,
            paramValidations: [
                {
                    key: 'folder',
                    required: true,
                },
            ],
            headerValidations: [],
            bodyValidations: [],
        });
        const getAllFilesStep = integration.actions.googleDriveListFiles({
            includeFolders: true,
            parentId: `${triggerStep.output.request.params.folder}`,
            pageSize: '',
        }, {
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get all files',
        });
        const forEachFileStep = new core_1.FanOutStep({
            description: 'For each file',
            iterator: getAllFilesStep.output.result,
        });
        const integrationRequestStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get all permissions',
            method: 'GET',
            url: `files/${forEachFileStep.output.instance.id}/permissions?fields=*`,
            params: { [`fields`]: `*` },
            headers: {},
        });
        const mapStep = new core_1.FanOutStep({
            description: 'For each permission',
            iterator: integrationRequestStep.output.response.body.permissions,
        });
        const ifelseStep = new core_1.ConditionalStep({
            if: Operators.StringExactlyMatches(forEachFileStep.output.instance.mimeType, 'application/vnd.google-apps.folder'),
            description: 'Check if file or folder',
        });
        const ifelseStep1 = new core_1.ConditionalStep({
            if: Operators.StringExactlyMatches(mapStep.output.instance.type, 'user'),
            description: 'Check if user or group',
        });
        const functionStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'format folder data',
            code: function yourFunction(parameters, libraries) {
                const objectName = parameters.object.name;
                const objectId = parameters.object.id;
                const objectType = parameters.object.mimeType;
                const permissionType = parameters.permissions.role;
                const permissionSubject = parameters.permissions.emailAddress;
                const permissionSubjectType = parameters.permissions.type;
                return {
                    object: {
                        objectName: objectName,
                        objectId: objectId,
                        objectType: objectType,
                    },
                    subject: {
                        relationshipType: permissionType,
                        subjectId: permissionSubject,
                        subjectType: permissionSubjectType,
                    },
                };
            },
            parameters: {
                permissions: mapStep.output.instance,
                object: forEachFileStep.output.instance,
            },
        });
        const requestStep = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send "folder to user" to auth backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: { data: `${functionStep.output.result}`, type: `permission` },
            bodyType: 'json',
        });
        const functionStep1 = new core_1.FunctionStep({
            autoRetry: false,
            description: 'format folder data',
            code: function yourFunction(parameters, libraries) {
                const objectName = parameters.object.name;
                const objectId = parameters.object.id;
                const objectType = parameters.object.mimeType;
                const permissionType = parameters.permissions.role;
                const permissionSubject = parameters.permissions.emailAddress;
                const permissionSubjectType = parameters.permissions.type;
                return {
                    object: {
                        objectName: objectName,
                        objectId: objectId,
                        objectType: objectType,
                    },
                    subject: {
                        relationshipType: permissionType,
                        subjectId: permissionSubject,
                        subjectType: permissionSubjectType,
                    },
                };
            },
            parameters: {
                permissions: mapStep.output.instance,
                object: forEachFileStep.output.instance,
            },
        });
        const requestStep1 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send to group workflow',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: { data: `${functionStep1.output.result}`, type: `permission` },
            bodyType: 'json',
        });
        const signJwtStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'sign JWT',
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
                signingKey: context.getEnvironmentSecret('signingKey4'),
                userId: connectUser.userId,
            },
        });
        const requestStep2 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Recurse with subfolder',
            url: `https://zeus.useparagon.com/projects/ff6863bd-29d3-4f86-baee-26a061c059f0/sdk/triggers/dc5b98cd-9725-401c-b1d8-9c5536c5371d`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            authorization: {
                type: 'bearer',
                token: `${signJwtStep.output.result}`,
            },
            body: { folder: `${forEachFileStep.output.instance.id}` },
            bodyType: 'json',
        });
        const ifelseStep2 = new core_1.ConditionalStep({
            if: Operators.StringExactlyMatches(mapStep.output.instance.type, 'user'),
            description: 'Check if user or group',
        });
        const fileToUserStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'file to user',
            code: function yourFunction(parameters, libraries) {
                const objectName = parameters.object.name;
                const objectId = parameters.object.id;
                const objectType = parameters.object.mimeType;
                const permissionType = parameters.permissions.role;
                const permissionSubject = parameters.permissions.emailAddress;
                const permissionSubjectType = parameters.permissions.type;
                return {
                    object: {
                        objectName: objectName,
                        objectId: objectId,
                        objectType: objectType,
                    },
                    subject: {
                        relationshipType: permissionType,
                        subjectId: permissionSubject,
                        subjectType: permissionSubjectType,
                    },
                };
            },
            parameters: {
                permissions: mapStep.output.instance,
                object: forEachFileStep.output.instance,
            },
        });
        const requestStep3 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send "file to user" to auth backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: {
                data: `${fileToUserStep.output.result}`,
                source: `googledrive`,
                type: `permission`,
            },
            bodyType: 'json',
        });
        const fileToGroupStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'file to group',
            code: function yourFunction(parameters, libraries) {
                const objectName = parameters.object.name;
                const objectId = parameters.object.id;
                const objectType = parameters.object.mimeType;
                const permissionType = parameters.permissions.role;
                const permissionSubject = parameters.permissions.emailAddress;
                const permissionSubjectType = parameters.permissions.type;
                return {
                    object: {
                        objectName: objectName,
                        objectId: objectId,
                        objectType: objectType,
                    },
                    subject: {
                        relationshipType: permissionType,
                        subjectId: permissionSubject,
                        subjectType: permissionSubjectType,
                    },
                };
            },
            parameters: {
                permissions: mapStep.output.instance,
                object: forEachFileStep.output.instance,
            },
        });
        const requestStep4 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send to group workflow',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: { data: `${fileToGroupStep.output.result}`, type: `permission` },
            bodyType: 'json',
        });
        const folderToFileStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'folder to file',
            code: function yourFunction(parameters, libraries) {
                const objectName = parameters.object.name;
                const objectId = parameters.object.id;
                const objectType = parameters.object.mimeType;
                const subjectId = parameters.subject.folder;
                return {
                    subject: {
                        subjectId: subjectId,
                    },
                    object: {
                        objectName: objectName,
                        objectId: objectId,
                        objectType: objectType,
                    },
                };
            },
            parameters: {
                object: forEachFileStep.output.instance,
                subject: triggerStep.output.request.params,
            },
        });
        const requestStep5 = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send "folder to file"',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: { data: `${folderToFileStep.output.result}`, type: `parent` },
            bodyType: 'json',
        });
        triggerStep
            .nextStep(getAllFilesStep)
            .nextStep(forEachFileStep.branch(integrationRequestStep.nextStep(mapStep.branch(ifelseStep
            .whenTrue(ifelseStep1
            .whenTrue(functionStep.nextStep(requestStep))
            .whenFalse(functionStep1.nextStep(requestStep1))
            .nextStep(signJwtStep)
            .nextStep(requestStep2))
            .whenFalse(ifelseStep2
            .whenTrue(fileToUserStep.nextStep(requestStep3))
            .whenFalse(fileToGroupStep.nextStep(requestStep4))
            .nextStep(folderToFileStep)
            .nextStep(requestStep5))))));
        return this.register({
            triggerStep,
            getAllFilesStep,
            forEachFileStep,
            integrationRequestStep,
            mapStep,
            ifelseStep,
            ifelseStep1,
            functionStep,
            requestStep,
            functionStep1,
            requestStep1,
            signJwtStep,
            requestStep2,
            ifelseStep2,
            fileToUserStep,
            requestStep3,
            fileToGroupStep,
            requestStep4,
            folderToFileStep,
            requestStep5,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=permissionsTutorialGetAllPermissions.js.map