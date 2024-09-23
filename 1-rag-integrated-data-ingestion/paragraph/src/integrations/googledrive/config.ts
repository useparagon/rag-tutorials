import { IIntegrationConfig } from '@useparagon/core/integration';

import { default as RagTutorialSyncCurrentFiles } from './workflows/ragTutorialSyncCurrentFiles';
import { default as RagTutorialSyncFileUpdates } from './workflows/ragTutorialSyncFileUpdates';
import { default as RagTutorialSyncNewFiles } from './workflows/ragTutorialSyncNewFiles';

/**
 * configuration for a googledrive
 */
const config: IIntegrationConfig = {
  description: 'Save files to Google Drive',
  overviewText: `Connect your Google account and sync files from your Google Drive. 
        
Our Google Drive integration enables you to:
       
• Save files to your Google Drive
• Sync files from your Google Drive`,
  showWatermark: false,
  workflowDisplayOrder: [
    RagTutorialSyncCurrentFiles,
    RagTutorialSyncFileUpdates,
    RagTutorialSyncNewFiles,
  ],
};

export default config;
