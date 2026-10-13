"use client";

import ProfileInformation from "./profile-information";
import Security from "./security";

export default function Settings() {
  return (
    <div className="mx-auto flex w-full flex-col gap-10 md:max-w-lg lg:max-w-4xl">
      <ProfileInformation />
      <Security />
    </div>
  );
}
