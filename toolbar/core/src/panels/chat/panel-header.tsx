import { PanelHeader } from '@/components/ui/panel';
import { cn } from '@/utils';
import { Button } from '@/components/ui/button';
import { ListFilterIcon, XIcon, PlusIcon } from 'lucide-react';
import { useAgentState } from '@/hooks/agent/use-agent-state';
import { useState } from 'react';
import { ChatList } from './chat-list';
import { useAgentChat } from '@/hooks/agent/chat';

export function ChatPanelHeader() {
  const agentState = useAgentState();
  const [chatListOpen, setChatListOpen] = useState(false);

  const { canCreateChat, createChat } = useAgentChat();

  return (
    <PanelHeader
      className={cn(
        'pointer-events-none absolute top-px right-px left-px z-20 mb-0 origin-bottom px-3 py-3 pl-4.5 transition-all duration-300 ease-out *:pointer-events-auto',
        chatListOpen
          ? 'h-[calc(100%-2px)] rounded-[inherit] bg-white/60 backdrop-blur-lg'
          : '!h-[calc-size(auto,size)] h-auto',
      )}
      title={chatListOpen && <span className="mt-0.5">Chats</span>}
      description={
        agentState.state.description && (
          <span className="text-sm">{agentState.state.description}</span>
        )
      }
      clear
      actionArea={
        <>
          {
            <div className="flex flex-row-reverse gap-1">
              <Button
                variant="secondary"
                glassy
                className="!opacity-100 z-10 size-8 cursor-pointer rounded-full p-1 shadow-md backdrop-blur-lg !disabled:*:opacity-10 hover:bg-white/60 active:bg-zinc-50/60"
                onClick={() => setChatListOpen(!chatListOpen)}
              >
                {chatListOpen ? (
                  <XIcon className="size-4 stroke-2" />
                ) : (
                  <ListFilterIcon className="size-4 stroke-2" />
                )}
              </Button>
              <Button
                variant="secondary"
                glassy
                className={cn(
                  '!opacity-100 z-10 size-8 cursor-pointer rounded-full p-1 shadow-md backdrop-blur-lg transition-all duration-150 ease-out !disabled:*:opacity-10 hover:bg-white/60 active:bg-zinc-50/60',
                  chatListOpen && 'w-fit px-2.5',
                )}
                disabled={!canCreateChat}
                onClick={() => createChat().then(() => setChatListOpen(false))}
              >
                {chatListOpen && <span className="mr-1">New chat</span>}
                <PlusIcon className="size-4 stroke-2" />
              </Button>
            </div>
          }
          {chatListOpen && (
            <div className="mask-alpha mask-[linear-gradient(to_bottom,transparent_0px,black_16px,black_calc(100%-16px),transparent_100%)] scrollbar-thin absolute top-16 right-4 bottom-4 left-4 overflow-hidden overflow-y-auto rounded-md py-4">
              <ChatList />
            </div>
          )}
        </>
      }
    />
  );
}
