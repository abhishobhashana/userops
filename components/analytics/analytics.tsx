"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

import type { ReactNode } from "react";

import Header from "../ui/header";
import BarChart from "../ui/bar-chart";
import LineChart from "../ui/line-chart";
import PieChart from "../ui/pie-chart";
import Select from "../ui/select";
import { Table, type TableColumn } from "../ui/table";

import type { AnalyticsData, AnalyticsRange } from "@/lib/api/analytics";

import type { UserRole } from "@/lib/auth/types";
import { useAppSelector } from "@/lib/hooks";

const ranges = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last 12 months", value: "12m" },
];

const MANAGEMENT_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function MetricCard({
  title,
  value,
  subtitle,
  bgColor = "bg-background-secondary",
  valueTextColor = "text-text",
}: {
  title: string;
  value: number | string;
  subtitle: string;
  bgColor?: string;
  valueTextColor?: string;
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-4 rounded-3xl ${bgColor} p-4`}
    >
      <div className="min-w-0">
        <h3 className="font-semibold">{title}</h3>

        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      </div>

      <p className={`shrink-0 text-3xl font-semibold ${valueTextColor}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function ChartSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl">
      <h4 className="mb-2 px-4 font-semibold text-text-secondary">{title}</h4>

      <div className="min-h-80 rounded-3xl bg-background-secondary">
        {children}
      </div>
      <p className="mt-1 px-4 text-sm font-medium text-text-tertiary">
        {description}
      </p>
    </section>
  );
}

interface EngagementSummaryRow {
  category: string;
  accounts: number;
  definition: string;
}

const engagementColumns: TableColumn<EngagementSummaryRow>[] = [
  { key: "category", header: "Engagement", render: (row) => row.category },
  {
    key: "accounts",
    header: "Accounts",
    align: "end",
    render: (row) => row.accounts.toLocaleString(),
  },
  {
    key: "definition",
    header: "Classification",
    render: (row) => row.definition,
  },
];

interface AnalyticsProps {
  analytics: AnalyticsData;
  role: UserRole;
  range: AnalyticsRange;
}

export default function Analytics({ analytics, role, range }: AnalyticsProps) {
  const router = useRouter();

  const isSidebarOpen = useAppSelector((state) => state.sidebar.sidebarOpen);

  const isUser = role === "USER";
  const isSuperAdmin = role === "SUPER_ADMIN";
  const hasTeamAnalytics = role !== null && role !== "USER";

  const canViewManagement = role !== null && MANAGEMENT_ROLES.includes(role);

  const metrics = analytics.metrics;
  const personal = analytics.personal;

  const roleData = useMemo(
    () =>
      analytics.roles.map((item) => ({
        ...item,
        label: formatLabel(item.label),
      })),
    [analytics.roles],
  );

  const statusData = useMemo(
    () =>
      analytics.statuses.map((item) => ({
        ...item,
        label: formatLabel(item.label),
      })),
    [analytics.statuses],
  );

  const activityData = useMemo(
    () =>
      analytics.activityDistribution.map((item) => ({
        ...item,
        label: formatLabel(item.label),
      })),
    [analytics.activityDistribution],
  );

  const engagementData = useMemo(
    () =>
      analytics.engagementDistribution.map((item) => ({
        ...item,
        label: formatLabel(item.label),
      })),
    [analytics.engagementDistribution],
  );

  const engagementRows: EngagementSummaryRow[] = useMemo(() => {
    const descriptions: Record<string, string> = {
      "Highly Active": "10 or more successful logins",
      "Moderately Active": "3 to 9 successful logins",
      Inactive: "Fewer than 3 successful logins",
      "Never Logged In": "No recorded login",
    };
    return engagementData.map((item) => ({
      category: item.label,
      accounts: item.value,
      definition:
        descriptions[item.label] ?? "Based on recorded login activity",
    }));
  }, [engagementData]);

  const selectedRangeLabel =
    ranges.find((item) => item.value === range)?.label ?? "Selected period";

  return (
    <main className="space-y-8">
      <Header title="Analytics">
        <Select
          value={range}
          onChange={(value) => {
            const params = new URLSearchParams(window.location.search);
            params.set("range", value);
            router.push(`?${params.toString()}`);
          }}
          options={ranges}
          placeholder="Select Period"
          name="analyticsRange"
          className="liquid-glass"
          optionsClassName="w-42!"
        />
      </Header>

      <section className="mx-auto w-full max-w-7xl space-y-7">
        {metrics && isUser && personal && (
          <div>
            <h3 className="mb-3 px-1 font-semibold text-text-secondary">
              My Account Analytics
            </h3>
            <div
              className={`grid grid-cols-1 ${isSidebarOpen ? "md:grid-cols-1" : "md:grid-cols-2"} lg:grid-cols-4 gap-6`}
            >
              <MetricCard
                title="Account Role"
                value={formatLabel(personal.role)}
                subtitle="Assigned access level"
              />
              <MetricCard
                title="Account Status"
                value={formatLabel(personal.status)}
                subtitle="Current account state"
              />
              <MetricCard
                title="Successful Logins"
                value={metrics.successfulLogins}
                subtitle="Success state"
                valueTextColor="text-green"
              />
              <MetricCard
                title="Audit Events"
                value={metrics.auditEvents}
                subtitle="Actions recorded"
              />
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
              <LineChart
                title={`My Login Trend · ${selectedRangeLabel}`}
                data={analytics.loginTrends}
                color="var(--color-accent)"
                height={280}
                gradientOpacity={0.3}
                curve
              />
              {activityData.length > 0 && (
                <BarChart
                  title={`My Activity by Type · ${selectedRangeLabel}`}
                  data={activityData}
                  color="var(--color-yellow)"
                  height={280}
                />
              )}
            </div>
          </div>
        )}

        {metrics && hasTeamAnalytics && (
          <>
            {/* PLATFORM OVERVIEW */}
            {hasTeamAnalytics && (
              <>
                <div>
                  <h3 className="mb-2 px-4 font-semibold text-text-secondary">
                    {isSuperAdmin ? "Platform Overview" : "Team Overview"}
                  </h3>

                  <div
                    className={`grid ${isSidebarOpen ? "md:grid-cols-1" : "md:grid-cols-2"} grid-cols-1 gap-6 lg:grid-cols-4`}
                  >
                    <MetricCard
                      title="Total Users"
                      value={metrics.totalUsers}
                      subtitle="All registered accounts"
                    />

                    <MetricCard
                      title="Active Users"
                      value={metrics.activeUsers}
                      subtitle="Currently active accounts"
                      valueTextColor="text-green"
                    />

                    <MetricCard
                      title="New Users"
                      value={metrics.newUsers}
                      subtitle={`${metrics.newUsersChange >= 0 ? "+" : ""}${metrics.newUsersChange}% vs previous period`}
                      valueTextColor="text-blue"
                    />

                    <MetricCard
                      title="Audit Events"
                      value={metrics.auditEvents}
                      subtitle="Recorded operational events"
                    />
                  </div>
                </div>

                {/* USER GROWTH */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <LineChart
                    title={`Cumulative Registrations · ${selectedRangeLabel}`}
                    data={analytics.userGrowth}
                    color="var(--color-accent)"
                    height={280}
                    gradientOpacity={0.3}
                    curve
                  />

                  <BarChart
                    title={`New Registrations · ${selectedRangeLabel}`}
                    data={analytics.monthlyRegistrations}
                    color="var(--color-green)"
                    height={280}
                  />
                </div>

                {/* USER DISTRIBUTION */}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <PieChart
                    isSidebarOpen={isSidebarOpen}
                    title="Role Distribution"
                    data={roleData}
                    size={260}
                    showLegend
                    showPercentage
                    showTotal
                  />

                  <PieChart
                    isSidebarOpen={isSidebarOpen}
                    title="Account Status"
                    data={statusData}
                    size={260}
                    showLegend
                    showPercentage
                    showTotal
                  />
                </div>
              </>
            )}

            {/* LOGIN ACTIVITY */}
            <div className="grid grid-cols-1">
              <LineChart
                title={`Login Trends · ${selectedRangeLabel}`}
                data={analytics.loginTrends}
                color="var(--color-accent)"
                height={280}
                gradientOpacity={0.3}
                curve
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {activityData.length > 0 && (
                <PieChart
                  isSidebarOpen={isSidebarOpen}
                  title={`Audit Activity Mix · ${selectedRangeLabel}`}
                  data={activityData}
                  size={260}
                  showLegend
                  showPercentage
                  showTotal
                />
              )}

              {/* USER ENGAGEMENT OVERVIEW */}
              {canViewManagement && (
                <>
                  <ChartSection
                    title="Engagement Summary"
                    description="Accounts classified by login activity during the selected period."
                  >
                    <Table
                      columns={engagementColumns}
                      data={engagementRows}
                      getRowKey={(row) => row.category}
                      emptyMessage="No engagement data available."
                    />
                  </ChartSection>
                </>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
