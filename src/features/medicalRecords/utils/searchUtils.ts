import React from 'react';

export const highlightMatch = (
  text: string, 
  query: string, 
  highlightClassName: string = 'qna-search-highlight'
): React.ReactNode => {
  if (!query.trim()) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (regex.test(part)) {
      return React.createElement('mark', { key: index, className: highlightClassName }, part);
    }
    return part;
  });
};

export const filterQnA = (
  questionsAndAnswers: Array<{ question: string; answer: string }>,
  searchQuery: string
): Array<{ question: string; answer: string }> => {
  if (!searchQuery.trim()) return questionsAndAnswers;
  const query = searchQuery.toLowerCase();
  return questionsAndAnswers.filter(qa => 
    qa.question.toLowerCase().includes(query) || 
    qa.answer.toLowerCase().includes(query)
  );
};

