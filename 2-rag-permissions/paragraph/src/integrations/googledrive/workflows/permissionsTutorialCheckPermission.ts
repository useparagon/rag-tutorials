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
  IGoogledriveIntegration,
  InputResultMap,
} from '@useparagon/integrations/googledrive';

import personaMeta from '../../../persona.meta';

/**
 * Permissions Tutorial - Check Permission Workflow implementation
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

    const getPermissionStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get Permission',
      method: 'GET',
      url: `files/${mapStep.output.instance}/permissions?fields=*`,
      params: { [`fields`]: `*` },
      headers: {},
    });

    const functionStep = new FunctionStep({
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

    const responseStep = new ResponseStep({
      description: 'Send Boolean Array',
      statusCode: 200,
      responseType: 'JSON',
      body: { permittedFiles: functionStep.output.result },
    });

    triggerStep
      .nextStep(mapStep.branch(getPermissionStep.nextStep(functionStep)))
      .nextStep(responseStep);

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      mapStep,
      getPermissionStep,
      functionStep,
      responseStep,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Permissions Tutorial - Check Permission';

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
  readonly id: string = '4dc09f1f-1efc-4b13-b042-1da4adba437f';
}
