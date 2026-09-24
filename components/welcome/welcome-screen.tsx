"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";

const ONBOARDING_KEY = "userops:onboarding-completed";

export function WelcomeScreen() {
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = window.localStorage.getItem(ONBOARDING_KEY) === "true";

    if (completed) {
      router.replace("/auth/login");
      return;
    }

    let frameOne = 0;
    let frameTwo = 0;

    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
    };
  }, [router]);

  const handleContinue = () => {
    window.localStorage.setItem(ONBOARDING_KEY, "true");

    setIsVisible(false);

    window.setTimeout(() => {
      router.replace("/auth/login");
    }, 400);
  };

  return (
    <main
      aria-labelledby="welcome-title"
      className={`fixed inset-0 z-50 flex min-h-dvh items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-400 ease-out max-sm:items-end ${
        isVisible ? "opacity-100" : "opacity-0"
      } motion-reduce:transition-none`}
    >
      <section
        className={`relative z-10 w-full overflow-hidden bg-background-secondary transition-all duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] md:max-w-lg md:rounded-[42px] lg:max-w-lg lg:rounded-[42px] ${
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.96] opacity-0"
        } max-sm:max-h-[calc(100dvh-24px)] max-sm:min-h-[calc(100dvh-24px)] max-sm:rounded-b-none max-sm:rounded-t-4xl ${
          isVisible ? "max-sm:translate-y-0" : "max-sm:translate-y-full"
        } motion-reduce:transition-none`}
      >
        <div className="flex min-h-[min(720px,calc(100dvh-72px))] flex-col p-6 pt-0 max-sm:min-h-[calc(100dvh-24px)] lg:p-8 lg:pt-0">
          <header className="my-auto text-center">
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
    <article className="flex w-full gap-4 px-6 lg:px-4">
      <div className="h-fit w-fit text-accent">{icon}</div>

      <div>
        <h2 className="mb-1 font-semibold leading-5 text-foreground">
          {title}
        </h2>

        <p className="m-0 max-w-85 text-foreground-secondary">{description}</p>
      </div>
    </article>
  );
}
