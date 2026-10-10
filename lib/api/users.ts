import type { PublicUser } from "@/lib/auth/types";

type EditableProfile = Partial<
  Pick<PublicUser, "first_name" | "last_name" | "email">
>;

interface UpdateProfileResponse {
  success: true;
  data: {
    user: PublicUser;
  };
}

interface ErrorResponse {
  success?: false;
  error?: {
    code?: string;
    message?: string;
  };
}

export async function updateMyProfile(
  updates: EditableProfile,
): Promise<PublicUser> {
  const response = await fetch("/api/v1/users/me", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(updates),
  });

  const rawBody = await response.text();

  if (!rawBody.trim()) {
    throw new Error(
      `API returned an empty response (HTTP ${response.status}).`,
    );
  }

  let result: UpdateProfileResponse | ErrorResponse;

  try {
    result = JSON.parse(rawBody);
  } catch {
    console.error("Non-JSON API response:", rawBody.slice(0, 300));

    throw new Error(
      `API returned an invalid response (HTTP ${response.status}). Check the server logs.`,
    );
  }

  if (!response.ok || !("data" in result) || !result.data?.user) {
    throw new Error(
      ("error" in result && result.error?.message) ||
        `Unable to update profile (HTTP ${response.status}).`,
    );
  }

  return result.data.user;
}
