import {
  ConditionalStep,
  FanOutStep,
  FunctionStep,
  IntegrationEnabledStep,
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
  ISlackIntegration,
} from '@useparagon/integrations/slack';

import personaMeta from '../../../persona.meta';

/**
 * Paragon Tutorial - Initial Channel Sync Workflow implementation
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
    const triggerStep = new IntegrationEnabledStep();

    const integrationRequestStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get All Channels',
      method: 'GET',
      url: `/conversations.list`,
      params: { ['']: '' },
      headers: {},
    });

    const mapStep = new FanOutStep({
      description: 'For each channel',
      iterator: integrationRequestStep.output.response.body.channels,
    });

    const integrationRequestStep1 = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get Conversation History',
      method: 'GET',
      url: `/conversations.history?channel=${mapStep.output.instance.id}`,
      params: { [`channel`]: `${mapStep.output.instance.id}` },
      headers: {},
    });

    const functionStep = new FunctionStep({
      autoRetry: false,
      description: 'Parse Message JSON',
      code: function yourFunction(params, libraries) {
        const messages = params.messages;
        if (!Array.isArray(messages) || params.error) {
          return;
        }

        const parsedMessages = [];

        messages.forEach((message) => {
          if (message.type === 'message' && !message.subtype) {
            // @ts-ignore
            parsedMessages.push({
              text: message.text,
              channel: params.channel,
            });
          }
        });
        return parsedMessages;
      },
      parameters: {
        messages: integrationRequestStep1.output.response.body.messages,
        error: integrationRequestStep1.output.response.body.error,
        channel: mapStep.output.instance.name,
      },
    });

    const checkArrayStep = new ConditionalStep({
      if: Operators.IsNotNull(functionStep.output.result),
      description: 'Check Array',
    });

    const mapStep1 = new FanOutStep({
      description: 'For each message',
      iterator: functionStep.output.result,
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
        text: `${mapStep1.output.instance.text}`,
        channel: `${mapStep1.output.instance.channel}`,
      },
      bodyType: 'json',
    });

    triggerStep
      .nextStep(integrationRequestStep)
      .nextStep(
        mapStep.branch(
          integrationRequestStep1
            .nextStep(functionStep)
            .nextStep(checkArrayStep.whenTrue(mapStep1.branch(requestStep))),
        ),
      );

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      integrationRequestStep,
      mapStep,
      integrationRequestStep1,
      functionStep,
      checkArrayStep,
      mapStep1,
      requestStep,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Paragon Tutorial - Initial Channel Sync';

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
  readonly id: string = '2af13f19-af7a-43d4-8610-0791ee442db2';
}
