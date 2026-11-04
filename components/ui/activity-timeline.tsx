"use client";

import type { ActivityEvent } from "@/lib/api/activity";
import Icon from "./icon";

const ACTION_DETAILS: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  LOGIN_SUCCESS: { label: "Signed in", icon: "login", color: "text-green" },
  LOGIN_FAILED: { label: "Failed sign in", icon: "error", color: "text-red" },
  USER_CREATED: {
    label: "Created an account",
    icon: "person_add",
    color: "text-accent",
  },
  USER_SUSPENDED: {
    label: "Suspended an account",
    icon: "person_off",
    color: "text-red",
  },
  USER_ACTIVATED: {
    label: "Activated an account",
    icon: "person_check",
    color: "text-green",
  },
  ROLE_CHANGED: {
    label: "Changed an account role",
    icon: "badge",
    color: "text-purple",
  },
  PASSWORD_RESET: {
    label: "Reset a password",
    icon: "lock_reset",
    color: "text-orange",
  },
  PASSWORD_CHANGED: {
    label: "Changed a password",
    icon: "key",
    color: "text-cyan",
  },
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
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

function describeEvent(event: ActivityEvent) {
  const details = ACTION_DETAILS[event.action] ?? {
    label: event.action.replaceAll("_", " ").toLowerCase(),
    icon: "history",
    color: "text-text-secondary",
  };
  const actor = event.actor?.name ?? "System";
  const target = event.target?.name;

  if (event.action === "LOGIN_SUCCESS") {
    return { ...details, text: `${actor} signed in` };
  }
  if (event.action === "LOGIN_FAILED") {
    return { ...details, text: `${actor} had a failed sign-in attempt` };
  }
  if (target) {
    return {
      ...details,
      text: `${actor} ${details.label.toLowerCase()} for ${target}`,
    };
  }
  return { ...details, text: `${actor} ${details.label.toLowerCase()}` };
}

export default function ActivityTimeline({
  events,
}: {
  events: ActivityEvent[];
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-3xl bg-background-secondary px-4 py-3 text-center">
        <p className="font-semibold text-text-secondary">
          No activity found for this period.
        </p>
      </div>
    );
  }

  return (
    <ol className="bg-background-secondary rounded-3xl px-4">
      {events.map((event, index) => {
        const details = describeEvent(event);
        return (
          <li key={event.id} className="relative flex items-start gap-3">
            {/* Icon */}
            <div className={`mt-3 shrink-0 ${details.color}`}>
              <Icon name={details.icon} />
            </div>

            {/* Content */}
            <div
              className={`flex flex-1 max-w-3xl justify-between py-3 ${
                index !== events.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div>
                <p className="font-medium">{details.text}</p>

                {event.action === "ROLE_CHANGED" && event.metadata?.role && (
                  <p className="mt-1 text-sm text-text-secondary">
                    New role — {event.metadata.role.replaceAll("_", " ")}
                  </p>
                )}

                {event.target?.role && event.action === "USER_CREATED" && (
                  <p className="mt-1 text-sm text-text-secondary">
                    Role — {event.target.role.replaceAll("_", " ")}
                  </p>
                )}
              </div>

              <time
                dateTime={event.createdAt}
                className="mt-1 block text-sm text-text-secondary"
              >
                {formatTimestamp(event.createdAt)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
