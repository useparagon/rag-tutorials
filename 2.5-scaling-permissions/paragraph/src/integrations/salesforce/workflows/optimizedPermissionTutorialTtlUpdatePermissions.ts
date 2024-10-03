import {
  ConditionalStep,
  CronStep,
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
  InputResultMap,
  ISalesforceIntegration,
} from '@useparagon/integrations/salesforce';

import personaMeta from '../../../persona.meta';

/**
 * Optimized Permission Tutorial - TTL Update Permissions Workflow implementation
 */
export default class extends Workflow<
  ISalesforceIntegration,
  IPersona<typeof personaMeta>,
  InputResultMap
> {
  /**
   * Define workflow steps and orchestration.
   */
  define(
    integration: ISalesforceIntegration,
    context: IContext<InputResultMap>,
    connectUser: IConnectUser<IPersona<typeof personaMeta>>,
  ) {
    const triggerStep = new CronStep({
      cron: '0 0 5 */1 * *',
      timeZone: 'America/Los_Angeles',
    });

    const getAllUsersStep = integration.actions.writeSoqlQuery(
      { query: `SELECT Id FROM User` },
      {
        autoRetry: false,
        continueWorkflowOnError: false,
        description: 'Get All Users',
      },
    );

    const forEachUserStep = new FanOutStep({
      description: 'For Each User',
      iterator: getAllUsersStep.output.result.records,
    });

    const getUserStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get User',
      method: 'GET',
      url: `sobjects/user/${forEachUserStep.output.instance.Id}`,
      params: { ['']: '' },
      headers: {},
    });

    const getProfileStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get profile',
      method: 'GET',
      url: `sobjects/profile/${getUserStep.output.response.body.ProfileId}`,
      params: { ['']: '' },
      headers: {},
    });

    const functionStep = new FunctionStep({
      autoRetry: false,
      description: 'Create Permission Objects',
      code: function yourFunction(parameters, libraries) {
        const user = parameters.subject;
        const perm = parameters.object;

        const permissions = [];

        if (perm.PermissionsManageLeads) {
          let permission = [
            {
              subject: {
                subjectType: 'user',
                relationshipType: 'writer',
                subjectId: user.Email,
              },
              object: {
                objectType: 'salesforce-object',
                objectId: 'Salesforce-Lead',
              },
            },
          ];
          // @ts-ignore
          permissions.push(permission);
        } else if (perm.PermissionsLeadInspectorUser) {
          let permission = [
            {
              subject: {
                subjectType: 'user',
                relationshipType: 'viewer',
                subjectId: user.Email,
              },
              object: {
                objectType: 'salesforce-object',
                objectId: 'Salesforce-Lead',
              },
            },
          ];
          // @ts-ignore
          permissions.push(permission);
        }

        if (perm.PermissionsModifyAllData) {
          let permission = [
            {
              subject: {
                subjectType: 'user',
                relationshipType: 'writer',
                subjectId: user.Email,
              },
              object: {
                objectType: 'salesforce-object',
                objectId: 'Salesforce-Contact',
              },
            },
          ];
          // @ts-ignore
          permissions.push(permission);
        } else if (perm.PermissionsContactInspectorUser) {
          let permission = [
            {
              subject: {
                subjectType: 'user',
                relationshipType: 'viewer',
                subjectId: user.Email,
              },
              object: {
                objectType: 'salesforce-object',
                objectId: 'Salesforce-Contact',
              },
            },
          ];
          // @ts-ignore
          permissions.push(permission);
        }

        return permissions;
      },
      parameters: {
        subject: getUserStep.output.response.body,
        object: getProfileStep.output.response.body,
      },
    });

    const ifelseStep = new ConditionalStep({
      if: Operators.ArrayIsEmpty(functionStep.output.result),
      description: 'Check if permissions exist',
    });

    const mapStep = new FanOutStep({
      description: 'For each permission',
      iterator: functionStep.output.result,
    });

    const requestStep = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send permissions to backend',
      url: `https://immensely-informed-dassie.ngrok-free.app/api/permissions`,
      method: 'POST',
      params: { ['']: '' },
      headers: {},
      body: {
        type: `update`,
        source: `salesforce`,
        data: `${mapStep.output.instance}`,
      },
      bodyType: 'json',
    });

    triggerStep.nextStep(getAllUsersStep).nextStep(
      forEachUserStep.branch(
        getUserStep
          .nextStep(getProfileStep)
          .nextStep(functionStep)
          .nextStep(ifelseStep.whenFalse(mapStep.branch(requestStep))),
      ),
    );

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      getAllUsersStep,
      forEachUserStep,
      getUserStep,
      getProfileStep,
      functionStep,
      ifelseStep,
      mapStep,
      requestStep,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Optimized Permission Tutorial - TTL Update Permissions';

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
  readonly id: string = 'd6452135-f8a5-4fdd-a465-a5bb34e491c1';
}
