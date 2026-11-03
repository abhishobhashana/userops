import { api } from "./client";

export type AnalyticsRange = "7d" | "30d" | "90d" | "12m";

export type EngagementCategory =
  | "HIGHLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "INACTIVE"
  | "NEVER_LOGGED_IN";

export interface AnalyticsChartItem {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  invitedUsers: number;

  newUsers: number;
  previousNewUsers: number;
  newUsersChange: number;

  successfulLogins: number;
  failedLogins: number;
  loginChange: number;

  auditEvents: number;
}

export interface EngagementMetrics {
  eligibleUsers: number;
  engagedUsers: number;
  inactiveUsers: number;
  neverLoggedInUsers: number;
  engagementRate: number;
}

export interface EngagementRow {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "USER";
  periodLogins: number;
  lastLoginAt: string | null;
  category: EngagementCategory;
}

export interface PersonalAnalytics {
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AnalyticsData {
  range: AnalyticsRange;

  metrics: AnalyticsMetrics;

  userGrowth: AnalyticsChartItem[];
  monthlyRegistrations: AnalyticsChartItem[];

  roles: AnalyticsChartItem[];
  statuses: AnalyticsChartItem[];

  activityDistribution: AnalyticsChartItem[];
  engagementDistribution: AnalyticsChartItem[];

  loginTrends: AnalyticsChartItem[];

  engagement: EngagementMetrics | null;

  engagementUsers: EngagementRow[];

  personal: PersonalAnalytics | null;
}

export const analyticsApi = {
  getAnalytics(range: AnalyticsRange = "30d") {
    const query = new URLSearchParams({ range });

    return api.get<AnalyticsData>(`/api/v1/analytics?${query.toString()}`, {
      cache: "no-store",
    });
  },
};
