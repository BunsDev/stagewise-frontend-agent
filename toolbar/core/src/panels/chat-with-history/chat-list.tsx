import { Trash2Icon } from 'lucide-react';
import TimeAgo from 'react-timeago';
import { useAgentChat } from '@/hooks/agent/chat';
import { useCallback } from 'react';
import type { ChatListItem } from '@stagewise/agent-interface/toolbar';

export function ChatList() {
  const chats = useAgentChat().chats;

  return (
    <div className="flex flex-col divide-y divide-zinc-500/10">
      {chats.map((chat) => (
        <ChatListEntry key={chat.id} chat={chat} />
      ))}
    </div>
  );
}

function ChatListEntry({ chat }: { chat: ChatListItem }) {
  const delChatBaseFunc = useAgentChat().deleteChat;

  const deleteChat = useCallback(
    () => void delChatBaseFunc(chat.id),
    [chat.id, delChatBaseFunc],
  );

  return (
    <div className="py-0.5">
      <div className="flex shrink-0 cursor-pointer flex-row items-center justify-between gap-4 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-zinc-500/5">
        <div className="flex flex-1 flex-col items-start justify-start gap-0">
          <span className="truncate font-medium text-sm text-zinc-950">
            {chat.title}
          </span>
          <span className="text-xs text-zinc-600">
            <TimeAgo date={chat.createdAt} />
          </span>
        </div>
        <div className="flex flex-row gap-1">
          <button
            className="pointer-cursor flex size-8 items-center justify-center rounded-full text-zinc-500 transition-all duration-150 hover:bg-rose-600/10 hover:text-rose-600"
            type="button"
            onClick={deleteChat}
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
