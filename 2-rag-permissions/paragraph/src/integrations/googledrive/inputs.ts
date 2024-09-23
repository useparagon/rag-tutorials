import { createInputs } from '@useparagon/integrations/googledrive';

/**
 * define inputs here which can be used across workflows
 */
const integrationInputs = createInputs({
  folder_to_share: {
    id: 'Google-drive-input',
    title: 'folder-to-share',
    required: false,
    type: 'folder',
  }
});

export default integrationInputs;
