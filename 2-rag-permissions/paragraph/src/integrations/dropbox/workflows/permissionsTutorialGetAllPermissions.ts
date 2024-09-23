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
  IDropboxIntegration,
  InputResultMap,
} from '@useparagon/integrations/dropbox';

import personaMeta from '../../../persona.meta';

/**
 * Permissions Tutorial - Get All Permissions Workflow implementation
 */
export default class extends Workflow<
  IDropboxIntegration,
  IPersona<typeof personaMeta>,
  InputResultMap
> {
  /**
   * Define workflow steps and orchestration.
   */
  define(
    integration: IDropboxIntegration,
    context: IContext<InputResultMap>,
    connectUser: IConnectUser<IPersona<typeof personaMeta>>,
  ) {
    const triggerStep = new EndpointStep({
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

    const getAllItemsStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get All Items',
      method: 'POST',
      url: `https://api.dropboxapi.com/2/files/list_folder`,
      params: { ['']: '' },
      headers: {},
      body: { path: `${triggerStep.output.request.params.folder}` },
      bodyType: 'json',
    });

    const forEachItemStep = new FanOutStep({
      description: 'For Each Item',
      iterator: getAllItemsStep.output.response.body.entries,
    });

    const ifelseStep = new ConditionalStep({
      if: Operators.StringExactlyMatches(
        forEachItemStep.output.instance['.tag'],
        'file',
      ),
      description: 'Check if File vs Folder',
    });

    const integrationRequestStep = new IntegrationRequestStep({
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

    const mapStep = new FanOutStep({
      description: 'For Each Permission',
      iterator: integrationRequestStep.output.response.body.users,
    });

    const functionStep = new FunctionStep({
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

    const requestStep = new RequestStep({
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

    const functionStep1 = new FunctionStep({
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

    const requestStep1 = new RequestStep({
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

    const integrationRequestStep1 = new IntegrationRequestStep({
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

    const getEmailStep = new IntegrationRequestStep({
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

    const signJwtStep = new FunctionStep({
      autoRetry: false,
      description: 'Sign JWT',
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
        userId: getEmailStep.output.response.body.email,
        signingKey: context.getEnvironmentSecret('signingKey4'),
      },
    });

    const recurseFolderStep = new RequestStep({
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
      .nextStep(
        forEachItemStep.branch(
          ifelseStep
            .whenTrue(
              integrationRequestStep.nextStep(
                mapStep.branch(
                  functionStep
                    .nextStep(requestStep)
                    .nextStep(functionStep1)
                    .nextStep(requestStep1),
                ),
              ),
            )
            .whenFalse(
              integrationRequestStep1
                .nextStep(getEmailStep)
                .nextStep(signJwtStep)
                .nextStep(recurseFolderStep),
            ),
        ),
      );

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
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
  readonly id: string = '173bcfd0-ee45-472d-b194-75014b2d4a62';
}
