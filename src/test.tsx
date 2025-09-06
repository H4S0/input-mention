import { useRef, useState, useEffect } from 'react';
import './index.css';

const users = [
  { id: 1, name: 'Alice', lastName: 'Smith' },
  { id: 2, name: 'Bob', lastName: 'Johnson' },
  { id: 3, name: 'Charlie', lastName: 'Brown' },
  { id: 4, name: 'Hasan', lastName: 'Alic' },
];

interface Mention {
  id: number;
  start: number;
  end: number;
  text: string;
  userId: number;
}

function App() {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [editingMentionId, setEditingMentionId] = useState<number | null>(null);

  const filteredUser = users.filter((user) =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );

  // Track cursor position
  const handleCursorMove = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
  };

  // Check if cursor is on a mention
  useEffect(() => {
    if (!inputRef.current) return;

    // Check if cursor is on any existing mention
    const mentionUnderCursor = mentions.find(
      (mention) =>
        cursorPosition >= mention.start && cursorPosition <= mention.end
    );

    if (mentionUnderCursor) {
      const user = users.find((u) => u.id === mentionUnderCursor.userId);
      if (user) {
        setQuery(user.name);
        setShowSuggestions(true);
        setEditingMentionId(mentionUnderCursor.id);
        setHighlightIndex(0);
      }
    } else {
      setEditingMentionId(null);

      // Only hide if we're not creating a new mention
      const textUntilCursor = inputRef.current.value.slice(0, cursorPosition);
      const newMentionMatch = textUntilCursor.match(/@(\w*)$/);
      if (!newMentionMatch) {
        setShowSuggestions(false);
        setQuery('');
      }
    }
  }, [cursorPosition, mentions]);

  // Update mentions when message changes
  useEffect(() => {
    const newMentions: Mention[] = [];
    const mentionRegex = /@([A-Za-z]+ [A-Za-z]+)/g;
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      const user = users.find(
        (u) =>
          `${u.name} ${u.lastName}`.toLowerCase() === match[1].toLowerCase()
      );

      if (user) {
        newMentions.push({
          id: Date.now() + newMentions.length, // Simple unique ID
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          userId: user.id,
        });
      }
    }

    setMentions(newMentions);
  }, [message]);

  const handleSelectMention = (name: string, lastName: string) => {
    const value = inputRef.current;
    if (!value) return;

    const cursorPos = value.selectionStart || 0;
    const textUntilCursor = value.value.slice(0, cursorPos);

    if (editingMentionId) {
      // Editing existing mention
      const mentionToEdit = mentions.find((m) => m.id === editingMentionId);
      if (mentionToEdit) {
        const textBeforeMention = value.value.slice(0, mentionToEdit.start);
        const textAfterMention = value.value.slice(mentionToEdit.end);

        const newText = `${textBeforeMention}@${name} ${lastName}${textAfterMention}`;
        setMessage(newText);

        const newCursorPosition =
          mentionToEdit.start + name.length + lastName.length + 2;
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(
              newCursorPosition,
              newCursorPosition
            );
            inputRef.current.focus();
          }
        }, 0);
      }
    } else {
      // Creating new mention
      const match = textUntilCursor.match(/@(\w*)$/);
      if (match && match.index !== undefined) {
        const textBeforeMention = textUntilCursor.slice(0, match.index);
        const textAfterCursor = value.value.slice(cursorPos);

        const newText = `${textBeforeMention}@${name} ${lastName} ${textAfterCursor}`;
        setMessage(newText);

        const newCursorPosition =
          textBeforeMention.length + name.length + lastName.length + 3;
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(
              newCursorPosition,
              newCursorPosition
            );
            inputRef.current.focus();
          }
        }, 0);
      }
    }

    setShowSuggestions(false);
    setQuery('');
    setEditingMentionId(null);
  };

  const handleMentionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const filteredUserLength = filteredUser.length;

    if (showSuggestions && filteredUserLength > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % filteredUserLength);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev === 0 ? filteredUserLength - 1 : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredUser[highlightIndex]) {
          handleSelectMention(
            filteredUser[highlightIndex].name,
            filteredUser[highlightIndex].lastName
          );
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setEditingMentionId(null);
      }
    }
  };

  const handleInputChange = () => {
    const value = inputRef.current;
    if (!value) return;
    setMessage(value.value);
    setCursorPosition(value.selectionStart || 0);

    // Check for new mention pattern only if we're not editing an existing mention
    if (!editingMentionId) {
      const cursorPos = value.selectionStart || 0;
      const textUntilCursor = value.value.slice(0, cursorPos);
      const match = textUntilCursor.match(/@(\w*)$/);

      if (match) {
        const charBeforeMatch = match.index
          ? textUntilCursor[match.index - 1]
          : null;

        if ((match && charBeforeMatch === ' ') || match?.index === 0) {
          setShowSuggestions(true);
          setQuery(match[1]);
          setHighlightIndex(0);
        }
      } else {
        setShowSuggestions(false);
        setQuery('');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        User Mention Input
      </h1>

      {showSuggestions && (
        <div className="mb-4 border border-gray-300 rounded-lg bg-white w-52">
          {filteredUser.map((user, index) => (
            <div
              key={user.id}
              className={`cursor-pointer p-2 ${
                index === highlightIndex ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleSelectMention(user.name, user.lastName)}
            >
              {user.name} {user.lastName}
            </div>
          ))}
        </div>
      )}

      <input
        type="text"
        placeholder="Mention someone..."
        className="w-72 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        ref={inputRef}
        value={message}
        onKeyDown={handleMentionKeyDown}
        onChange={handleInputChange}
        onSelect={handleCursorMove}
        onClick={handleCursorMove}
        onKeyUp={handleCursorMove}
      />

      {/* Debug info */}
      <div className="mt-4 p-3 bg-gray-200 rounded-lg text-xs">
        <div>Cursor: {cursorPosition}</div>
        <div>Mentions: {JSON.stringify(mentions)}</div>
        <div>Editing: {editingMentionId}</div>
      </div>
    </div>
  );
}

export default App;
