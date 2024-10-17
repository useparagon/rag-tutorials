import {
  ConditionalStep,
  FunctionStep,
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
  ISlackIntegration,
} from '@useparagon/integrations/slack';

import personaMeta from '../../../persona.meta';

/**
 * Paragon Tutorial - New Message Sync Workflow implementation
 */
export default class extends Workflow<
  ISlackIntegration,
  IPersona<typeof personaMeta>,
  InputResultMap
> {
  /**
   * Define workflow steps and orchestration.
   */
  define(
    integration: ISlackIntegration,
    context: IContext<InputResultMap>,
    connectUser: IConnectUser<IPersona<typeof personaMeta>>,
  ) {
    const triggerStep = integration.triggers.channelMessagePosted({});

    const parseMessageStep = new FunctionStep({
      autoRetry: false,
      description: 'Parse Message',
      code: function yourFunction(params, libraries) {
        const message = params.message;
        // @ts-ignore
        if (params.error) {
          return;
        } else if (message.type === 'message' && !message.subtype) {
          return { text: message.text, channel: message.channel };
        } else {
          return;
        }
      },
      parameters: { message: triggerStep.output.result },
    });

    const ifelseStep = new ConditionalStep({
      if: Operators.IsNotNull(parseMessageStep.output.result),
      description: "Message isn't empty?",
    });

    const requestStep = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send to Backend',
      url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/slack-upload`,
      method: 'POST',
      params: { ['']: '' },
      headers: {},
      body: {
        text: `${parseMessageStep.output.result.text}`,
        channel: `${parseMessageStep.output.result.channel}`,
      },
      bodyType: 'json',
    });

    triggerStep
      .nextStep(parseMessageStep)
      .nextStep(ifelseStep.whenTrue(requestStep));

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      parseMessageStep,
      ifelseStep,
      requestStep,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Paragon Tutorial - New Message Sync';

  /**
   * A user-facing description of the workflow shown in the Connect Portal.
   */
  description: string =
    'Allow RAG application to parse through messages in the Q&A channel';

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
  readonly id: string = '9fda5b17-67d6-4d59-bd73-d3e51809a45a';
}
