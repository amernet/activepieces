import {
  AuthenticationType,
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';
import { enrollSegmentInWorkflow } from './lib/actions/enroll-segment';
import { findSmartSegments } from './lib/actions/find-segments';
import { apiBase, authProps } from './lib/common';

export const salesbayAuth = PieceAuth.CustomAuth({
  description: `
Connect to your Salesbay (Amernet AI Growth Engine) workspace:

1. In Salesbay, go to **Settings → API Keys** and create a key.
2. Paste the key below. The base URL is your portal's API root.
`,
  props: {
    base_url: Property.ShortText({
      displayName: 'API Base URL',
      description: 'Your Salesbay API root',
      required: true,
      defaultValue: 'https://saas.salesbay.ai/api/v1',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'A Salesbay API key (sent as a Bearer token).',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${apiBase(auth)}/smart-segments`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: authProps(auth).api_key,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Could not reach Salesbay with this key — check the base URL and API key.',
      };
    }
  },
  required: true,
});

export const salesbay = createPiece({
  displayName: 'Salesbay',
  description: 'Amernet AI Growth Engine — contacts, Smart Segments, and drip workflows.',
  logoUrl: 'https://saas.salesbay.ai/images/favicon.png',
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.SALES_AND_CRM],
  auth: salesbayAuth,
  authors: ['amernet'],
  actions: [
    createContact,
    enrollSegmentInWorkflow,
    findSmartSegments,
    createCustomApiCallAction({
      baseUrl: (auth) => apiBase(auth),
      auth: salesbayAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${authProps(auth).api_key}`,
      }),
    }),
  ],
  triggers: [],
});
