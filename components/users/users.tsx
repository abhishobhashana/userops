"use client";

import { useMemo, useState } from "react";

import { Table } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import type { TableColumn } from "@/components/ui/table";

import Textfield from "../ui/textfield";
import Select, { type SelectOption } from "../ui/select";

import type { UserRow, UserRole, UserStatus } from "@/lib/api/users";
import Header from "../ui/header";
import ActionButton from "../ui/action-button";

interface UsersProps {
  initialUsers: UserRow[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

const STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: "text-green",
  INVITED: "text-accent",
  SUSPENDED: "text-red",
};

export default function Users({ initialUsers }: UsersProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const roleIcons: Record<string, string> = {
    SUPER_ADMIN: "admin_panel_settings",
    ADMIN: "shield_person",
    MANAGER: "badge",
    USER: "person",
  };

  const roleOptions: SelectOption[] = [
    {
      label: "All Roles",
      value: "ALL",
      icon: "groups",
    },
    ...Object.entries(ROLE_LABELS).map(([value, label]) => ({
      label,
      value,
      icon: roleIcons[value as keyof typeof ROLE_LABELS],
    })),
  ];

  const statusOptions: SelectOption[] = [
    { label: "All Statuses", value: "ALL", icon: "person" },
    { label: "Active", value: "ACTIVE", icon: "person_check" },
    { label: "Invited", value: "INVITED", icon: "person_add" },
    { label: "Suspended", value: "SUSPENDED", icon: "person_off" },
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
          "—"
        ),
    },
    {
      key: "email",
      header: "Email",
      render: (user) => user.email,
    },
    {
      key: "lastLoginAt",
      header: "Date Last login",
      render: (user) =>
        user.lastLoginAt ? formatLastLogin(user.lastLoginAt) : "—",
    },
    {
      key: "role",
      header: "Role",
      render: (user) => <p>{ROLE_LABELS[user.role] ?? user.role}</p>,
      align: "end",
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <p
          className={`${STATUS_STYLES[user.status] ?? "text-text-secondary"} font-medium capitalize`}
        >
          {user.status.charAt(0).toUpperCase() +
            user.status.slice(1).toLowerCase()}
        </p>
      ),
    },
  ];

  const hasActiveFilters =
    search.trim() !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  };

  return (
    <main className="space-y-8">
      <Header title="Users" subtitle={`${users.length} — Users`}>
        <ActionButton
          icon="add_2"
          label="Add User"
          onClick={() => {}}
          disabled
        />
      </Header>

      <section className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex justify-between gap-2.5">
          <Textfield
            label=""
            aria-label="Search users"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search"
            searchable
            clearable
            onClear={() => {
              setSearch("");
              setPage(1);
            }}
            className="liquid-glass"
          />

          <div className="flex gap-2.5">
            <Select
              value={roleFilter}
              onChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
              options={roleOptions}
              placeholder="All Roles"
              name="roleFilter"
              iconOnly
              iconActiveBackground
              className="w-12! liquid-glass"
              optionsClassName="w-52!"
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
              iconOnly
              iconActiveBackground
              className="w-12! liquid-glass"
              optionsClassName="w-52!"
            />

            {hasActiveFilters && (
              <ActionButton
                icon="close"
                label="Clear all filters"
                size={28}
                onClick={clearFilters}
              />
            )}
          </div>
        </div>

        <Table
          columns={columns}
          data={pageUsers}
          getRowKey={(user) => user.id}
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
        />
      </section>
    </main>
  );
}
