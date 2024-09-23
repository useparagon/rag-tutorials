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
 * Permissions Tutorial - Get All Permissions Workflow implementation
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
      paramValidations: [
        {
          key: 'folder',
          required: true,
        },
      ],
      headerValidations: [],
      bodyValidations: [],
    });

    const getAllFilesStep = integration.actions.googleDriveListFiles(
      {
        includeFolders: true,
        parentId: `${triggerStep.output.request.params.folder}`,
        pageSize: '',
      },
      {
        autoRetry: false,
        continueWorkflowOnError: false,
        description: 'Get all files',
      },
    );

    const forEachFileStep = new FanOutStep({
      description: 'For each file',
      iterator: getAllFilesStep.output.result,
    });

    const integrationRequestStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get all permissions',
      method: 'GET',
      url: `files/${forEachFileStep.output.instance.id}/permissions?fields=*`,
      params: { [`fields`]: `*` },
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
      url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
      method: 'POST',
      params: { ['']: '' },
      headers: {},
      body: { data: `${functionStep.output.result}`, type: `permission` },
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
      url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
      method: 'POST',
      params: { ['']: '' },
      headers: {},
      body: { data: `${functionStep1.output.result}`, type: `permission` },
      bodyType: 'json',
    });

    const signJwtStep = new FunctionStep({
      autoRetry: false,
      description: 'sign JWT',
      code: function yourFunction(parameters, libraries) {
        // Import the jsonwebtoken library
        const { jsonwebtoken } = libraries;

        // Your Connected User's ID, taken from settings.userId
        const userId = parameters.userId;

        // Your Paragon Signing Key
        const key = parameters.signingKey.replaceAll('\\n', '\n');

        // Generate current timestamp
        const currentTime = Math.floor(Date.now() / 1000);

        // Generate your Paragon User Token
        return jsonwebtoken.sign(
          {
            sub: userId,
            iat: currentTime,
            exp: currentTime + 60 * 60, // 1 hour from now
          },
          key,
          {
            algorithm: 'RS256',
          },
        );
      },
      parameters: {
        signingKey: context.getEnvironmentSecret('signingKey4'),
        userId: connectUser.userId,
      },
    });

    const requestStep2 = new RequestStep({
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

    const requestStep3 = new RequestStep({
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

    const requestStep4 = new RequestStep({
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

    const folderToFileStep = new FunctionStep({
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

    const requestStep5 = new RequestStep({
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
      .nextStep(
        forEachFileStep.branch(
          integrationRequestStep.nextStep(
            mapStep.branch(
              ifelseStep
                .whenTrue(
                  ifelseStep1
                    .whenTrue(functionStep.nextStep(requestStep))
                    .whenFalse(functionStep1.nextStep(requestStep1))
                    .nextStep(signJwtStep)
                    .nextStep(requestStep2),
                )
                .whenFalse(
                  ifelseStep2
                    .whenTrue(fileToUserStep.nextStep(requestStep3))
                    .whenFalse(fileToGroupStep.nextStep(requestStep4))
                    .nextStep(folderToFileStep)
                    .nextStep(requestStep5),
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

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Permissions Tutorial - Get All Permissions';

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
  defaultEnabled: boolean = false;

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
  readonly id: string = 'dc5b98cd-9725-401c-b1d8-9c5536c5371d';
}
