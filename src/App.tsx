import { useEffect, useRef, useState, type JSX } from 'react';
import './index.css';

const users = [
  { id: 1, name: 'Alice', lastName: 'Smith' },
  { id: 2, name: 'Bob', lastName: 'Johnson' },
  { id: 3, name: 'Charlie', lastName: 'Brown' },
];

type Mention = {
  id: number;
  start: number;
  end: number;
  userId: number;
  text: string;
};

function App() {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [editingMentionId, setEditingMentionId] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [justSelectedMention, setJustSelectedMention] = useState(false);

  const filteredUser = users.filter((user) =>
    user.name.toLowerCase().includes(query.toLowerCase())
  );

  const isMentionComplete = (mentionText: string): boolean => {
    const mentionWithoutAt = mentionText.slice(1);

    const parts = mentionWithoutAt.split(' ');
    return parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0;
  };

  const handleCursorMove = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
  };

  useEffect(() => {
    if (!inputRef.current) return;

    const mentionUnderCursor = mentions.find(
      (mention) =>
        cursorPosition >= mention.start && cursorPosition <= mention.end
    );

    if (mentionUnderCursor) {
      const userUnderCursor = users.find(
        (u) => u.id === mentionUnderCursor.userId
      );

      if (userUnderCursor) {
        setShowSuggestions(true);
        setQuery(userUnderCursor.name);
        setEditingMentionId(mentionUnderCursor.id);
        setHighlightIndex(0);
      }
    } else {
      setEditingMentionId(null);

      const textUntilCursor = inputRef.current.value.slice(0, cursorPosition);
      const newMentionMatch = textUntilCursor.match(/@(\w*)$/);

      if (newMentionMatch) {
        const charBeforeMatch = newMentionMatch.index
          ? textUntilCursor[newMentionMatch.index - 1]
          : null;

        if (
          (newMentionMatch && charBeforeMatch === ' ') ||
          newMentionMatch?.index === 0
        ) {
          setShowSuggestions(true);
          setQuery(newMentionMatch[1]);
          setHighlightIndex(0);
        }
      } else {
        setShowSuggestions(false);
        setQuery('');
      }
    }
  }, [cursorPosition, mentions]);

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
          id: Date.now() + newMentions.length,
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

    setJustSelectedMention(true);

    if (editingMentionId) {
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

    setTimeout(() => setJustSelectedMention(false), 100);
  };

  const getStyledMessage = () => {
    if (mentions.length === 0) return message;

    let lastIndex = 0;
    const elements: JSX.Element[] = [];

    mentions.forEach((mention, index) => {
      if (mention.start > lastIndex) {
        const textBefore = message.slice(lastIndex, mention.start);
        elements.push(<span key={`text-before-${index}`}>{textBefore}</span>);
      }
      const mentionText = message.slice(mention.start, mention.end);
      const isComplete = isMentionComplete(mentionText);

      elements.push(
        <span
          key={`mention-${mention.id}`}
          className={isComplete ? 'mention-highlight' : ''}
        >
          {mentionText}
        </span>
      );

      lastIndex = mention.end;
    });

    if (lastIndex < message.length) {
      const remainingText = message.slice(lastIndex);
      elements.push(<span key="text-end">{remainingText}</span>);
    }

    return elements;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    setMessage(value);
    setCursorPosition(cursorPos);

    if (editingMentionId) {
      const mentionToEdit = mentions.find((m) => m.id === editingMentionId);
      if (mentionToEdit && cursorPos > mentionToEdit.start) {
        const textUntilCursor = value.slice(0, cursorPos);
        const textAfterAt = textUntilCursor.slice(mentionToEdit.start + 1);
        const currentQuery = textAfterAt.split(' ')[0];
        setQuery(currentQuery);
        setShowSuggestions(true);
        return;
      }
    }

    if (justSelectedMention) return;

    const textUntilCursor = value.slice(0, cursorPos);
    const match = textUntilCursor.match(/@(\w*)$/);

    if (match) {
      const charBeforeMatch = match.index
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
    } else {
      setShowSuggestions(false);
      setQuery('');
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
        onSelect={handleCursorMove}
        onClick={handleCursorMove}
        onKeyUp={handleCursorMove}
        onChange={handleInputChange}
      />

      <div className="mt-4 p-3 bg-gray-200 rounded-lg text-xs">
        <div>Cursor: {cursorPosition}</div>
        <div>Mentions: {JSON.stringify(mentions)}</div>
        <div>Editing: {editingMentionId}</div>
        <div>Query: {query}</div>
        <div>Just Selected: {justSelectedMention ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
}

export default App;
