import { Button } from '@/components/ui/button';
import { useAgentChat } from '@/hooks/agent/chat';
import { cn, getDataUriForData } from '@/utils';
import type {
  ChatMessage,
  FilePart,
  ToolApprovalPart,
  ToolCallPart,
  ToolResultPart,
} from '@stagewise/agent-interface/toolbar';
import {
  CheckIcon,
  CogIcon,
  EyeIcon,
  FileIcon,
  PencilIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { memo, useMemo } from 'react';

export function ChatBubble({
  message: msg,
  toolResultParts,
  toolApprovalParts,
}: {
  message: ChatMessage;
  toolResultParts: ToolResultPart[];
  toolApprovalParts: ToolApprovalPart[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          'mt-2 flex w-full shrink-0 items-center justify-start gap-2',
          msg.role ? 'flex-row' : 'flex-row-reverse',
        )}
      >
        <div
          className={cn(
            'group relative flex min-h-8 items-center space-y-2 rounded-2xl bg-white/5 px-2.5 py-1 font-normal text-sm ring-1 ring-inset',
            msg.role === 'assistant'
              ? 'rounded-bl-xs bg-zinc-200/50 text-zinc-950 ring-zinc-950/5'
              : 'rounded-br-xs bg-blue-600/90 text-white ring-white/5',
          )}
        >
          <div className="group-hover:-top-3 -top-2 absolute left-1 z-20 rounded-full bg-white/90 px-1.5 py-0.5 text-xs text-zinc-950/80 opacity-0 shadow-sm ring-1 ring-zinc-500/10 ring-inset transition-all duration-150 ease-out group-hover:opacity-100">
            2 minutes ago
          </div>
          {msg.content.map((part, index) => {
            switch (part.type) {
              case 'text':
                return (
                  <p
                    key={`content_part_${index.toString()}`}
                    className="whitespace-pre-wrap"
                  >
                    {part.text}
                  </p>
                );
              case 'file':
                return (
                  <FilePartItem
                    key={`content_part_${index.toString()}`}
                    file={part}
                  />
                );
              case 'tool-call':
                return (
                  <ToolCallPartItem
                    key={`content_part_${index.toString()}`}
                    toolCall={part}
                    approvalParts={toolApprovalParts}
                    toolResultParts={toolResultParts}
                  />
                );
              default:
                return null;
            }
          })}
        </div>

        <div className="min-w-12 grow" />
      </div>
    </div>
  );
}

const FilePartItem = memo(({ file }: { file: FilePart }) => {
  const dataUri = useMemo(() => getDataUriForData(file.data), [file.data]);

  if (file.type.startsWith('image/')) {
    return (
      <a href={dataUri} target="_blank" rel="noopener noreferrer">
        <img
          src={dataUri}
          alt={file.filename ?? 'Generated file'}
          className="h-auto max-w-full rounded-lg"
        />
      </a>
    );
  }
  return (
    <div
      role="button"
      className="flex w-full cursor-pointer items-center gap-2 rounded-lg bg-black/5 p-2 hover:bg-black/10"
      onClick={() => {
        window.open(dataUri, '_blank');
      }}
    >
      <FileIcon className="size-4" />
      <span className="text-xs">{file.filename ?? 'Generated file'}</span>
    </div>
  );
});

const ToolCallPartItem = memo(
  ({
    toolCall,
    approvalParts,
    toolResultParts,
  }: {
    toolCall: ToolCallPart;
    approvalParts: ToolApprovalPart[];
    toolResultParts: ToolResultPart[];
  }) => {
    const { approveToolCall } = useAgentChat();

    const approvalPart = useMemo(
      () =>
        approvalParts.find((part) => part.toolCallId === toolCall.toolCallId),
      [approvalParts, toolCall.toolCallId],
    );
    const toolResultPart = useMemo(
      () =>
        toolResultParts.find((part) => part.toolCallId === toolCall.toolCallId),
      [toolResultParts, toolCall.toolCallId],
    );

    return (
      <div className="flex flex-call gap-2 rounded-lg bg-black/5 p-2 hover:bg-black/10">
        <div className="flex w-full flex-row items-center justify-between gap-3">
          {getToolIcon(toolCall.toolName)}
          <div className="flex flex-col items-center gap-0">
            <span className="text-xs">{toolCall.toolName}</span>
            {toolCall.requiresApproval && !approvalPart && (
              <span className="text-black/80 text-xs">
                Waiting for approval
              </span>
            )}
          </div>
          {toolCall.requiresApproval && !approvalPart && (
            <div className="flex flex-row items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-4 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  approveToolCall(toolCall.toolCallId, false);
                }}
              >
                <XIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-4 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  approveToolCall(toolCall.toolCallId, true);
                }}
              >
                <CheckIcon className="size-4" />
              </Button>
            </div>
          )}
          {toolResultPart && (
            <div className="flex flex-row items-center gap-1">
              <span className="text-black/60 text-xs">
                {toolResultPart.isError ? 'Error' : 'Success'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  },
);

const getToolIcon = (toolName: string) => {
  switch (toolName) {
    case 'readFileTool':
    case 'listFilesTool':
      return <EyeIcon className="size-3" />;
    case 'grepSearchTool':
    case 'globTool':
      return <SearchIcon className="size-3" />;
    case 'overwriteFileTool':
    case 'multiEditTool':
      return <PencilIcon className="size-3" />;
    case 'deleteFileTool':
      return <TrashIcon className="size-3" />;
    default:
      return <CogIcon className="size-3" />;
  }
};
