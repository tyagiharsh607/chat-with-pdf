import ChatRow from "./ChatRow";

const SideChatBar = ({
  chats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onRenameChat,
  onDeleteChat,
}) => {
  return (
    <aside className=" minimal-scrollbar w-80 min-h-full bg-surface border-r border-border-primary shadow-lg shadow-shadow-modal p-4 flex flex-col">
      <button
        className="cursor-pointer bg-brand-primary hover:bg-brand-hover text-white font-semibold py-3 px-4 rounded-2xl shadow mb-6 transition-colors duration-200"
        onClick={onCreateChat}
      >
        + New Chat
      </button>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {chats.length ? (
          chats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              active={chat.id === activeChatId}
              onSelect={() => onSelectChat(chat.id)}
              onRename={onRenameChat}
              onDelete={onDeleteChat}
            />
          ))
        ) : (
          <div className="text-text-muted text-center mt-10">
            No chats yet. Start a new one!
          </div>
        )}
      </div>
    </aside>
  );
};

export default SideChatBar;
