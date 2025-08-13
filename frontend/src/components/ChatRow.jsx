import { useState, useRef, useEffect } from "react";
import { PencilIcon, TrashIcon } from "../utils/Icons";

const ChatRow = ({ chat, active, onSelect, onRename, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title || "New Chat");
  const inputRef = useRef(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  // Handle input change
  const handleTitleChange = (e) => setTitle(e.target.value);

  // Save the new title, call onRename if changed & valid
  const saveTitle = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitle(chat.title); // Revert to old title if empty
    } else if (trimmedTitle !== chat.title) {
      try {
        await onRename(chat.id, trimmedTitle);
      } catch (err) {
        console.error("Rename failed", err);
        setTitle(chat.title);
      }
    }
    setIsEditing(false);
  };

  // Handle keyboard in input: Enter saves, Escape cancels
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      saveTitle();
    } else if (e.key === "Escape") {
      setTitle(chat.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between cursor-pointer px-4 py-3 rounded-xl transition-colors duration-200 ${
        active
          ? "bg-brand-primary text-white shadow"
          : "bg-surface hover:bg-surface-hover text-text-primary"
      }`}
      onClick={() => !isEditing && onSelect()}
      title={chat.title}
    >
      <div className="flex-1 pr-2">
        {isEditing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={handleTitleChange}
            onBlur={saveTitle}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border border-border-primary rounded px-2 py-1 text-text-primary focus:outline-none"
            maxLength={50}
          />
        ) : (
          <span className="truncate font-medium select-none">
            {chat.title || "Untitled Chat"}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2 pl-2">
        {!isEditing && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              aria-label="Edit chat title"
              className="p-1 rounded hover:bg-brand-primary/20 transition-colors"
              type="button"
            >
              <PencilIcon className="w-5 h-5" />
            </button>

            <button
              onClick={async (e) => {
                e.stopPropagation();
                {
                  try {
                    await onDelete(chat.id);
                  } catch (error) {
                    console.error("Delete failed", error);
                  }
                }
              }}
              aria-label="Delete chat"
              className="p-1 rounded hover:bg-red-600/20 transition-colors"
              type="button"
            >
              <TrashIcon className="w-5 h-5 text-red-600 " />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatRow;
