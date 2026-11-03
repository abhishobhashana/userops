import "server-only";

import { connectDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import AuditLog from "@/models/AuditLog";
import type { UserRole } from "@/lib/auth/types";
import mongoose from "mongoose";

type AnalyticsRange = "7d" | "30d" | "90d" | "12m";

type EngagementCategory =
  | "HIGHLY_ACTIVE"
  | "MODERATELY_ACTIVE"
  | "INACTIVE"
  | "NEVER_LOGGED_IN";

interface ChartItem {
  label: string;
  value: number;
  [key: string]: string | number;
}

interface DateRange {
  currentStart: Date;
  previousStart: Date;
  end: Date;
  days: number;
}

const MANAGER_ROLES: UserRole[] = ["MANAGER"];

function getRange(value: string | null): AnalyticsRange {
  if (value === "7d" || value === "30d" || value === "90d" || value === "12m") {
    return value;
  }

  return "30d";
}

function getDateRange(range: AnalyticsRange): DateRange {
  const end = new Date();
  const currentStart = new Date(end);
  const previousStart = new Date(end);

  let days = 30;

  switch (range) {
    case "7d":
      days = 7;
      break;
    case "30d":
      days = 30;
      break;
    case "90d":
      days = 90;
      break;
    case "12m":
      days = 365;
      break;
  }

  currentStart.setDate(currentStart.getDate() - days);
  previousStart.setDate(previousStart.getDate() - days * 2);

  return {
    currentStart,
    previousStart,
    end,
    days,
  };
}

function percentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function getEngagementCategory(
  loginCount: number,
  lastLoginAt: Date | null,
): EngagementCategory {
  if (!lastLoginAt) {
    return "NEVER_LOGGED_IN";
  }

  if (loginCount >= 10) {
    return "HIGHLY_ACTIVE";
  }

  if (loginCount >= 3) {
    return "MODERATELY_ACTIVE";
  }

  return "INACTIVE";
}

function toChartData(values: Record<string, number>): ChartItem[] {
  return Object.entries(values).map(([label, value]) => ({
    label,
    value,
  }));
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getUserDisplayName(user: {
  first_name: string;
  last_name: string;
}): string {
  return `${user.first_name} ${user.last_name}`.trim();
}

export async function getAnalyticsData(
  userId: string,
  role: UserRole,
  rangeInput: string | null = "30d",
) {
  await connectDatabase();
  const range = getRange(rangeInput);
    const dates = getDateRange(range);

    const isSuperAdmin = role === "SUPER_ADMIN";
    const isManager = MANAGER_ROLES.includes(role);

    const currentPeriod = {
      $gte: dates.currentStart,
      $lte: dates.end,
    };

    const registrationStart = range === "12m"
      ? getMonthStart(new Date(dates.end.getFullYear(), dates.end.getMonth() - 11, 1))
      : dates.currentStart;

    const previousPeriod = {
      $gte: dates.previousStart,
      $lt: dates.currentStart,
    };

    const currentUserId = new mongoose.Types.ObjectId(userId);

    if (role === "USER") {
      const [
        currentUser,
        successfulLogins,
        failedLogins,
        previousSuccessfulLogins,
        activityCounts,
        loginTrends,
      ] = await Promise.all([
        User.findById(currentUserId)
          .select(
            "first_name last_name email role status lastLoginAt createdAt",
          )
          .lean(),

        AuditLog.countDocuments({
          actorId: currentUserId,
          action: "LOGIN_SUCCESS",
          createdAt: currentPeriod,
        }),

        AuditLog.countDocuments({
          actorId: currentUserId,
          action: "LOGIN_FAILED",
          createdAt: currentPeriod,
        }),

        AuditLog.countDocuments({
          actorId: currentUserId,
          action: "LOGIN_SUCCESS",
          createdAt: previousPeriod,
        }),

        AuditLog.aggregate([
          {
            $match: {
              actorId: currentUserId,
              createdAt: currentPeriod,
            },
          },
          {
            $group: {
              _id: "$action",
              value: { $sum: 1 },
            },
          },
        ]),

        AuditLog.aggregate([
          {
            $match: {
              actorId: currentUserId,
              action: "LOGIN_SUCCESS",
              createdAt: currentPeriod,
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
                day: { $dayOfMonth: "$createdAt" },
              },
              value: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
        ]),
      ]);

      if (!currentUser) throw new Error("User not found");

      const activityDistribution = activityCounts.map(
        (item: { _id: string; value: number }) => ({
          label: item._id,
          value: item.value,
        }),
      );

      const loginTrendData: ChartItem[] = loginTrends.map(
        (item: {
          _id: {
            year: number;
            month: number;
            day: number;
          };
          value: number;
        }) => ({
          label: `${item._id.day}/${item._id.month}`,
          value: item.value,
        }),
      );

      const personal = {
        name: getUserDisplayName(currentUser),
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status,
        lastLoginAt: currentUser.lastLoginAt
          ? new Date(currentUser.lastLoginAt).toISOString()
          : null,
        createdAt: new Date(currentUser.createdAt).toISOString(),
      };

      return {
          range,

          metrics: {
            totalUsers: 0,
            activeUsers: 0,
            suspendedUsers: 0,
            invitedUsers: 0,

            newUsers: 0,
            previousNewUsers: 0,
            newUsersChange: 0,

            successfulLogins,
            failedLogins,
            loginChange: percentageChange(
              successfulLogins,
              previousSuccessfulLogins,
            ),

            auditEvents: activityDistribution.reduce(
              (total: number, item: ChartItem) => total + item.value,
              0,
            ),
          },

          userGrowth: [],
          monthlyRegistrations: [],
          roles: [],
          statuses: [],

          activityDistribution,
          engagementDistribution: [],
          engagementUsers: [],

          loginTrends: loginTrendData,

          engagement: null,
          personal,
      };
    }

    let scopedUserIds: mongoose.Types.ObjectId[] | null = null;

    if (!isSuperAdmin) {
      const directCreationLogs = await AuditLog.find({
        action: "USER_CREATED",
        actorId: currentUserId,
      })
        .select("targetUserId")
        .lean();

      const directCreatedIds = directCreationLogs
        .map((log) => log.targetUserId)
        .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

      const managerIds = isManager
        ? [currentUserId]
        : role === "ADMIN"
          ? await User.find({ _id: { $in: directCreatedIds }, role: "MANAGER" }).distinct("_id")
          : [];

      let createdIds = [...directCreatedIds];

      if (role === "ADMIN" && managerIds.length > 0) {
        const managerCreatedLogs = await AuditLog.find({
          action: "USER_CREATED",
          actorId: { $in: managerIds },
        })
          .select("targetUserId")
          .lean();
        createdIds = createdIds.concat(
          ...managerCreatedLogs
            .map((log) => log.targetUserId)
            .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
        );
      }

      if (role === "ADMIN") {
        createdIds = createdIds.filter((id) => !managerIds.some((managerId) => managerId.equals(id)));
        createdIds.push(...managerIds);
      }

      scopedUserIds = Array.from(
        new Map(
          createdIds.map((id) => [id.toString(), id]),
        ).values(),
      );
    }

    const scopedUserFilter = scopedUserIds
      ? { _id: { $in: scopedUserIds } }
      : {};
    const scopedActorIds = scopedUserIds
      ? [currentUserId, ...scopedUserIds]
      : undefined;
    const scopedAuditFilter = scopedActorIds
      ? { actorId: { $in: scopedActorIds } }
      : {};

    /*
     * Global analytics queries continue in Part 3.
     */
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      invitedUsers,
      newUsers,
      previousNewUsers,
      successfulLogins,
      failedLogins,
      previousSuccessfulLogins,
      auditEvents,
      roleCounts,
      statusCounts,
    ] = await Promise.all([
      User.countDocuments(scopedUserFilter),

      User.countDocuments({ ...scopedUserFilter, status: "ACTIVE" }),

      User.countDocuments({ ...scopedUserFilter, status: "SUSPENDED" }),

      User.countDocuments({ ...scopedUserFilter, status: "INVITED" }),

      User.countDocuments({
        ...scopedUserFilter,
        createdAt: currentPeriod,
      }),

      User.countDocuments({
        ...scopedUserFilter,
        createdAt: previousPeriod,
      }),

      AuditLog.countDocuments({
        ...scopedAuditFilter,
        action: "LOGIN_SUCCESS",
        createdAt: currentPeriod,
      }),

      AuditLog.countDocuments({
        ...scopedAuditFilter,
        action: "LOGIN_FAILED",
        createdAt: currentPeriod,
      }),

      AuditLog.countDocuments({
        ...scopedAuditFilter,
        action: "LOGIN_SUCCESS",
        createdAt: previousPeriod,
      }),

      AuditLog.countDocuments({
        ...scopedAuditFilter,
        createdAt: currentPeriod,
      }),

      User.aggregate([
        { $match: scopedUserFilter },
        {
          $group: {
            _id: "$role",
            value: { $sum: 1 },
          },
        },
      ]),

      User.aggregate([
        { $match: scopedUserFilter },
        {
          $group: {
            _id: "$status",
            value: { $sum: 1 },
          },
        },
      ]),
    ]);

    /*
     * Continue global aggregation in Part 3.
     */
    const [
      registrationResults,
      engagementLoginResults,
      engagementUsers,
      loginTrendResults,
      activityResults,
    ] = await Promise.all([
      // Registrations for the selected range, grouped by day or calendar month.
      User.aggregate([
        {
          $match: {
            ...scopedUserFilter,
            createdAt: { $gte: registrationStart, $lte: dates.end },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              ...(range === "12m" ? {} : { day: { $dayOfMonth: "$createdAt" } }),
            },
            value: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      // Login counts by user
      AuditLog.aggregate([
        {
          $match: {
            ...scopedAuditFilter,
            action: "LOGIN_SUCCESS",
            createdAt: currentPeriod,
            actorId: scopedActorIds ? { $in: scopedActorIds } : { $exists: true },
          },
        },
        {
          $group: {
            _id: "$actorId",
            loginCount: { $sum: 1 },
            lastLoginAt: { $max: "$createdAt" },
          },
        },
      ]),

      // Latest users for engagement table
      User.find(scopedUserFilter)
        .select("first_name last_name email role status lastLoginAt createdAt")
        .sort({ lastLoginAt: -1, createdAt: -1 })
        .limit(50)
        .lean(),

      // Successful login trends
      AuditLog.aggregate([
        {
          $match: {
            ...scopedAuditFilter,
            action: "LOGIN_SUCCESS",
            createdAt: currentPeriod,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            value: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
          },
        },
      ]),

      // Audit action distribution
      AuditLog.aggregate([
        {
          $match: {
            ...scopedAuditFilter,
            createdAt: currentPeriod,
          },
        },
        {
          $group: {
            _id: "$action",
            value: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Engagement classification
    const loginCountMap = new Map<
      string,
      { loginCount: number; lastLoginAt: Date }
    >();

    for (const item of engagementLoginResults) {
      loginCountMap.set(item._id.toString(), {
        loginCount: item.loginCount,
        lastLoginAt: item.lastLoginAt,
      });
    }

    const engagementCounts: Record<EngagementCategory, number> = {
      HIGHLY_ACTIVE: 0,
      MODERATELY_ACTIVE: 0,
      INACTIVE: 0,
      NEVER_LOGGED_IN: 0,
    };

    const engagementRows = engagementUsers.map((user) => {
      const loginData = loginCountMap.get(user._id.toString());

      const loginCount = loginData?.loginCount ?? 0;

      const lastLoginAt = user.lastLoginAt ? new Date(user.lastLoginAt) : null;

      const category = getEngagementCategory(loginCount, lastLoginAt);

      engagementCounts[category]++;

      return {
        id: user._id.toString(),
        name: getUserDisplayName(user),
        email: user.email,
        role: user.role,
        periodLogins: loginCount,
        lastLoginAt: lastLoginAt?.toISOString() ?? null,
        category,
      };
    });

    // Fill every period in the selected range so empty days/months appear as zero.
    const registrationCounts = new Map(
      registrationResults.map((item) => [
        range === "12m"
          ? `${item._id.year}-${item._id.month}`
          : `${item._id.year}-${item._id.month}-${item._id.day}`,
        item.value,
      ]),
    );
    const periodCount = range === "12m" ? 12 : dates.days + 1;
    const monthlyRegistrations: ChartItem[] = Array.from({ length: periodCount }, (_, index) => {
      const date = range === "12m"
        ? new Date(dates.end.getFullYear(), dates.end.getMonth() - 11 + index, 1)
        : new Date(dates.currentStart.getFullYear(), dates.currentStart.getMonth(), dates.currentStart.getDate() + index);
      const key = range === "12m"
        ? `${date.getFullYear()}-${date.getMonth() + 1}`
        : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      return {
        label: range === "12m"
          ? date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          : date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
        value: registrationCounts.get(key) ?? 0,
      };
    });

    let cumulativeTotal = 0;
    const cumulativeGrowth: ChartItem[] = monthlyRegistrations.map((item) => {
      cumulativeTotal += item.value;
      return { label: item.label, value: cumulativeTotal };
    });

    // Login trends
    const loginTrends: ChartItem[] = loginTrendResults.map((item) => ({
      label: `${item._id.day}/${item._id.month}`,
      value: item.value,
    }));

    // Role distribution
    const roles = toChartData(
      Object.fromEntries(roleCounts.map((item) => [item._id, item.value])),
    );

    // Status distribution
    const statuses = toChartData(
      Object.fromEntries(statusCounts.map((item) => [item._id, item.value])),
    );

    // Audit distribution
    const activityDistribution = toChartData(
      Object.fromEntries(activityResults.map((item) => [item._id, item.value])),
    );

    const engagementDistribution: ChartItem[] = [
      {
        label: "HIGHLY_ACTIVE",
        value: engagementCounts.HIGHLY_ACTIVE,
      },
      {
        label: "MODERATELY_ACTIVE",
        value: engagementCounts.MODERATELY_ACTIVE,
      },
      {
        label: "INACTIVE",
        value: engagementCounts.INACTIVE,
      },
      {
        label: "NEVER_LOGGED_IN",
        value: engagementCounts.NEVER_LOGGED_IN,
      },
    ];

    const engagedUsers =
      engagementCounts.HIGHLY_ACTIVE + engagementCounts.MODERATELY_ACTIVE;

    const inactiveUsers = engagementCounts.INACTIVE;

    const neverLoggedInUsers = engagementCounts.NEVER_LOGGED_IN;

    const engagementRate =
      totalUsers > 0
        ? Number(((engagedUsers / totalUsers) * 100).toFixed(1))
        : 0;

    return {
        range,

        metrics: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          invitedUsers,

          newUsers,
          previousNewUsers,
          newUsersChange: percentageChange(newUsers, previousNewUsers),

          successfulLogins,
          failedLogins,
          loginChange: percentageChange(
            successfulLogins,
            previousSuccessfulLogins,
          ),

          auditEvents,
        },

        userGrowth: cumulativeGrowth,

        monthlyRegistrations,

        roles,
        statuses,

        activityDistribution,

        engagementDistribution,

        loginTrends,

        engagement: {
          eligibleUsers: totalUsers,
          engagedUsers,
          inactiveUsers,
          neverLoggedInUsers,
          engagementRate,
        },

        engagementUsers: engagementRows,

        personal: null,
    };

}


