import { IIntegrationConfig } from '@useparagon/core/integration';

import { default as ParagonTutorialInitialChannelSync } from './workflows/1ParagonTutorialInitialChannelSync';
import { default as ParagonTutorialNewMessageSync } from './workflows/1ParagonTutorialNewMessageSync';
import { default as AgenticActionTutorialSendSlackMessage } from './workflows/3AgenticActionTutorialSendSlackMessage';
import { default as DocumentSignedSlackNotification } from './workflows/documentSignedSlackNotification';

/**
 * configuration for a slack
 */
const config: IIntegrationConfig = {
  description: 'Send notifications to Slack',
  overviewText: `Connect your Slack workspace to receive notifications and alerts in Slack. Stay connected to important activity by bringing it all together in your Slack workspace.
       

Our Slack integration enables you to:
   

• Receive alerts and notifications in your Slack workspace
• Notify or DM specific team members based on certain activity`,
  showWatermark: true,
  workflowDisplayOrder: [
    ParagonTutorialInitialChannelSync,
    ParagonTutorialNewMessageSync,
    AgenticActionTutorialSendSlackMessage,
    DocumentSignedSlackNotification,
  ],
};

export default config;
