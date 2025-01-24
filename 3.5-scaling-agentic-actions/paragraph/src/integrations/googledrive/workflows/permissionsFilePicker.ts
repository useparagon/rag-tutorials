import {
  ConditionalStep,
  EndpointStep,
  FanOutStep,
  FunctionStep,
  IntegrationRequestStep,
  RequestStep,
  Workflow,
} from '@useparagon/core';
import { IContext } from '@useparagon/core/execution';
import * as Operators from '@useparagon/core/operator';
import { IPersona } from '@useparagon/core/persona';
import { ConditionalInput } from '@useparagon/core/steps/library/conditional';
import { IConnectUser, IPermissionContext } from '@useparagon/core/user';
import {
  createInputs,
  IGoogledriveIntegration,
  InputResultMap,
} from '@useparagon/integrations/googledrive';

import personaMeta from '../../../persona.meta';

/**
 * Permissions - File Picker Workflow implementation
 */
export default class extends Workflow<
  IGoogledriveIntegration,
  IPersona<typeof personaMeta>,
  InputResultMap
> {
  /**
   * Define workflow steps and orchestration.
   */
  define(
    integration: IGoogledriveIntegration,
    context: IContext<InputResultMap>,
    connectUser: IConnectUser<IPersona<typeof personaMeta>>,
  ) {
    const triggerStep = new EndpointStep({
      allowArbitraryPayload: false,
      paramValidations: [],
      headerValidations: [],
      bodyValidations: [
        {
          key: 'files',
          dataType: 'ARRAY',
          required: true,
        },
      ],
    });

    const forEachFileStep = new FanOutStep({
      description: 'For each file',
      iterator: triggerStep.output.request.body.files,
    });

    const getFileByIdStep = integration.actions.googleDriveGetFileById(
      { fileId: `${forEachFileStep.output.instance.id}` },
      {
        autoRetry: false,
        continueWorkflowOnError: false,
        description: 'Get file by id',
      },
    );

    const integrationRequestStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get all permissions',
      method: 'GET',
      url: `files/${forEachFileStep.output.instance.id}/permissions?fields=*`,
      params: { fields: '*' },
      headers: {},
    });

    const mapStep = new FanOutStep({
      description: 'For each permission',
      iterator: integrationRequestStep.output.response.body.permissions,
    });

    const ifelseStep = new ConditionalStep({
      if: Operators.StringExactlyMatches(
        forEachFileStep.output.instance.mimeType,
        'application/vnd.google-apps.folder',
      ),
      description: 'Check if file or folder',
    });

    const ifelseStep1 = new ConditionalStep({
      if: Operators.StringExactlyMatches(mapStep.output.instance.type, 'user'),
      description: 'Check if user or group',
    });

    const functionStep = new FunctionStep({
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

    const requestStep = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send "folder to user" to auth backend',
      url: `${context.getEnvironmentSecret('backendUrl')}/api/permissions`,
      method: 'POST',
      params: {},
      headers: {},
      body: { data: `${functionStep.output.result}`, type: 'permission' },
      bodyType: 'json',
    });

    const functionStep1 = new FunctionStep({
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

    const requestStep1 = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send to group workflow',
      url: `${context.getEnvironmentSecret('backendUrl')}/api/permissions`,
      method: 'POST',
      params: {},
      headers: {},
      body: { data: `${functionStep1.output.result}`, type: 'permission' },
      bodyType: 'json',
    });

    const ifelseStep2 = new ConditionalStep({
      if: Operators.StringExactlyMatches(mapStep.output.instance.type, 'user'),
      description: 'Check if user or group',
    });

    const fileToUserStep = new FunctionStep({
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

    const requestStep2 = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send "file to user" to auth backend',
      url: `${context.getEnvironmentSecret('backendUrl')}/api/permissions`,
      method: 'POST',
      params: {},
      headers: {},
      body: {
        data: `${fileToUserStep.output.result}`,
        source: 'googledrive',
        type: 'permission',
      },
      bodyType: 'json',
    });

    const fileToGroupStep = new FunctionStep({
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

    const requestStep3 = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send to group workflow',
      url: `${context.getEnvironmentSecret('backendUrl')}/api/permissions`,
      method: 'POST',
      params: {},
      headers: {},
      body: { data: `${fileToGroupStep.output.result}`, type: 'permission' },
      bodyType: 'json',
    });

    triggerStep.nextStep(
      forEachFileStep.branch(
        getFileByIdStep
          .nextStep(integrationRequestStep)
          .nextStep(
            mapStep.branch(
              ifelseStep
                .whenTrue(
                  ifelseStep1
                    .whenTrue(functionStep.nextStep(requestStep))
                    .whenFalse(functionStep1.nextStep(requestStep1)),
                )
                .whenFalse(
                  ifelseStep2
                    .whenTrue(fileToUserStep.nextStep(requestStep2))
                    .whenFalse(fileToGroupStep.nextStep(requestStep3)),
                ),
            ),
          ),
      ),
    );

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      forEachFileStep,
      getFileByIdStep,
      integrationRequestStep,
      mapStep,
      ifelseStep,
      ifelseStep1,
      functionStep,
      requestStep,
      functionStep1,
      requestStep1,
      ifelseStep2,
      fileToUserStep,
      requestStep2,
      fileToGroupStep,
      requestStep3,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Permissions - File Picker';

  /**
   * A user-facing description of the workflow shown in the Connect Portal.
   */
  description: string = 'Add a user-facing description of this workflow';

  /**
   * Define workflow-level User Settings. For integration-level User
   * Settings, see ../config.ts.
   * https://docs.useparagon.com/connect-portal/workflow-user-settings
   */
  inputs = createInputs({});

  /**
   * If set to true, the workflow will appear as enabled by default once
   * a user connects their account to the integration.
   * https://docs.useparagon.com/connect-portal/displaying-workflows#default-to-enabled
   */
  defaultEnabled: boolean = true;

  /**
   * If set to true, the workflow will be hidden from all users from the
   * Connect Portal.
   * https://docs.useparagon.com/connect-portal/displaying-workflows#hide-workflow-from-portal-for-all-users
   */
  hidden: boolean = false;

  /**
   * You can restrict the visibility of this workflow to specific users
   * with Workflow Permissions.
   * https://docs.useparagon.com/connect-portal/workflow-permissions
   */
  definePermissions(
    connectUser: IPermissionContext<IPersona<typeof personaMeta>>,
  ): ConditionalInput | undefined {
    return undefined;
  }

  /**
   * This property is maintained by Paragon. Do not edit this property.
   */
  readonly id: string = '4e380a7d-bec2-43a4-a69c-0cac23e66ef5';
}
