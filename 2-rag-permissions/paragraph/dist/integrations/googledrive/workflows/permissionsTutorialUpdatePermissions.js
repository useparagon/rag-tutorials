"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@useparagon/core");
const googledrive_1 = require("@useparagon/integrations/googledrive");
class default_1 extends core_1.Workflow {
    constructor() {
        super(...arguments);
        this.name = 'Permissions Tutorial - Update permissions';
        this.description = 'Add a user-facing description of this workflow';
        this.inputs = (0, googledrive_1.createInputs)({});
        this.defaultEnabled = false;
        this.hidden = false;
        this.id = '8847ed9b-8ae8-4384-b935-d663e499e7db';
    }
    define(integration, context, connectUser) {
        const triggerStep = integration.triggers.googleDriveTriggerFileUpdated({});
        const integrationRequestStep = new core_1.IntegrationRequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Get Permissions',
            method: 'GET',
            url: `files/${triggerStep.output.result.id}/permissions?fields=*`,
            params: { [`fields`]: `*` },
            headers: {},
        });
        const mapStep = new core_1.FanOutStep({
            description: 'For Each Permission',
            iterator: integrationRequestStep.output.response.body.permissions,
        });
        const functionStep = new core_1.FunctionStep({
            autoRetry: false,
            description: 'Parse File Permissions',
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
                object: triggerStep.output.result,
                permissions: mapStep.output.instance,
            },
        });
        const requestStep = new core_1.RequestStep({
            autoRetry: false,
            continueWorkflowOnError: false,
            description: 'Send update to backend',
            url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
            method: 'POST',
            params: { ['']: '' },
            headers: {},
            body: {
                data: `${functionStep.output.result}`,
                type: `update`,
                source: `googledrive`,
            },
            bodyType: 'json',
        });
        triggerStep
            .nextStep(integrationRequestStep)
            .nextStep(mapStep.branch(functionStep))
            .nextStep(requestStep);
        return this.register({
            triggerStep,
            integrationRequestStep,
            mapStep,
            functionStep,
            requestStep,
        });
    }
    definePermissions(connectUser) {
        return undefined;
    }
}
exports.default = default_1;
//# sourceMappingURL=permissionsTutorialUpdatePermissions.js.map