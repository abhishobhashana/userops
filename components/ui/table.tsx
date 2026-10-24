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
    <div className="w-full max-w-7xl overflow-x-auto rounded-3xl bg-background-secondary px-3 py-1">
      <table className="w-full max-w-7xl overflow-x-auto border-collapse text-left">
        <thead className="bg-background-secondary border-b border-border">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-2.5 py-1.5 font-medium text-text-tertiary ${
                  column.align === "end"
                    ? "text-right"
                    : column.align === "center"
                      ? "text-center"
                      : "text-left"
                } ${column.headerClassName ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
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
                className={`transition-colors even:bg-background-tertiary ${rowClassName}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap first:rounded-l-xl last:rounded-r-xl px-2.5 py-1.5 text-text-secondary ${
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
