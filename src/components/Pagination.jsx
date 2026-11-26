import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  page,
  totalItems,
  total,
  pageSize,
  rowsPerPage,
  pageSizeOptions = [10, 15, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  onRowsPerPageChange,
  itemName = 'items',
  disabled = false
}) {
  const activePage = page !== undefined ? page : (currentPage !== undefined ? currentPage : 1);
  const activeTotal = total !== undefined ? total : (totalItems !== undefined ? totalItems : 0);
  const activeSize = pageSize !== undefined ? pageSize : (rowsPerPage !== undefined ? rowsPerPage : 15);
  const handleSizeChange = onPageSizeChange || onRowsPerPageChange;

  const totalPages = Math.max(1, Math.ceil(activeTotal / activeSize));
  const validPage = Math.max(1, Math.min(activePage, totalPages));

  if (activeTotal <= 0 && totalPages <= 1) {
    return null;
  }

  const startItem = activeTotal === 0 ? 0 : (validPage - 1) * activeSize + 1;
  const endItem = Math.min(validPage * activeSize, activeTotal);

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= validPage - delta && i <= validPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="pagination-bar">
      {/* Left: Summary and Per Page Selector */}
      <div className="pagination-meta">
        <span className="tabular-nums">
          Showing <strong style={{ color: '#0f172a' }}>{startItem}</strong> to <strong style={{ color: '#0f172a' }}>{endItem}</strong> of{' '}
          <strong style={{ color: '#0f172a' }}>{activeTotal.toLocaleString()}</strong> {itemName}
        </span>

        {handleSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Per page:</span>
            <select
              value={activeSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                handleSizeChange(newSize);
                if (onPageChange) onPageChange(1);
              }}
              disabled={disabled}
              style={{
                padding: '5px 8px',
                borderRadius: 7,
                border: '1px solid #e2e8f0',
                fontSize: 12.5,
                background: '#f8fafc',
                color: '#0f172a',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange && onPageChange(1)}
          disabled={validPage <= 1 || disabled}
          title="First Page"
          style={{
            minWidth: 30,
            height: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            borderRadius: 7,
            background: '#ffffff',
            color: '#475569',
            cursor: validPage <= 1 || disabled ? 'not-allowed' : 'pointer',
            opacity: validPage <= 1 || disabled ? 0.45 : 1,
            transition: 'all 0.15s'
          }}
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange && onPageChange(validPage - 1)}
          disabled={validPage <= 1 || disabled}
          title="Previous Page"
          style={{
            minWidth: 30,
            height: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            borderRadius: 7,
            background: '#ffffff',
            color: '#475569',
            cursor: validPage <= 1 || disabled ? 'not-allowed' : 'pointer',
            opacity: validPage <= 1 || disabled ? 0.45 : 1,
            transition: 'all 0.15s'
          }}
        >
          <ChevronLeft size={14} />
        </button>

        {getPageNumbers().map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} style={{ padding: '0 6px', color: '#94a3b8', fontSize: 13, userSelect: 'none' }}>
              …
            </span>
          ) : (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange && onPageChange(p)}
              disabled={disabled}
              className="tabular-nums"
              style={{
                minWidth: 30,
                height: 30,
                padding: '0 8px',
                borderRadius: 7,
                border: validPage === p ? '1px solid #059669' : '1px solid #e2e8f0',
                background: validPage === p ? '#059669' : '#ffffff',
                color: validPage === p ? '#ffffff' : '#334155',
                fontSize: 12.5,
                fontWeight: validPage === p ? 700 : 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange && onPageChange(validPage + 1)}
          disabled={validPage >= totalPages || disabled}
          title="Next Page"
          style={{
            minWidth: 30,
            height: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            borderRadius: 7,
            background: '#ffffff',
            color: '#475569',
            cursor: validPage >= totalPages || disabled ? 'not-allowed' : 'pointer',
            opacity: validPage >= totalPages || disabled ? 0.45 : 1,
            transition: 'all 0.15s'
          }}
        >
          <ChevronRight size={14} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange && onPageChange(totalPages)}
          disabled={validPage >= totalPages || disabled}
          title="Last Page"
          style={{
            minWidth: 30,
            height: 30,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            borderRadius: 7,
            background: '#ffffff',
            color: '#475569',
            cursor: validPage >= totalPages || disabled ? 'not-allowed' : 'pointer',
            opacity: validPage >= totalPages || disabled ? 0.45 : 1,
            transition: 'all 0.15s'
          }}
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
