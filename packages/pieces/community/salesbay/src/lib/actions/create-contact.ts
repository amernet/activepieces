import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesbayAuth } from '../../index';
import { finderOptions, salesbayApi } from '../common';

export const createContact = createAction({
  auth: salesbayAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a contact in a Salesbay Lead Finder list.',
  props: {
    leads_finder_id: Property.Dropdown({
      displayName: 'Lead Finder (list)',
      description: 'The list the contact belongs to.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your Salesbay account first', options: [] };
        }
        return { options: await finderOptions(auth) };
      },
    }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    title: Property.ShortText({ displayName: 'Job Title', required: false }),
    company: Property.ShortText({ displayName: 'Company', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
    industry: Property.ShortText({ displayName: 'Industry', required: false }),
    linkedin_url: Property.ShortText({ displayName: 'LinkedIn URL', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
  },
  async run({ auth, propsValue }) {
    return salesbayApi(auth, HttpMethod.POST, '/pipeline-contacts', {
      leads_finder_id: propsValue.leads_finder_id,
      first_name: propsValue.first_name ?? null,
      last_name: propsValue.last_name ?? null,
      email: propsValue.email || null,
      phone: propsValue.phone ?? null,
      title: propsValue.title ?? null,
      company: propsValue.company ?? null,
      city: propsValue.city ?? null,
      country: propsValue.country ?? null,
      industry: propsValue.industry ?? null,
      linkedin_url: propsValue.linkedin_url || null,
      notes: propsValue.notes ?? null,
    });
  },
});
