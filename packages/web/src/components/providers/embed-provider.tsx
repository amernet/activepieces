import React, { createContext, useContext, useState } from 'react';

import { cn } from '@/lib/utils';

type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  hideFlowsPageNavbar: boolean;
  disableNavigationInBuilder: boolean;
  hideFolders: boolean;
  hideTables: boolean;
  hideFlowNameInBuilder: boolean;
  hideExportAndImportFlow: boolean;
  sdkVersion?: string;
  predefinedConnectionName?: string;
  fontUrl?: string;
  fontFamily?: string;
  useDarkBackground: boolean;
  hideHomeButtonInBuilder: boolean;
  emitHomeButtonClickedEvent: boolean;
  homeButtonIcon: 'back' | 'logo';
  hideDuplicateFlow: boolean;
  hidePageHeader: boolean;
};

const defaultState: EmbeddingState = {
  isEmbedded: false,
  hideSideNav: false,
  hideFlowsPageNavbar: false,
  disableNavigationInBuilder: false,
  hideFolders: false,
  hideTables: false,
  hideFlowNameInBuilder: false,
  hideExportAndImportFlow: false,
  useDarkBackground: window.opener !== null,
  hideHomeButtonInBuilder: false,
  emitHomeButtonClickedEvent: false,
  homeButtonIcon: 'logo',
  hideDuplicateFlow: false,
  hidePageHeader: false,
};

/**
 * Salesbay portal embed: when the app is loaded inside the portal's iframe
 * with ?portalEmbed=1, boot directly into the embedded UI (memory router,
 * no side nav) without the EE embedding SDK — users authenticate with their
 * own Activepieces session. The flag is persisted in sessionStorage because
 * the memory router drops the query string right after boot.
 */
const PORTAL_EMBED_KEY = 'sb-portal-embed';

const isPortalEmbed = (): boolean => {
  try {
    const param = new URLSearchParams(window.location.search).get(
      'portalEmbed',
    );
    if (param === '1') {
      sessionStorage.setItem(PORTAL_EMBED_KEY, '1');
    } else if (param === '0') {
      // explicit opt-out — e.g. the portal's admin page embeds the full UI
      sessionStorage.removeItem(PORTAL_EMBED_KEY);
    }
    return (
      window.self !== window.top &&
      sessionStorage.getItem(PORTAL_EMBED_KEY) === '1'
    );
  } catch {
    return false;
  }
};

/**
 * Portal auto-login: if the embed boots without a valid session, announce
 * SB_EMBED_READY to the parent portal; it mints a session token (signed with
 * this instance's own JWT secret, server-side) and posts it back as
 * SB_PORTAL_TOKEN. Store it and reload once — the user never sees the login
 * page. Only messages from the parent window on a salesbay.ai https origin
 * are accepted.
 */
const PORTAL_TOKEN_GUARD_KEY = 'sb-portal-token-applied';

const hasValidToken = (): boolean => {
  try {
    const token = window.localStorage.getItem('token');
    if (!token) return false;
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number };
    return !!payload.exp && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const setupPortalTokenBridge = (): void => {
  try {
    if (hasValidToken()) return;
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      if (!/^https:\/\/([a-z0-9-]+\.)*salesbay\.ai$/.test(event.origin)) {
        return;
      }
      const data = event.data as { type?: string; token?: string };
      if (data?.type !== 'SB_PORTAL_TOKEN' || !data.token) return;
      if (sessionStorage.getItem(PORTAL_TOKEN_GUARD_KEY) === data.token) {
        return; // this token was already applied — don't reload-loop
      }
      window.localStorage.setItem('token', data.token);
      sessionStorage.setItem(PORTAL_TOKEN_GUARD_KEY, data.token);
      window.location.reload();
    });
    window.parent.postMessage({ type: 'SB_EMBED_READY' }, '*');
  } catch {
    // storage unavailable — fall back to the normal login page
  }
};

const portalEmbedActive = isPortalEmbed();
if (portalEmbedActive) {
  setupPortalTokenBridge();
}

const initialState: EmbeddingState = portalEmbedActive
  ? {
      ...defaultState,
      isEmbedded: true,
      hideSideNav: true,
      useDarkBackground: false,
      homeButtonIcon: 'back',
    }
  : defaultState;

const EmbeddingContext = createContext<{
  embedState: EmbeddingState;
  setEmbedState: React.Dispatch<React.SetStateAction<EmbeddingState>>;
}>({
  embedState: defaultState,
  setEmbedState: () => {},
});

export const useEmbedding = () => useContext(EmbeddingContext);

type EmbeddingProviderProps = {
  children: React.ReactNode;
};

const EmbeddingProvider = ({ children }: EmbeddingProviderProps) => {
  const [state, setState] = useState<EmbeddingState>(initialState);

  return (
    <EmbeddingContext.Provider
      value={{ embedState: state, setEmbedState: setState }}
    >
      <div
        className={cn({
          'bg-black/80 h-screen w-screen':
            state.useDarkBackground && state.isEmbedded,
        })}
      >
        {children}
      </div>
    </EmbeddingContext.Provider>
  );
};

EmbeddingProvider.displayName = 'EmbeddingProvider';

export { EmbeddingProvider };
