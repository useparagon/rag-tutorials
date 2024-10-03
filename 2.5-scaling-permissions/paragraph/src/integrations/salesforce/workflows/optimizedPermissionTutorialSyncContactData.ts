import {
  FanOutStep,
  IntegrationEnabledStep,
  RequestStep,
  Workflow,
} from '@useparagon/core';
import { IContext } from '@useparagon/core/execution';
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
 * Optimized Permission Tutorial - Sync Contact Data Workflow implementation
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
    const triggerStep = new IntegrationEnabledStep();

    const actionStep = integration.actions.searchRecords(
      { recordType: 'Contact', filterFormula: undefined },
      {
        autoRetry: false,
        continueWorkflowOnError: false,
        description: 'Get All Contacts',
      },
    );

    const mapStep = new FanOutStep({
      description: 'For each contact',
      iterator: actionStep.output.result.records,
    });

    const requestStep = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send to backend',
      url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/salesforce-upload`,
      method: 'POST',
      params: { ['']: '' },
      headers: {},
      body: {
        text: `${mapStep.output.instance}`,
        fileId: `${mapStep.output.instance.attributes.type}`,
      },
      bodyType: 'json',
    });

    triggerStep.nextStep(actionStep).nextStep(mapStep.branch(requestStep));

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({ triggerStep, actionStep, mapStep, requestStep });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Optimized Permission Tutorial - Sync Contact Data';

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
  readonly id: string = '7889b86f-84da-4cab-8d12-8cb1cbac41e2';
}
