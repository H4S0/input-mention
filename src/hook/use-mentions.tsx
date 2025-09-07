import { useEffect, useRef, useState } from 'react';

type User = {
  id: number;
  name: string;
  lastName: string;
};

type Mention = {
  id: number;
  start: number;
  end: number;
  userId: number;
  text: string;
};

export function useMentions(users: User[]) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [editingMentionId, setEditingMentionId] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [justSelectedMention, setJustSelectedMention] = useState(false);

  const filteredUser = users.filter((user) => {
    const fullName = `${user.name} ${user.lastName}`.toLowerCase();
    return fullName.includes(query.toLowerCase());
  });

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
      const newMentionMatch = textUntilCursor.match(
        /@([A-Za-z]*(?:\s[A-Za-z]*)?)$/
      );

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
  }, [cursorPosition, mentions, users]);

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
  }, [message, users]);

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
          inputRef.current?.setSelectionRange(
            newCursorPosition,
            newCursorPosition
          );
          inputRef.current?.focus();
        }, 0);
      }
    } else {
      const match = textUntilCursor.match(/@([A-Za-z]*(?:\s[A-Za-z]*)?)$/);
      if (match && match.index !== undefined) {
        const textBeforeMention = textUntilCursor.slice(0, match.index);
        const textAfterCursor = value.value.slice(cursorPos);

        const newText = `${textBeforeMention}@${name} ${lastName} ${textAfterCursor}`;
        setMessage(newText);

        const newCursorPosition =
          textBeforeMention.length + name.length + lastName.length + 3;
        setTimeout(() => {
          inputRef.current?.setSelectionRange(
            newCursorPosition,
            newCursorPosition
          );
          inputRef.current?.focus();
        }, 0);
      }
    }

    setShowSuggestions(false);
    setQuery('');
    setEditingMentionId(null);

    setTimeout(() => setJustSelectedMention(false), 100);
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
    const match = textUntilCursor.match(/@([A-Za-z]*(?:\s[A-Za-z]*)?)$/);

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

  return {
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
    setMessage,
    handleSelectMention,
    handleMentionKeyDown,
    handleInputChange,
    handleCursorMove,
    isMentionComplete,
  };
}
