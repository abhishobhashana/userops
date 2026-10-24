"use client";

import { useCallback, useMemo, useState } from "react";

import { Table } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import type { TableColumn } from "@/components/ui/table";

import Textfield from "../ui/textfield";
import Select, { type SelectOption } from "../ui/select";

import type { UserRow, UserRole, UserStatus } from "@/lib/api/users";

interface UsersProps {
  initialUsers: UserRow[];
}

interface UsersApiResponse {
  success: boolean;
  data?: UserRow[];
  message?: string;
  error?: {
    message?: string;
  };
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

const STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: "bg-green",
  INVITED: "bg-accent",
  SUSPENDED: "bg-red",
};

function Badge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex rounded-xl px-2.5 py-1 font-medium text-white ${className ?? ""}`}
    >
      {label}
    </span>
  );
}

export default function Users({ initialUsers }: UsersProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Refresh users when requested by the user.
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/users", {
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const result: UsersApiResponse = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message ?? result.error?.message ?? "Failed to load users",
        );
      }

      if (!Array.isArray(result.data)) {
        throw new Error("Unexpected users API response format");
      }

      setUsers(result.data);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [
          user.first_name,
          user.last_name,
          user.email,
          user.role,
          user.status,
        ].some((value) => value?.toLowerCase().includes(query));

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const pageUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const roleOptions: SelectOption[] = [
    { label: "All Roles", value: "ALL" },
    ...Object.entries(ROLE_LABELS).map(([value, label]) => ({
      label,
      value,
    })),
  ];

  const statusOptions: SelectOption[] = [
    { label: "All Statuses", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Invited", value: "INVITED" },
    { label: "Suspended", value: "SUSPENDED" },
  ];

  function formatLastLogin(lastLoginAt?: string | null) {
    if (!lastLoginAt) return "Never";

    const date = new Date(lastLoginAt);

    if (Number.isNaN(date.getTime())) return "Unknown";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
      .format(date)
      .replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
  }

  const columns: TableColumn<UserRow>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) =>
        user.first_name && user.last_name ? (
          <p className="text-text font-medium">
            {user.first_name} {user.last_name}
          </p>
        ) : (
          "-"
        ),
    },
    {
      key: "email",
      header: "Email",
      render: (user) => user.email,
      align: "end",
    },
    {
      key: "lastLoginAt",
      header: "Last login",
      render: (user) =>
        user.lastLoginAt ? formatLastLogin(user.lastLoginAt) : "-",
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <p className="uppercase">{ROLE_LABELS[user.role] ?? user.role}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <Badge
          label={user.status}
          className={STATUS_STYLES[user.status] ?? "bg-background-secondary"}
        />
      ),
      align: "end",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section>
          <h1 className="text-3xl font-bold md:text-3xl lg:text-2xl">
            Total users
          </h1>
          <p className="mt-1 text-2xl font-semibold text-text-secondary">
            {users.length}
          </p>
        </section>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="ml-3 font-semibold underline disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      <section className="space-y-6">
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
          <Textfield
            label=""
            aria-label="Search users"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by Name, Email, Role and Status"
            searchable
            clearable
            onClear={() => {
              setSearch("");
              setPage(1);
            }}
          />

          <Select
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            options={roleOptions}
            placeholder="All Roles"
            name="roleFilter"
          />

          <Select
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={statusOptions}
            placeholder="All Statuses"
            name="statusFilter"
          />
        </div>

        <Table
          columns={columns}
          data={pageUsers}
          getRowKey={(user) => user.id}
          loading={loading}
          emptyMessage="No users match your filters."
        />

        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={filteredUsers.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          disabled={loading}
        />
      </section>
    </main>
  );
}
