import React from 'react';

/**
 * Reusable Pagination component.
 *
 * @param {object} props - Component props.
 * @param {number} props.page - The current page number.
 * @param {number} props.totalPages - The total number of pages.
 * @param {number} props.pageSize - The number of items per page.
 * @param {function(number): void} props.setPage - Function to set the current page.
 * @param {function(number): void} props.setPageSize - Function to set the items per page.
 * @param {string} props.jumpToPage - The value of the "jump to page" input.
 * @param {function(string): void} props.setJumpToPage - Function to set the "jump to page" input value.
 * @param {function(Event): void} props.handleJumpToPage - Function to handle submitting "jump to page".
 */
function Pagination({
  page,
  totalPages,
  pageSize,
  setPage,
  setPageSize,
  jumpToPage,
  setJumpToPage,
  handleJumpToPage,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center mt-10 gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Items per page:</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1); // Reset to first page when page size changes
          }}
          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 bg-white text-sm"
        >
          <option value={12}>12</option>
          <option value={20}>20</option>
          <option value={32}>32</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Previous
        </button>
        <span className="text-gray-700 font-medium text-sm">
          Page {page} of {totalPages}
        </span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Next
        </button>
      </div>

      <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Go to page:</span>
        <input type="number" value={jumpToPage} onChange={(e) => setJumpToPage(e.target.value)} onBlur={() => { if (jumpToPage === '') setJumpToPage(page.toString()) }} className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500" min="1" max={totalPages} />
        <button type="submit" className="px-3 py-1 border rounded bg-white hover:bg-gray-50 text-sm">Go</button>
      </form>
    </div>
  );
}

export default Pagination;