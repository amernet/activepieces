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
    if (
      new URLSearchParams(window.location.search).get('portalEmbed') === '1'
    ) {
      sessionStorage.setItem(PORTAL_EMBED_KEY, '1');
    }
    return (
      window.self !== window.top &&
      sessionStorage.getItem(PORTAL_EMBED_KEY) === '1'
    );
  } catch {
    return false;
  }
};

const initialState: EmbeddingState = isPortalEmbed()
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
