import { IIntegrationConfig } from '@useparagon/core/integration';

import { default as InitialIngestionOfContacts } from './workflows/initialIngestionOfContacts';
import { default as NewWorkflow } from './workflows/newWorkflow';
import { default as OptimizedPermissionTutorialSyncContactData } from './workflows/optimizedPermissionTutorialSyncContactData';
import { default as OptimizedPermissionTutorialSyncPermissions } from './workflows/optimizedPermissionTutorialSyncPermissions';
import { default as OptimizedPermissionTutorialTtlUpdatePermissions } from './workflows/optimizedPermissionTutorialTtlUpdatePermissions';
import { default as PushUpdatesToSfdc } from './workflows/pushUpdatesToSfdc';
import { default as SyncNewContacts } from './workflows/syncNewContacts';
import { default as TriggerWorkflowWhenSalesforceDealCloses } from './workflows/triggerWorkflowWhenSalesforceDealCloses';

/**
 * configuration for a salesforce
 */
const config: IIntegrationConfig = {
  description: 'Sync records from Salesforce',
  overviewText: `Connect your Salesforce account and sync your Salesforce accounts, contacts, leads, or opportunities. Enable your sales team to close more deals by keeping your Salesforce CRM records up to date - without manual data entry.    
    
Our Salesforce integration enables you to:  
    
• Automatically create or update records in Salesforce  
• Sync records from Salesforce  
• Receive updates when a record in Salesforce is created or updated`,
  showWatermark: true,
  workflowDisplayOrder: [
    OptimizedPermissionTutorialSyncContactData,
    OptimizedPermissionTutorialSyncPermissions,
    OptimizedPermissionTutorialTtlUpdatePermissions,
  ],
};

export default config;
