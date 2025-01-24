import { IIntegrationConfig } from '@useparagon/core/integration';

import { default as DataIngestionFileChanges } from './workflows/dataIngestionFileChanges';
import { default as DataIngestionFilePicker } from './workflows/dataIngestionFilePicker';
import { default as DataIngestionInitial } from './workflows/dataIngestionInitial';
import { default as DataIngestionNewFile } from './workflows/dataIngestionNewFile';
import { default as PermissionsFilePicker } from './workflows/permissionsFilePicker';
import { default as PermissionsInitialIngestionDevelopment } from './workflows/permissionsInitialIngestionDevelopment';
import { default as PermissionsInitialIngestionNonRecursive } from './workflows/permissionsInitialIngestionNonRecursive';
import { default as PermissionsInitialTriggerDevelopment } from './workflows/permissionsInitialTriggerDevelopment';
import { default as PermissionsPermissionChanges } from './workflows/permissionsPermissionChanges';

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
    DataIngestionInitial,
    DataIngestionNewFile,
    PermissionsPermissionChanges,
    PermissionsInitialIngestionDevelopment,
    DataIngestionFileChanges,
    PermissionsInitialTriggerDevelopment,
    PermissionsInitialIngestionNonRecursive,
    DataIngestionFilePicker,
    PermissionsFilePicker,
  ],
};

export default config;
