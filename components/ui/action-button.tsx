"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import Icon from "./icon";

const MotionLink = motion.create(Link);

interface ActionButtonBaseProps {
  iconClassName?: string;
  icon: string;
  size?: number;
  label: string;
  className?: string;
}

type ActionButtonProps =
  | (ActionButtonBaseProps &
      Omit<HTMLMotionProps<"button">, "children" | "className"> & {
        href?: never;
      })
  | (ActionButtonBaseProps &
      Omit<HTMLMotionProps<"a">, "children" | "className" | "href"> & {
        href: string;
      });

const baseClassName = [
  "liquid-glass",
  "inline-flex shrink-0 items-center justify-center size-11 cursor-pointer",
  "rounded-full text-text",
  "transform-gpu touch-manipulation",
  "transition-transform duration-200 ease-out",
  "disabled:cursor-not-allowed disabled:opacity-40!",
].join(" ");

const entranceTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export default function ActionButton(props: ActionButtonProps) {
  const {
    iconClassName,
    icon,
    size = 20,
    label,
    className = "",
    href,
    ...rest
  } = props;

  const classes = [baseClassName, className].filter(Boolean).join(" ");

  const iconElement = (
    <Icon className={iconClassName} name={icon} size={size} />
  );

  const isDisabled = "disabled" in props && Boolean(props.disabled);

  const animationProps = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: entranceTransition,
  };

  if (href !== undefined) {
    const linkProps = rest as Omit<
      Extract<ActionButtonProps, { href: string }>,
      keyof ActionButtonBaseProps | "href"
    >;

    return (
      <MotionLink
        {...linkProps}
        {...animationProps}
        href={href}
        aria-label={props["aria-label"] ?? label}
        className={classes}
        whileTap={{ scale: 1.1 }}
      >
        {iconElement}
      </MotionLink>
    );
  }

  const buttonProps = rest as Omit<
    Extract<ActionButtonProps, { href?: never }>,
    keyof ActionButtonBaseProps | "href"
  >;

  return (
    <motion.button
      {...buttonProps}
      {...animationProps}
      type={buttonProps.type ?? "button"}
      aria-label={props["aria-label"] ?? label}
      disabled={isDisabled}
      whileTap={isDisabled ? undefined : { scale: 1.1 }}
      className={classes}
    >
      {iconElement}
    </motion.button>
  );
}
