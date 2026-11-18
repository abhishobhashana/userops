"use client";

import { useCallback, useEffect, useState } from "react";

import Header from "@/components/ui/header";
import Select from "@/components/ui/select";
import Loader from "@/components/ui/loader";
import ActivityTimeline from "@/components/ui/activity-timeline";
import { Pagination } from "@/components/ui/pagination";

import {
  getActivity,
  type ActivityEvent,
  type ActivityPageData,
  type ActivityRange,
} from "@/lib/api/activity";
import type { UserRole } from "@/lib/auth/types";
import PageAnimation from "../ui/page-animation";
import { useAppSelector } from "@/lib/hooks";

const ranges = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last 12 months", value: "12m" },
];

export default function Activity({ role }: { role: UserRole }) {
  const isSidebarOpen = useAppSelector((state) => state.sidebar.sidebarOpen);

  const [range, setRange] = useState<ActivityRange>("30d");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [users, setUsers] = useState<ActivityPageData["users"]>([]);
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getActivity(page, pageSize, range, selectedUser);
      setEvents(result.events);
      setUsers(result.users);
      setTotal(result.pagination.total);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load activity.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, range, selectedUser]);

  useEffect(() => {
    let cancelled = false;

    getActivity(page, pageSize, range, selectedUser)
      .then((result) => {
        if (cancelled) return;
        setEvents(result.events);
        setUsers(result.users);
        setTotal(result.pagination.total);
        setError("");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof Error ? cause.message : "Unable to load activity.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, range, selectedUser]);

  const roleTitle: Record<UserRole, string> = {
    SUPER_ADMIN: "Platform Activity",
    ADMIN: "Team Activity",
    MANAGER: "Assigned User Activity",
    USER: "My Activity",
  };

  return (
    <main className="space-y-6">
      <Header
        title="Activity"
        subtitle={`${total.toLocaleString()} — Activities`}
      >
        {role !== "USER" && (
          <Select
            animation="list"
            value={selectedUser}
            onChange={(value) => {
              setLoading(true);
              setSelectedUser(value);
              setPage(1);
            }}
            options={[
              { label: "All users", value: "ALL" },
              ...users.map((user) => ({
                label: `${user.name} · ${user.role.replaceAll("_", " ")}`,
                value: user.id,
              })),
            ]}
            placeholder="All users"
            name="activityUser"
            className={`liquid-glass hidden ${isSidebarOpen ? "md:hidden" : "md:flex"} lg:flex`}
            optionsClassName="w-92! backdrop-blur-sm!"
          />
        )}

        <Select
          animation="list"
          value={range}
          onChange={(value) => {
            setLoading(true);
            setRange(value as ActivityRange);
            setPage(1);
          }}
          options={ranges}
          placeholder="Select period"
          name="activityRange"
          className="liquid-glass"
          optionsClassName="w-42!"
        />
      </Header>

      <section className="mx-auto w-full max-w-3xl">
        <PageAnimation>
          {error && events.length === 0 ? (
            <div
              role="alert"
              className="rounded-2xl bg-background-secondary p-6 text-center"
            >
              <p className="text-sm text-red">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  void loadActivity();
                }}
                className="mt-3 text-sm font-semibold text-accent"
              >
                Try again
              </button>
            </div>
          ) : loading && events.length === 0 ? (
            <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
              <Loader size="md" />
            </div>
          ) : loading && events.length > 0 ? (
            <div
              className="pointer-events-none h-[calc(100vh-10rem)] w-full flex items-center justify-center"
              aria-label="Updating activity"
            >
              <Loader size="md" />
            </div>
          ) : (
            <div className="relative space-y-8">
              <div
                className={`transition-opacity duration-300 ease-out ${loading ? "pointer-events-none opacity-50" : "opacity-100"}`}
              >
                <div className="flex items-end justify-between mb-2">
                  <h2 className="px-4 font-semibold text-text-secondary">
                    {roleTitle[role]}
                  </h2>

                  {role !== "USER" && (
                    <Select
                      animation="list"
                      value={selectedUser}
                      onChange={(value) => {
                        setLoading(true);
                        setSelectedUser(value);
                        setPage(1);
                      }}
                      options={[
                        { label: "All Users", value: "ALL" },
                        ...users.map((user) => ({
                          label: `${user.name} — ${user.role.replaceAll("_", " ")}`,
                          value: user.id,
                        })),
                      ]}
                      placeholder="All users"
                      name="activityUser"
                      className={`liquid-glass flex ${isSidebarOpen ? "md:flex" : "md:hidden"} lg:hidden`}
                      optionsClassName="w-92! backdrop-blur-sm!"
                    />
                  )}
                </div>

                <ActivityTimeline
                  events={events}
                  isSidebarOpen={isSidebarOpen}
                />
              </div>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red">
                  {error}
                </p>
              )}

              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(nextPage) => {
                  setLoading(true);
                  setPage(nextPage);

                  setTimeout(() => {
                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }, 300);
                }}
                onPageSizeChange={(size) => {
                  setLoading(true);
                  setPageSize(size);
                  setPage(1);
                }}
                disabled={loading}
              />
            </div>
          )}
        </PageAnimation>
      </section>
    </main>
  );
}
