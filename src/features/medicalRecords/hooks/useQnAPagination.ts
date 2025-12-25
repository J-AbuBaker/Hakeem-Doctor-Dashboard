import { useState, useMemo, useCallback } from 'react';
import { QNA_ITEMS_PER_PAGE, QNA_PAGINATION_THRESHOLD } from '../components/constants';
import { filterQnA } from '../utils/searchUtils';

interface UseQnAPaginationProps {
  questionsAndAnswers: Array<{ question: string; answer: string }>;
  searchQuery: string;
  interviewId: number;
}

export const useQnAPagination = ({
  questionsAndAnswers,
  searchQuery,
  interviewId,
}: UseQnAPaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const filteredQnA = useMemo(() => {
    return filterQnA(questionsAndAnswers, searchQuery);
  }, [questionsAndAnswers, searchQuery]);

  const shouldPaginate = filteredQnA.length > QNA_PAGINATION_THRESHOLD;
  const totalPages = shouldPaginate 
    ? Math.ceil(filteredQnA.length / QNA_ITEMS_PER_PAGE)
    : 1;
  
  const paginatedQnA = useMemo(() => {
    if (!shouldPaginate) return filteredQnA;
    const startIndex = (currentPage - 1) * QNA_ITEMS_PER_PAGE;
    const endIndex = startIndex + QNA_ITEMS_PER_PAGE;
    return filteredQnA.slice(startIndex, endIndex);
  }, [filteredQnA, currentPage, shouldPaginate]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    const qnaSection = document.querySelector(`.qna-content[data-interview-id="${interviewId}"]`);
    if (qnaSection) {
      qnaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [interviewId]);

  const handleSearchChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    filteredQnA,
    paginatedQnA,
    currentPage,
    totalPages,
    shouldPaginate,
    handlePageChange,
    handleSearchChange,
  };
};

