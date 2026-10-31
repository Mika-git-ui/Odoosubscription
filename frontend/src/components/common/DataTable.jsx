import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, Search } from 'lucide-react';
import LoadingSpinner, { TableSkeleton } from './LoadingSpinner';
import EmptyState from './EmptyState';
import ErrorMessage from './ErrorMessage';

/**
 * Reusable Enterprise Data Table Component
 * Features:
 * - Backend pagination controls
 * - Search input
 * - Dynamic columns with custom cell rendering
 * - Loading, Error, and Empty state handling
 * - Responsive horizontal scrolling container
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry = null,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your current filter criteria.',
  onEmptyAction = null,
  emptyActionLabel = null,
  // Pagination Props
  pagination = {
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 1,
  },
  onPageChange = null,
  // Search Props
  searchTerm = '',
  onSearchChange = null,
  searchPlaceholder = 'Search records...',
  // Extra Header Actions
  headerActions = null,
}) => {
  const { page = 1, page_size = 20, total = 0, total_pages = 1 } = pagination;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Table Toolbar */}
      {(onSearchChange || headerActions) && (
        <div
          style={{
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          {onSearchChange && (
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-control"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ paddingLeft: '2rem' }}
              />
            </div>
          )}

          {headerActions && <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>{headerActions}</div>}
        </div>
      )}

      {/* Main Table Content */}
      {error ? (
        <div style={{ padding: '1.5rem' }}>
          <ErrorMessage message={error} onRetry={onRetry} />
        </div>
      ) : loading ? (
        <TableSkeleton rows={page_size > 10 ? 10 : page_size} cols={columns.length} />
      ) : data.length === 0 ? (
        <div style={{ padding: '2rem' }}>
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      ) : (
        <div className="table-responsive" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={col.key || idx} style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>{col.header}</span>
                      {col.sortable && <ArrowUpDown size={12} style={{ opacity: 0.6 }} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={col.key || colIdx} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Pagination Footer */}
      {!loading && !error && data.length > 0 && onPageChange && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-surface-alt)',
          }}
        >
          <div>
            Showing <span className="num-tabular font-medium">{Math.min((page - 1) * page_size + 1, total)}</span> to{' '}
            <span className="num-tabular font-medium">{Math.min(page * page_size, total)}</span> of{' '}
            <span className="num-tabular font-medium">{total}</span> records
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="num-tabular">
              Page {page} of {total_pages || 1}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous Page"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={page >= total_pages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next Page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

