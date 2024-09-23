import { FunctionStep, RequestStep, Workflow } from '@useparagon/core';
import { IContext } from '@useparagon/core/execution';
import { IPersona } from '@useparagon/core/persona';
import { ConditionalInput } from '@useparagon/core/steps/library/conditional';
import { IConnectUser, IPermissionContext } from '@useparagon/core/user';
import {
  createInputs,
  INotionIntegration,
  InputResultMap,
} from '@useparagon/integrations/notion';

import personaMeta from '../../../persona.meta';

/**
 * Paragon Tutorial - Send Notion Contents to API Workflow implementation
 */
export default class extends Workflow<
  INotionIntegration,
  IPersona<typeof personaMeta>,
  InputResultMap
> {
  /**
   * Define workflow steps and orchestration.
   */
  define(
    integration: INotionIntegration,
    context: IContext<InputResultMap>,
    connectUser: IConnectUser<IPersona<typeof personaMeta>>,
  ) {
    const triggerStep = integration.triggers.pageUpdated({});

    const actionStep = integration.actions.getPageContent(
      { blockId: `${triggerStep.output.result.id}` },
      {
        autoRetry: false,
        continueWorkflowOnError: false,
        description: 'Get Page Contents',
      },
    );

    const parseContentsStep = new FunctionStep({
      autoRetry: false,
      description: 'Parse Contents',
      code: function parseNotionPage(parameters) {
        if (!Array.isArray(parameters.blocks)) {
          console.error('Invalid notion data provided. Expected an array.');
          return [];
        }

        const parsedContent = [];

        parameters.blocks.forEach((block) => {
          const blockType = block.type;
          if (blockType === 'heading_3') {
            const headingContent = block.heading_3.rich_text[0].plain_text;
            // @ts-ignore
            parsedContent.push(`<h3>${headingContent}</h3>`);
          } else if (blockType === 'paragraph') {
            const paragraphContent = block.paragraph.rich_text
              .map((text) => text.plain_text)
              .join(' ');
            // @ts-ignore
            parsedContent.push(`<p>${paragraphContent}</p>`);
          } else if (blockType === 'child_page') {
            const childPageTitle = block.child_page.title;
            // @ts-ignore
            parsedContent.push(`<h2>${childPageTitle}</h2>`);
          }
        });

        return { text: parsedContent.join('\n'), url: parameters.url };
      },
      parameters: {
        blocks: actionStep.output.result,
        url: triggerStep.output.result.url,
      },
    });

    const requestStep = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send to Backend',
      url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/notion-upload`,
      method: 'POST',
      params: { [``]: `` },
      headers: {},
      body: {
        text: `${parseContentsStep.output.result.text}`,
        url: `${parseContentsStep.output.result.url}`,
      },
      bodyType: 'json',
    });

    triggerStep
      .nextStep(actionStep)
      .nextStep(parseContentsStep)
      .nextStep(requestStep);

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      actionStep,
      parseContentsStep,
      requestStep,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'Paragon Tutorial - Send Notion Contents to API';

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
  readonly id: string = '9dacef6a-082f-4583-8baf-33e42f24a0d4';
}
