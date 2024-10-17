import { createInputs } from '@useparagon/integrations/googledrive';

/**
 * define inputs here which can be used across workflows
 */
const integrationInputs = createInputs({
  folder_to_share: {
    id: '1b5bdbd8-5241-4e15-a953-4e34b27077cf',
    title: 'Folder to share',
    tooltip: '',
    required: false,
    type: 'folder',
  },
});

export default integrationInputs;
