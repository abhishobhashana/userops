import { api } from "./client";

export type ActivityRange = "7d" | "30d" | "90d" | "12m";

export interface ActivityEvent {
  id: string;
  action: string;
  createdAt: string;
  actor: { id: string; name: string; role: string | null } | null;
  target: { id: string; name: string; role: string | null } | null;
  metadata: { role: string } | null;
}

export interface ActivityPageData {
  events: ActivityEvent[];
  users: Array<{ id: string; name: string; role: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function getActivity(
  page: number,
  limit: number,
  range: ActivityRange,
  userId: string,
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    range,
    userId,
  });
  return api.get<ActivityPageData>(`/api/v1/audit-logs?${query.toString()}`, {
    cache: "no-store",
  });
}
