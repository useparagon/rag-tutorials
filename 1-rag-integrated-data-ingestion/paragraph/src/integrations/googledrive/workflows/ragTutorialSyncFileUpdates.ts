import {
  ConditionalStep,
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
  IGoogledriveIntegration,
  InputResultMap,
} from '@useparagon/integrations/googledrive';

import personaMeta from '../../../persona.meta';

/**
 * RAG Tutorial - Sync File Updates Workflow implementation
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

    const ifelseStep = new ConditionalStep({
      if: Operators.Or(
        Operators.And(
          Operators.StringExactlyMatches(
            triggerStep.output.result.mimeType,
            'application/vnd.google-apps.document',
          ),
        ),
        Operators.And(
          Operators.StringExactlyMatches(
            triggerStep.output.result.mimeType,
            'application/vnd.google-apps.presentation',
          ),
        ),
        Operators.And(
          Operators.StringExactlyMatches(
            triggerStep.output.result.mimeType,
            'application/vnd.google-apps.spreadsheet',
          ),
        ),
      ),
      description: 'Check if Google Workspace File',
    });

    const ifelseStep1 = new ConditionalStep({
      if: Operators.StringExactlyMatches(
        triggerStep.output.result.mimeType,
        'application/vnd.google-apps.spreadsheet',
      ),
      description: 'Check if spreadsheet',
    });

    const integrationRequestStep = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get Google Sheets',
      method: 'GET',
      url: `files/${triggerStep.output.result.id}/export?mimeType=text/csv`,
      params: { [`mimeType`]: `text/csv` },
      headers: {},
    });

    const requestStep = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send contents to backend',
      url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/gdrive-upload`,
      method: 'POST',
      params: { ['']: '' },
      headers: {},
      body: {
        text: `${integrationRequestStep.output.response.body}`,
        filename: `${triggerStep.output.result.name}`,
      },
      bodyType: 'json',
    });

    const integrationRequestStep1 = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get Google Doc or Slides',
      method: 'GET',
      url: `files/${triggerStep.output.result.id}/export?mimeType=text/plain`,
      params: { [`mimeType`]: `text/plain` },
      headers: {},
    });

    const requestStep1 = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send contents to backend',
      url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/gdrive-upload`,
      method: 'POST',
      params: { ['']: '' },
      headers: {},
      body: {
        text: `${integrationRequestStep1.output.response.body}`,
        filename: `${triggerStep.output.result.name}`,
      },
      bodyType: 'json',
    });

    const integrationRequestStep2 = new IntegrationRequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Get Non-Google Native File',
      method: 'GET',
      url: `files/${triggerStep.output.result.id}?alt=media`,
      params: { [`alt`]: `media` },
      headers: {},
    });

    const functionStep = new FunctionStep({
      autoRetry: false,
      description: 'Convert to base64 format',
      code: function yourFunction(param, libraries) {
        var buffer = libraries.Buffer;
        const fileData = param.file.data;
        const fileType = param.file.mimeType;

        // @ts-ignore
        return ('data:' + fileType + ';base64,' + buffer.from(fileData, 'hex').toString('base64'));
      },
      parameters: { file: integrationRequestStep2.output.response.body },
    });

    const requestStep2 = new RequestStep({
      autoRetry: false,
      continueWorkflowOnError: false,
      description: 'Send contents to upload file backend',
      url: `https://immensely-informed-dassie.ngrok-free.app/api/chat/upload`,
      method: 'POST',
      params: { ['']: '' },
      headers: {},
      body: { base64: `${functionStep.output.result}` },
      bodyType: 'json',
    });

    triggerStep.nextStep(
      ifelseStep
        .whenTrue(
          ifelseStep1
            .whenTrue(integrationRequestStep.nextStep(requestStep))
            .whenFalse(integrationRequestStep1.nextStep(requestStep1)),
        )
        .whenFalse(
          integrationRequestStep2.nextStep(functionStep).nextStep(requestStep2),
        ),
    );

    /**
     * Pass all steps used in the workflow to the `.register()`
     * function. The keys used in this function must remain stable.
     */
    return this.register({
      triggerStep,
      ifelseStep,
      ifelseStep1,
      integrationRequestStep,
      requestStep,
      integrationRequestStep1,
      requestStep1,
      integrationRequestStep2,
      functionStep,
      requestStep2,
    });
  }

  /**
   * The name of the workflow, used in the Dashboard and Connect Portal.
   */
  name: string = 'RAG Tutorial - Sync File Updates';

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
  readonly id: string = 'e0d3f3c4-dc2b-4631-8496-2fb006c4d626';
}
