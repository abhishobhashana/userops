"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const ONBOARDING_KEY = "userops:onboarding-completed";

export function WelcomeScreen() {
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = window.localStorage.getItem(ONBOARDING_KEY) === "true";

    if (completed) {
      router.replace("/login");
      return;
    }

    setIsReady(true);

    const animationFrame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [router]);

  const handleContinue = () => {
    window.localStorage.setItem(ONBOARDING_KEY, "true");

    setIsVisible(false);

    window.setTimeout(() => {
      router.replace("/login");
    }, 350);
  };

  if (!isReady) {
    return null;
  }

  return (
    <main
      aria-labelledby="welcome-container"
      className={`fixed inset-0 flex min-h-dvh items-center justify-center bg-background transition-opacity duration-420 ease-out max-sm:items-end motion-reduce:transition-none ${isVisible ? "visible opacity-100" : "invisible opacity-0"}`}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-background" />

      <section
        className={`relative w-full max-w-xl max-h-[calc(100dvh-32px)] overflow-hidden lg:rounded-[42px] rounded-4xl rounded-b-none bg-background-secondary transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none ${isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-6 scale-[0.98] opacity-0"} max-sm:w-full max-sm:max-h-[calc(100dvh-24px)] max-sm:border-0 ${isVisible ? "max-sm:translate-y-0" : "max-sm:translate-y-full max-sm:scale-100"}`}
      >
        <div className="flex min-h-[min(720px,calc(100dvh-72px))] flex-col lg:p-8 p-6 lg:pt-0 pt-0 max-sm:min-h-[calc(100dvh-24px)]">
          <header className="text-center my-auto">
            <span className="material-symbols-rounded text-accent text-6xl!">
              manage_accounts
            </span>

            <h1
              id="welcome-title"
              className="mx-auto max-w-86 font-semibold text-4xl text-foreground max-sm:max-w-82.5"
            >
              Welcome to UserOps
            </h1>
          </header>

          <div className="mx-auto mb-auto flex w-full max-w-107.5 flex-col gap-7 max-sm:max-w-97.5 max-sm:gap-6.5">
            <WelcomeFeature
              icon={
                <span className="material-symbols-rounded text-3xl!">
                  group
                </span>
              }
              title="Manage your people"
              description="Users, roles, and account status in one place."
            />

            <WelcomeFeature
              icon={
                <span className="material-symbols-rounded text-3xl!">
                  admin_panel_settings
                </span>
              }
              title="Control access"
              description="Role-based permissions keep your workspace secure."
            />

            <WelcomeFeature
              icon={
                <span className="material-symbols-rounded text-3xl!">
                  history
                </span>
              }
              title="Understand what happened"
              description="Activity and audit visibility when it matters."
            />
          </div>

          <div className="w-full">
            <Button onClick={handleContinue}>Continue</Button>
          </div>
        </div>
      </section>
    </main>
  );
}

interface WelcomeFeatureProps {
  icon?: ReactNode;
  title: string;
  description: string;
}

function WelcomeFeature({ icon, title, description }: WelcomeFeatureProps) {
  return (
    <article className="w-full flex gap-4 lg:px-0 px-6">
      <div className="text-accent h-fit w-fit">{icon}</div>

      <div>
        <h2 className="mb-1 font-semibold leading-5 text-foreground">
          {title}
        </h2>

        <p className="m-0 max-w-85 text-foreground-secondary">{description}</p>
      </div>
    </article>
  );
}
