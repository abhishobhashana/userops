"use client";

import { useMemo } from "react";
import Select from "./select";
import ActionButton from "./action-button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis-start",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  disabled = false,
}: PaginationProps) {
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;

  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;

  const totalPages = Math.ceil(safeTotal / safePageSize);

  const currentPage = Math.min(
    Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1),
    Math.max(totalPages, 1),
  );

  const start = safeTotal === 0 ? 0 : (currentPage - 1) * safePageSize + 1;

  const end = Math.min(currentPage * safePageSize, safeTotal);

  const pages = useMemo(
    () => getPageItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const normalizedPageSizeOptions = useMemo(() => {
    const validOptions = pageSizeOptions
      .filter((size) => Number.isFinite(size) && size > 0)
      .map(Math.floor);

    return [...new Set([...validOptions, safePageSize])].sort((a, b) => a - b);
  }, [pageSizeOptions, safePageSize]);

  const canGoPrevious = !disabled && currentPage > 1;
  const canGoNext = !disabled && currentPage < totalPages;

  const pageButtonClassName = (pageNumber: number) => {
    const isActive = pageNumber === currentPage;

    return [
      "flex min-w-9 items-center justify-center rounded-xl px-4 py-2",
      "text-sm transition-colors duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
      "disabled:cursor-not-allowed disabled:opacity-40",
      isActive
        ? "bg-background-tertiary font-medium text-text"
        : "bg-background-secondary text-text-secondary",
    ].join(" ");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Record information and page size */}
      <div className="flex items-center justify-between text-text-secondary">
        <p aria-live="polite" aria-atomic="true">
          Showing <span className="font-medium text-text">{start}</span>
          {" — "}
          <span className="font-medium text-text">{end}</span>
          {" of "}
          <span className="font-medium text-text">{safeTotal}</span>
          {" records"}
        </p>

        {onPageSizeChange && (
          <div className="w-18">
            <Select
              animation="list"
              className="p-1.5! pl-2.5! h-10!"
              name="pageSize"
              value={String(safePageSize)}
              onChange={(value) => {
                const nextPageSize = Number(value);

                if (Number.isFinite(nextPageSize) && nextPageSize > 0) {
                  onPageSizeChange(nextPageSize);
                }
              }}
              options={normalizedPageSizeOptions.map((size) => ({
                label: String(size),
                value: String(size),
              }))}
              disabled={disabled}
            />
          </div>
        )}
      </div>

      {/* Page numbers */}
      <nav
        aria-label="Pagination"
        className="flex items-center justify-end gap-4"
      >
        <ActionButton
          iconClassName="pr-0.5"
          icon="arrow_back_ios_new"
          label="Previous page"
          disabled={!canGoPrevious}
          onClick={() => onPageChange(currentPage - 1)}
        />

        <div className="flex items-center gap-1.5">
          {pages.map((item) => {
            if (typeof item !== "number") {
              return (
                <span
                  key={item}
                  aria-hidden="true"
                  className="flex h-9 min-w-5 items-center justify-center text-text-quaternary"
                >
                  &hellip;
                </span>
              );
            }

            const isActive = item === currentPage;

            return (
              <button
                key={item}
                type="button"
                aria-label={`Page ${item}`}
                aria-current={isActive ? "page" : undefined}
                disabled={disabled}
                onClick={() => onPageChange(item)}
                className={pageButtonClassName(item)}
              >
                {item}
              </button>
            );
          })}
        </div>

        <ActionButton
          iconClassName="pl-0.5"
          icon="arrow_forward_ios"
          label="Next page"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </nav>
    </div>
  );
}
