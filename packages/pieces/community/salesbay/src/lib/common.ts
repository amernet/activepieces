import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export interface SalesbayAuthProps {
  base_url: string;
  api_key: string;
}

/**
 * Normalize the CustomAuth value: `run()`/dropdowns receive `{ props: {...} }`
 * while `validate()` receives the bare props object.
 */
export function authProps(auth: unknown): SalesbayAuthProps {
  const a = auth as { props?: SalesbayAuthProps } & SalesbayAuthProps;
  return a.props ?? a;
}

/** Strip a trailing slash so path joins are predictable. */
export function apiBase(auth: unknown): string {
  return authProps(auth).base_url.replace(/\/+$/, '');
}

/** Call the Salesbay REST API with Bearer API-key auth. */
export async function salesbayApi<T = unknown>(
  auth: unknown,
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${apiBase(auth)}${path}`,
    body,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: authProps(auth).api_key,
    },
  });
  return response.body;
}

interface ListEnvelope<T> {
  success: boolean;
  data: T[];
}

/** Dropdown options for active drip workflows. */
export async function workflowOptions(auth: unknown) {
  const res = await salesbayApi<ListEnvelope<{ id: string; name: string }>>(
    auth,
    HttpMethod.GET,
    '/drip-workflows?status=active&limit=100',
  );
  return (res.data ?? []).map((w) => ({ label: w.name, value: w.id }));
}

/** Dropdown options for Smart Segments. */
export async function segmentOptions(auth: unknown) {
  const res = await salesbayApi<ListEnvelope<{ id: string; name: string }>>(
    auth,
    HttpMethod.GET,
    '/smart-segments',
  );
  return (res.data ?? []).map((s) => ({ label: s.name, value: s.id }));
}

/** Dropdown options for Lead Finder lists (contacts live under a finder). */
export async function finderOptions(auth: unknown) {
  const res = await salesbayApi<ListEnvelope<{ id: string; title: string }>>(
    auth,
    HttpMethod.GET,
    '/leads-finders?limit=100',
  );
  return (res.data ?? []).map((f) => ({ label: f.title, value: f.id }));
}
