
import React from 'react';
import ThemeButton from "../../components/Theme/dynamicButton";


type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Convert to 1-based indexing for display
  const currentPageDisplay = currentPage + 1;
  
  const pagesAroundCurrent = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      let pageNum;
      if (totalPages <= 5) {
        pageNum = i + 1;
      } else if (currentPageDisplay <= 3) {
        pageNum = i + 1;
      } else if (currentPageDisplay > totalPages - 2) {
        pageNum = totalPages - 4 + i;
      } else {
        pageNum = currentPageDisplay - 2 + i;
      }
      return pageNum;
    }
  );

  return (
    <div className="flex justify-between items-center w-full mt-6">
      {/* Left: Previous Button */}
      <div>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium shadow-sm transition-all duration-600 ease-in-out hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:border-blue-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 disabled:hover:scale-100"
          style={{ minWidth: "100px", height: "40px" }}
        >
          <i className="ni ni-arrow-left"></i>
          <span>Previous</span>
        </button>
      </div>

      {/* Center: Page Numbers */}
      <div className="flex items-center gap-1">
        {/* First page + ellipsis */}
        {currentPageDisplay > 3 && totalPages > 5 && (
          <>
            <button
              onClick={() => onPageChange(0)}
              className="w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center border border-gray-300 bg-white text-gray-700 shadow-sm transition-all duration-600 ease-in-out hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:border-blue-300 hover:shadow-md hover:scale-105"
            >
              1
            </button>
            <span className="px-2 text-gray-400 font-medium">...</span>
          </>
        )}

        {/* Page numbers around current */}
        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page - 1)}
            className={`w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center border shadow-sm transition-all duration-300 ease-in-out relative ${
              currentPageDisplay === page
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg transform scale-110 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:border-blue-300 hover:shadow-md hover:scale-105"
            }`}
            style={{
              ...(currentPageDisplay === page && {
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4), 0 0 0 3px rgba(59, 130, 246, 0.1)',
                animation: 'pulse 2s infinite'
              })
            }}
          >
            {page}
            {currentPageDisplay === page && (
              <div className="absolute inset-0 rounded-lg bg-white opacity-20 animate-ping"></div>
            )}
          </button>
        ))}

        {/* Last page + ellipsis */}
        {currentPageDisplay < totalPages - 2 && totalPages > 5 && (
          <>
            <span className="px-2 text-gray-400 font-medium">...</span>
            <button
              onClick={() => onPageChange(totalPages - 1)}
              className="w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center border border-gray-300 bg-white text-gray-700 shadow-sm transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:border-blue-300 hover:shadow-md hover:scale-105"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      {/* Right: Next Button */}
      <div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium shadow-sm transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:border-blue-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 disabled:hover:scale-100"
          style={{ minWidth: "100px", height: "40px" }}
        >
          <span>Next</span>
          <i className="ni ni-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
