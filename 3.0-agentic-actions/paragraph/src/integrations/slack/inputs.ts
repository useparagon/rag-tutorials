import { createInputs } from '@useparagon/integrations/slack';

/**
 * define inputs here which can be used across workflows
 */
const integrationInputs = createInputs({
  channel: {
    id: 'fc1ab5f7-b522-4d75-94f2-c87fe8a7677c',
    title: 'channel',
    tooltip: '',
    required: false,
    type: 'channel',
  },
});

export default integrationInputs;
