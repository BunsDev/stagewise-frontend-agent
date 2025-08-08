import { PluginProvider } from '@/hooks/use-plugins';
import type { InternalToolbarConfig } from '../config';
import { ChatStateProvider } from '@/hooks/use-chat-state';
import type { ReactNode } from 'react';
import { ConfigProvider } from '@/hooks/use-config';
import { AgentProvider } from '@/hooks/agent/use-agent-provider';
import { AgentAvailabilityProvider } from '@/hooks/agent/use-agent-availability';
import { AgentStateProvider } from '@/hooks/agent/use-agent-state';
import { AgentMessagingProvider } from '@/hooks/agent/use-agent-messaging';
import { AgentUndoProvider } from '@/hooks/agent/use-agent-undo';
import { PanelsProvider } from '@/hooks/use-panels';

export function ContextProviders({
  children,
  config,
}: {
  children?: ReactNode;
  config?: InternalToolbarConfig;
}) {
  return (
    <ConfigProvider config={config}>
      <AgentProvider>
        <AgentAvailabilityProvider>
          <AgentStateProvider>
            <AgentMessagingProvider>
              <AgentUndoProvider>
                <PanelsProvider>
                  <PluginProvider>
                    <ChatStateProvider>{children}</ChatStateProvider>
                  </PluginProvider>
                </PanelsProvider>
              </AgentUndoProvider>
            </AgentMessagingProvider>
          </AgentStateProvider>
        </AgentAvailabilityProvider>
      </AgentProvider>
    </ConfigProvider>
  );
}
