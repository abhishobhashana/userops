"use client";

import Header from "../ui/header";
import PageAnimation from "../ui/page-animation";
import ProfileInformation from "./profile-information";
import Security from "./security";

export default function Settings() {
  return (
    <>
      <Header title="Settings" />
      <PageAnimation>
        <div className="mx-auto flex w-full flex-col gap-10 md:max-w-lg lg:max-w-4xl">
          <ProfileInformation />
          <Security />
        </div>
      </PageAnimation>
    </>
  );
}
