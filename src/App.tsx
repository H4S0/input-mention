import type { JSX } from 'react';
import { useMentions } from './hook/use-mentions';

const users = [
  { id: 1, name: 'Alice', lastName: 'Smith' },
  { id: 2, name: 'Bob', lastName: 'Johnson' },
  { id: 3, name: 'Charlie', lastName: 'Brown' },
];

function App() {
  const {
    message,
    mentions,
    inputRef,
    showSuggestions,
    query,
    filteredUser,
    highlightIndex,
    cursorPosition,
    editingMentionId,
    justSelectedMention,
    handleSelectMention,
    handleMentionKeyDown,
    handleInputChange,
    handleCursorMove,
    isMentionComplete,
  } = useMentions(users);

  const getStyledMessage = () => {
    if (mentions.length === 0) return message;
    let lastIndex = 0;
    const elements: JSX.Element[] = [];

    mentions.forEach((mention, index) => {
      if (mention.start > lastIndex) {
        elements.push(
          <span key={`text-before-${index}`}>
            {message.slice(lastIndex, mention.start)}
          </span>
        );
      }
      const mentionText = message.slice(mention.start, mention.end);
      const isComplete = isMentionComplete(mentionText);

      elements.push(
        <span
          key={`mention-${mention.id}`}
          className={isComplete ? 'bg-blue-200 px-1 rounded' : ''}
        >
          {mentionText}
        </span>
      );

      lastIndex = mention.end;
    });

    if (lastIndex < message.length) {
      elements.push(<span key="text-end">{message.slice(lastIndex)}</span>);
    }

    return elements;
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

      <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border min-h-16">
        <div className="text-sm text-gray-600 mb-2">Preview:</div>
        <div className="text-sm">{getStyledMessage()}</div>
      </div>

      <div className="mt-4 p-3 bg-gray-200 rounded-lg text-xs space-y-1">
        <div>Cursor: {cursorPosition}</div>
        <div>Mentions: {JSON.stringify(mentions)}</div>
        <div>Editing: {editingMentionId}</div>
        <div>Query: "{query}"</div>
        <div>Just Selected: {justSelectedMention ? 'Yes' : 'No'}</div>
        <div>Show Suggestions: {showSuggestions ? 'Yes' : 'No'}</div>
      </div>
    </div>
  );
}

export default App;
