import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesbayAuth } from '../../index';
import { salesbayApi } from '../common';

export const findSmartSegments = createAction({
  auth: salesbayAuth,
  name: 'find_smart_segments',
  displayName: 'Find Smart Segments',
  description: 'List the workspace’s Smart Segments (reusable audiences).',
  props: {},
  async run({ auth }) {
    return salesbayApi(auth, HttpMethod.GET, '/smart-segments');
  },
});
