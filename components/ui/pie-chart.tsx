"use client";

import React, { useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface PieChartDataItem {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  isSidebarOpen?: boolean;
  data?: PieChartDataItem[];
  title?: string;
  size?: number;
  innerRadius?: number;
  colors?: string[];
  valuePrefix?: string;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  showLegend?: boolean;
  showPercentage?: boolean;
  showTotal?: boolean;
  animationDuration?: number;
}

const DEFAULT_COLORS = [
  "var(--color-accent)",
  "var(--color-green)",
  "var(--color-orange)",
  "var(--color-purple)",
  "var(--color-pink)",
  "var(--color-cyan)",
  "var(--color-yellow)",
  "var(--color-teal)",
];

// Generate a filled SVG pie slice.
function describePieSlice(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const toPoint = (angle: number) => {
    const rad = (angle * Math.PI) / 180;

    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const start = toPoint(startAngle);
  const end = toPoint(endAngle);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export default function PieChart({
  isSidebarOpen = false,
  data = [],
  title = "",
  size = 260,
  innerRadius = 0,
  colors = DEFAULT_COLORS,
  valuePrefix = "",
  valueSuffix = "",
  formatValue,
  showLegend = true,
  showPercentage = true,
  showTotal = true,
  animationDuration = 0.8,
}: PieChartProps) {
  const chartId = useId().replace(/:/g, "");
  const shouldReduceMotion = useReducedMotion();

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Normalize inner radius.
  const safeInnerRadius = Math.max(0, Math.min(0.9, innerRadius));

  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .filter(
        (item) =>
          item &&
          item.label != null &&
          Number.isFinite(Number(item.value)) &&
          Number(item.value) > 0,
      )
      .map((item, index) => ({
        label: String(item.label),
        value: Number(item.value),
        color: item.color || colors[index % colors.length] || DEFAULT_COLORS[0],
      }));
  }, [data, colors]);

  const total = useMemo(
    () => safeData.reduce((sum, item) => sum + item.value, 0),
    [safeData],
  );

  const activeIndex = Math.max(0, Math.min(selectedIndex, safeData.length - 1));

  const selected = safeData[activeIndex] ?? null;

  const format = (value: number) =>
    formatValue
      ? formatValue(value)
      : `${valuePrefix}${new Intl.NumberFormat("en", {
          maximumFractionDigits: 1,
        }).format(value)}${valueSuffix}`;

  const percentage = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  // SVG geometry.
  const center = size / 2;
  const radius = size * 0.46;

  const strokeWidth = radius * safeInnerRadius;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  // Build each segment from immutable prefix totals.
  const segments = safeData.map((item, index) => {
    const percent = percentage(item.value);
    const dashLength = (percent / 100) * circumference;
    const previousValue = safeData
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.value, 0);
    const dashOffset = -(previousValue / total) * circumference;
    const startAngle = -90 + (previousValue / total) * 360;
    const endAngle = startAngle + (percent / 100) * 360;

    return {
      ...item,
      index,
      percent,
      dashLength,
      dashOffset,
      startAngle,
      endAngle,
    };
  });

  const selectSlice = (index: number) => {
    if (!safeData.length) return;

    setSelectedIndex(Math.max(0, Math.min(index, safeData.length - 1)));
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<SVGElement>,
    index: number,
  ) => {
    let nextIndex = index;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (index + 1) % safeData.length;
        break;

      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (index - 1 + safeData.length) % safeData.length;
        break;

      case "Home":
        nextIndex = 0;
        break;

      case "End":
        nextIndex = safeData.length - 1;
        break;

      case "Enter":
      case " ":
        event.preventDefault();
        selectSlice(index);
        return;

      default:
        return;
    }

    event.preventDefault();
    selectSlice(nextIndex);

    document.getElementById(`${chartId}-slice-${nextIndex}`)?.focus();
  };

  // Empty state.
  if (!safeData.length || total <= 0) {
    return (
      <section className="h-full w-full min-w-0 overflow-hidden rounded-3xl">
        {/* Title */}
        {title && (
          <h4 className="mb-2 px-4 font-semibold text-text-secondary">
            {title}
          </h4>
        )}

        <div className="h-full w-full flex justify-center items-center rounded-3xl bg-background-secondary p-6">
          <p className="font-semibold text-text-secondary">No data available</p>
        </div>
      </section>
    );
  }

  const isPieChart = safeInnerRadius === 0;

  return (
    <section className="h-full w-full min-w-0 overflow-hidden rounded-3xl">
      {/* Title */}
      {title && (
        <h4 className="mb-2 px-4 font-semibold text-text-secondary">{title}</h4>
      )}

      <div
        className={`flex h-full w-full flex-col lg:flex-row items-center justify-center gap-6 rounded-3xl bg-background-secondary p-4 ${isSidebarOpen ? "md:flex-col" : "md:flex-row"}`}
      >
        {/* Chart */}
        <div className="relative shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="group"
            aria-label={`${title || "Data"} ${isPieChart ? "pie" : "donut"} chart`}
            className="block max-w-full overflow-visible"
          >
            {/* Donut chart */}
            {!isPieChart && (
              <>
                {/* Background track */}
                <circle
                  cx={center}
                  cy={center}
                  r={normalizedRadius}
                  fill="none"
                  stroke="var(--color-background-tertiary)"
                  strokeWidth={strokeWidth}
                />

                {/* Donut segments */}
                {segments.map((segment) => {
                  const isSelected = segment.index === activeIndex;

                  return (
                    <motion.circle
                      key={`${segment.label}-${segment.index}`}
                      id={`${chartId}-slice-${segment.index}`}
                      cx={center}
                      cy={center}
                      r={normalizedRadius}
                      fill="none"
                      stroke={segment.color}
                      strokeWidth={strokeWidth * (isSelected ? 1.12 : 1)}
                      strokeDasharray={`${segment.dashLength} ${circumference}`}
                      strokeDashoffset={segment.dashOffset}
                      strokeLinecap="butt"
                      transform={`rotate(-90 ${center} ${center})`}
                      initial={
                        shouldReduceMotion
                          ? false
                          : {
                              strokeDasharray: `0 ${circumference}`,
                              opacity: 0.5,
                            }
                      }
                      animate={{
                        strokeDasharray: `${segment.dashLength} ${circumference}`,
                        strokeDashoffset: segment.dashOffset,
                        opacity: isSelected ? 1 : 0.8,
                      }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : animationDuration,
                        ease: "easeOut",
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${segment.label}: ${format(segment.value)}, ${segment.percent.toFixed(1)}%`}
                      aria-pressed={isSelected}
                      onClick={() => selectSlice(segment.index)}
                      onPointerEnter={(event) => {
                        if (event.pointerType !== "touch") {
                          selectSlice(segment.index);
                        }
                      }}
                      onFocus={() => selectSlice(segment.index)}
                      onKeyDown={(event) => handleKeyDown(event, segment.index)}
                      className="cursor-pointer outline-none"
                    />
                  );
                })}
              </>
            )}

            {/* True filled pie chart */}
            {isPieChart &&
              segments.map((segment) => {
                const isSelected = segment.index === activeIndex;

                const path = describePieSlice(
                  center,
                  center,
                  radius,
                  segment.startAngle,
                  // SVG's arc command cannot represent a complete 360° arc
                  // because its start and end points are identical.
                  segment.endAngle - segment.startAngle >= 359.999
                    ? segment.startAngle + 359.999
                    : segment.endAngle,
                );

                return (
                  <motion.path
                    key={`${segment.label}-${segment.index}`}
                    id={`${chartId}-slice-${segment.index}`}
                    d={path}
                    fill={segment.color}
                    stroke="var(--color-background-secondary)"
                    strokeWidth={0}
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{
                      opacity: isSelected ? 1 : 0.8,
                    }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : animationDuration,
                      ease: "easeOut",
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${segment.label}: ${format(segment.value)}, ${segment.percent.toFixed(1)}%`}
                    aria-pressed={isSelected}
                    onClick={() => selectSlice(segment.index)}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") {
                        selectSlice(segment.index);
                      }
                    }}
                    onFocus={() => selectSlice(segment.index)}
                    onKeyDown={(event) => handleKeyDown(event, segment.index)}
                    className="cursor-pointer outline-none"
                  />
                );
              })}
          </svg>

          {/* Donut center information */}
          {!isPieChart && showTotal && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-medium text-text-secondary">Total</span>

              <span className="mt-1 max-w-[80%] truncate text-2xl font-semibold">
                {format(total)}
              </span>
            </div>
          )}
        </div>

        {/* Selected information and legend */}
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          {/* Selected value */}
          {selected && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: selected.color,
                  }}
                />

                <p className="truncate text-xs font-semibold uppercase text-text-tertiary">
                  {selected.label}
                </p>
              </div>

              <p
                className="mt-2 text-3xl font-semibold"
                aria-live="polite"
                aria-atomic="true"
              >
                {format(selected.value)}
              </p>

              {showPercentage && (
                <p className="mt-1 text-text-secondary">
                  {percentage(selected.value).toFixed(1)}% of total
                </p>
              )}
            </div>
          )}

          {/* Legend */}
          {showLegend && (
            <div className="flex min-w-0 flex-col gap-1.5">
              {segments.map((segment) => {
                const isSelected = segment.index === activeIndex;

                return (
                  <button
                    key={`legend-${segment.index}`}
                    type="button"
                    onClick={() => selectSlice(segment.index)}
                    className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-xl px-4 py-2 text-left transition-all duration-300 ease-out ${
                      isSelected
                        ? "bg-background-tertiary"
                        : "hover:bg-background-tertiary/60"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: segment.color,
                        }}
                      />

                      <span className="truncate text-text-secondary">
                        {segment.label}
                      </span>
                    </span>

                    <span className="shrink-0 text-right font-medium">
                      {showPercentage
                        ? `${segment.percent.toFixed(1)}%`
                        : format(segment.value)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
