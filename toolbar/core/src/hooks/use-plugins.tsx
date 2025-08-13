import { createContext, type ReactNode } from 'react';
import { useContext, useEffect, useMemo, useRef } from 'react';
import type { ToolbarContext, ToolbarPlugin } from '@/plugin-sdk/plugin';
import { useConfig } from './use-config';
import { getIFrameWindow } from '@/utils';
import { usePanels } from './use-panels';
import { useKarton } from './use-karton';
import type { UserMessage } from '@stagewise/karton-contract';

export interface PluginContextType {
  plugins: ToolbarPlugin[];
  toolbarContext: ToolbarContext;
}

const PluginContext = createContext<PluginContextType>({
  plugins: [],
  toolbarContext: {
    sendPrompt: () => {},
    mainAppWindow: getIFrameWindow(),
  },
});

export function PluginProvider({ children }: { children?: ReactNode }) {
  const { config } = useConfig();

  const { sendUserMessage } = useKarton((s) => ({
    sendUserMessage: s.serverProcedures.sendUserMessage,
  }));

  const { openChat } = usePanels();

  const plugins = config?.plugins || [];

  const toolbarContext = useMemo(() => {
    return {
      sendPrompt: async (prompt: UserMessage) => {
        // We don't collect additional pluginContentItems when plugins send messages since it's probably a very specific message anyway
        sendUserMessage({
          ...prompt,
          metadata: { ...prompt.metadata, sentByPlugin: true },
        });
        openChat();
      },
      mainAppWindow: getIFrameWindow(),
    };
  }, [sendUserMessage]);

  // call plugins once on initial load
  const pluginsLoadedRef = useRef(false);
  useEffect(() => {
    if (pluginsLoadedRef.current) return;
    pluginsLoadedRef.current = true;
    plugins.forEach((plugin) => {
      plugin.onLoad?.(toolbarContext);
    });
  }, [plugins, toolbarContext]);

  const value = useMemo(() => {
    return {
      plugins,
      toolbarContext,
    };
  }, [plugins, toolbarContext]);

  return (
    <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
  );
}

export function usePlugins() {
  return useContext(PluginContext);
}
