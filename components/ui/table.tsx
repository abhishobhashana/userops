"use client";

import type { ReactNode } from "react";
import Loader from "./loader";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "start" | "center" | "end";
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  rowClassName?: string;
}

export function Table<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  emptyMessage = "No records found.",
  rowClassName = "",
}: TableProps<T>) {
  return (
    <div className="w-full max-w-7xl overflow-x-auto rounded-3xl bg-background-secondary p-3 pt-0">
      <table className="w-full max-w-7xl overflow-x-auto border-collapse text-left">
        <thead className="bg-background-secondary relative after:absolute after:bottom-0 after:-left-3 after:-right-3 after:h-px after:bg-border">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key}
                scope="col"
                className={`relative whitespace-nowrap px-3 py-2.5 ${index === 0 ? "font-semibold text-text" : "font-medium text-text-secondary"} after:absolute after:content-[''] ${index !== columns.length - 1 ? "after:right-0 after:top-2 after:bottom-2 after:w-px after:bg-border" : ""} ${column.headerClassName ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr aria-hidden="true">
            <td colSpan={columns.length} className="h-1 p-0" />
          </tr>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-2.5 py-18 text-center text-text-tertiary"
              >
                <Loader size="md" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-2.5 py-18 text-center text-text-tertiary"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={getRowKey(row)}
                className={`transition-colors odd:bg-background-tertiary ${rowClassName}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap first:rounded-l-xl last:rounded-r-xl px-3 py-1.5 text-text-secondary ${
                      column.align === "end"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : "text-left"
                    } ${column.className ?? ""}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
