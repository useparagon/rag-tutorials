import {
  ConditionalStep,
  EndpointStep,
  ResponseStep,
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
 * 3) Agentic Actions Tutorial - Create Record Workflow implementation
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
    const triggerStep = new EndpointStep({
      allowArbitraryPayload: false,
      paramValidations: [],
      headerValidations: [],
      bodyValidations: [
        {
          key: 'first_name',
          dataType: 'STRING',
          required: true,
        },
        {
          key: 'last_name',
          dataType: 'STRING',
          required: true,
        },
        {
          key: 'email',
          dataType: 'STRING',
          required: true,
        },
        {
          key: 'title',
          dataType: 'STRING',
          required: true,
        },
      ],
    });

    const actionStep = integration.actions.searchRecords(
      {
        recordType: 'Contact',
        filterFormula: Operators.StringExactlyMatches(
          'Email',
          triggerStep.output.request.body.email,
        ),
      },
      {
        autoRetry: false,
        continueWorkflowOnError: false,
        description: 'Get Contacts with email',
      },
    );

    const ifelseStep = new ConditionalStep({
      if: Operators.ArrayIsEmpty(actionStep.output.result.records),
      description: 'Check if Contact is valid',
    });

    const actionStep1 = integration.actions.createRecord(
      {
        recordType: 'Contact',
        'field-FirstName': `${triggerStep.output.request.body.first_name}`,
        'field-LastName': `${triggerStep.output.request.body.last_name}`,
        'field-accountId': ``,
        'field-Email': `${triggerStep.output.request.body.email}`,
        'field-Title': `${triggerStep.output.request.body.title}`,
        'field-Description': ``,
      },
      {
        autoRetry: false,
        continueWorkflowOnError: false,
        description: 'Create Contact Record',
      },
    );

    const responseStep = new ResponseStep({
      description: 'Response',
      statusCode: 200,
      responseType: 'JSON',
      body: { status: '200' },
    });

    const responseStep1 = new ResponseStep({
      description: 'Duplicate Response',
      statusCode: 200,
      responseType: 'JSON',
      body: { status: '400', error: 'Duplicate Contact Found' },
    });

    triggerStep
      .nextStep(actionStep)
      .nextStep(
        ifelseStep
          .whenTrue(actionStep1.nextStep(responseStep))
          .whenFalse(responseStep1),
      );

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      actionStep,
      ifelseStep,
      actionStep1,
      responseStep,
      responseStep1,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = '3) Agentic Actions Tutorial - Create Record';

  /**
   * A user-facing description of the workflow shown in the Connect Portal.
   */
  description: string = 'Add a user-facing description of this workflow';

  /**
   * Define workflow-level User Settings. For integration-level User
   * Settings, see ../config.ts.
   * https://docs.useparagon.com/connect-portal/workflow-user-settings
   */
  inputs = createInputs({
    field_mapping: {
      id: '77718f5e-4c38-43ec-98a6-01311372ec7d',
      title: 'Field Mapping',
      tooltip: '',
      required: false,
      type: 'field_mapping',
      useDynamicMapper: false,
      fieldMappings: [
        {
          label: 'first name',
        },
        {
          label: 'last name',
        },
      ],
    },
  });

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
  readonly id: string = '7f91bc6d-2322-4592-a26a-992035a8d2a1';
}
