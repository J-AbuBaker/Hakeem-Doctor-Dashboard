import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  items: T[];
  itemsPerPage: number;
  paginationThreshold: number;
}

export const usePagination = <T,>({
  items,
  itemsPerPage,
  paginationThreshold,
}: UsePaginationProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);

  const shouldPaginate = items.length > paginationThreshold;
  const totalPages = shouldPaginate 
    ? Math.ceil(items.length / itemsPerPage)
    : 1;
  
  const paginatedItems = useMemo(() => {
    if (!shouldPaginate) return items;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, shouldPaginate, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    paginatedItems,
    currentPage,
    totalPages,
    shouldPaginate,
    handlePageChange,
    resetPagination,
  };
};

