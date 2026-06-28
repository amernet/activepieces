import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesbayAuth } from '../../index';
import { salesbayApi, segmentOptions, workflowOptions } from '../common';

export const enrollSegmentInWorkflow = createAction({
  auth: salesbayAuth,
  name: 'enroll_segment_in_workflow',
  displayName: 'Enroll Segment in Drip Workflow',
  description:
    'Enroll every contact matching a Smart Segment into an active drip workflow (deduplicated — already-enrolled contacts are skipped).',
  props: {
    workflow_id: Property.Dropdown({
      auth: salesbayAuth,
      displayName: 'Drip Workflow (active)',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your Salesbay account first', options: [] };
        }
        return { options: await workflowOptions(auth) };
      },
    }),
    segment_id: Property.Dropdown({
      auth: salesbayAuth,
      displayName: 'Smart Segment',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your Salesbay account first', options: [] };
        }
        return { options: await segmentOptions(auth) };
      },
    }),
    dry_run: Property.Checkbox({
      displayName: 'Dry Run',
      description: 'Preview the eligible count without enrolling anyone.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return salesbayApi(
      auth,
      HttpMethod.POST,
      `/drip-workflows/${propsValue.workflow_id}/enroll-segment`,
      { segmentId: propsValue.segment_id, dryRun: propsValue.dry_run ?? false },
    );
  },
});
