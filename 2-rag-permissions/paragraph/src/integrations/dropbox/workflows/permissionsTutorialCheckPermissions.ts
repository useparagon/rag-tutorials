import {
  EndpointStep,
  FanOutStep,
  FunctionStep,
  IntegrationRequestStep,
  ResponseStep,
  Workflow,
} from '@useparagon/core';
import { IContext } from '@useparagon/core/execution';
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
 * Permissions Tutorial - Check Permissions Workflow implementation
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

    const mapStep = new FanOutStep({
      description: 'description',
      iterator: triggerStep.output.request.body.fileArr,
    });

    const functionStep = new FunctionStep({
      autoRetry: false,
      description: 'Add File Formatting',
      code: function yourFunction(parameters, libraries) {
        return 'id:' + parameters.id;
      },
      parameters: { id: mapStep.output.instance },
    });

    const integrationRequestStep = new IntegrationRequestStep({
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

    const functionStep1 = new FunctionStep({
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

    const responseStep = new ResponseStep({
      description: 'Send Permitted Array',
      statusCode: 200,
      responseType: 'JSON',
      body: { permittedFiles: functionStep1.output.result },
    });

    triggerStep
      .nextStep(
        mapStep.branch(
          functionStep.nextStep(integrationRequestStep).nextStep(functionStep1),
        ),
      )
      .nextStep(responseStep);

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      mapStep,
      functionStep,
      integrationRequestStep,
      functionStep1,
      responseStep,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Permissions Tutorial - Check Permissions';

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
  readonly id: string = 'c5492a43-f63b-44f8-b32b-784649b8c009';
}
