import { useRef, useState } from 'react';
import './index.css';

const users = [
  { id: 1, name: 'Alice', lastName: 'Smith' },
  { id: 2, name: 'Bob', lastName: 'Johnson' },
  { id: 3, name: 'Charlie', lastName: 'Brown' },
];

function App() {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const filteredUser = users.filter((user) =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectMention = (name: string, lastName: string) => {
    const value = inputRef.current;
    if (!value) return;

    const cursorPosition = value.selectionStart || 0;
    const textUntilCursor = value.value.slice(0, cursorPosition);
    const match = textUntilCursor.match(/@(\w*)$/);

    if (match && match.index !== undefined) {
      const textBeforeMention = textUntilCursor.slice(0, match.index);
      const textAfterCursor = value.value.slice(cursorPosition);

      const newText = `${textBeforeMention}@${name} ${lastName} ${textAfterCursor}`;
      setMessage(newText);

      const newCursorPosition =
        textBeforeMention.length + name.length + lastName.length + 2;
      setTimeout(() => {
        value.setSelectionRange(newCursorPosition, newCursorPosition);
        value.focus();
      }, 0);
    }

    setShowSuggestions(false);
    setQuery('');
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
        onChange={() => {
          const value = inputRef.current;
          if (!value) return;
          setMessage(value.value);

          const cursorPosition = value.selectionStart || 0;
          const textUntilCursor = value.value.slice(0, cursorPosition);
          const match = textUntilCursor.match(/@(\w*)$/);
          const charBeforeMatch = match?.index
            ? textUntilCursor[match.index - 1]
            : null;

          if ((match && charBeforeMatch === ' ') || match?.index === 0) {
            setShowSuggestions(true);
            setQuery(match[1]);
            setHighlightIndex(0);
          } else {
            setShowSuggestions(false);
            setQuery('');
          }
        }}
      />
    </div>
  );
}

export default App;
