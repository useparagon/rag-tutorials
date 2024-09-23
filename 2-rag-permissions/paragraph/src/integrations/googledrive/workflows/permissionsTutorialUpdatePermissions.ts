import {
  FanOutStep,
  FunctionStep,
  IntegrationRequestStep,
  RequestStep,
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
 * Permissions Tutorial - Update permissions Workflow implementation
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
    const triggerStep = integration.triggers.googleDriveTriggerFileUpdated({});

    const integrationRequestStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get Permissions',
      method: 'GET',
      url: `files/${triggerStep.output.result.id}/permissions?fields=*`,
      params: { [`fields`]: `*` },
      headers: {},
    });

    const mapStep = new FanOutStep({
      description: 'For Each Permission',
      iterator: integrationRequestStep.output.response.body.permissions,
    });

    const functionStep = new FunctionStep({
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

    const requestStep = new RequestStep({
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

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      integrationRequestStep,
      mapStep,
      functionStep,
      requestStep,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Permissions Tutorial - Update permissions';

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
  readonly id: string = '8847ed9b-8ae8-4384-b935-d663e499e7db';
}
