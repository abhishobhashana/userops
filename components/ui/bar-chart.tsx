"use client";

import React, { useCallback, useId, useMemo, useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

// ----------------------------------
// Types
// ----------------------------------

export interface BarChartDataItem {
  label: string | number;
  value: number;
  [key: string]: unknown;
}

interface BarChartProps {
  data?: BarChartDataItem[];
  title?: string;
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  height?: number;
}

// ----------------------------------
// Helpers
// ----------------------------------

function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 5;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude;
}

// ----------------------------------
// Chart Component
// ----------------------------------

export default function BarChart({
  data = [],
  title = "",
  color = "var(--color-accent)",
  valuePrefix = "",
  valueSuffix = "",
  formatValue,
  height = 260,
}: BarChartProps) {
  const chartId = useId().replace(/:/g, "");
  const shouldReduceMotion = useReducedMotion();

  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const yAxisRef = useRef<SVGSVGElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [axisWidth, setAxisWidth] = useState(20);

  const [selectedIndex, setSelectedIndex] = useState(
    Math.max(0, data.length - 1),
  );

  // ----------------------------------
  // Sanitize data
  // ----------------------------------

  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .filter(
        (item) =>
          item && item.label != null && Number.isFinite(Number(item.value)),
      )
      .map((item) => ({
        ...item,
        label: String(item.label),
        value: Number(item.value),
      }));
  }, [data]);

  const activeIndex = Math.max(0, Math.min(selectedIndex, safeData.length - 1));

  const selected = safeData[activeIndex] ?? null;

  // ----------------------------------
  // Chart scale
  // ----------------------------------

  const chart = useMemo(() => {
    const maxValue = niceMax(
      Math.max(0, ...safeData.map((item) => item.value)),
    );

    return {
      maxValue,
      ticks: Array.from({ length: 5 }, (_, i) => (maxValue * i) / 4),
    };
  }, [safeData]);

  // ----------------------------------
  // Value formatting
  // ----------------------------------

  const format = useCallback(
    (value: number) =>
      formatValue
        ? formatValue(value)
        : `${valuePrefix}${new Intl.NumberFormat("en", {
            maximumFractionDigits: 1,
          }).format(value)}${valueSuffix}`,
    [formatValue, valuePrefix, valueSuffix],
  );

  // ----------------------------------
  // Measure plot viewport
  // ----------------------------------

  useEffect(() => {
    const element = viewportRef.current;

    if (!element) return;

    const updateWidth = () => {
      setViewportWidth(element.clientWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);

      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(updateWidth);

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // ----------------------------------
  // Chart geometry
  // ----------------------------------

  const H = Math.max(180, height);

  const left = 0;
  const top = 14;
  const bottom = 28;

  const minSlotWidth = 48;

  useEffect(() => {
    const axis = yAxisRef.current;
    if (!axis) return;

    const labels = axis.querySelectorAll<SVGTextElement>("[data-y-axis-label]");
    const widestLabel = Array.from(labels).reduce(
      (width, label) => Math.max(width, label.getBBox().width),
      0,
    );
    setAxisWidth(Math.ceil(widestLabel + 12));
  }, [chart.ticks, format]);

  const visibleWidth = Math.max(1, viewportWidth || 320);

  const contentPlotW = Math.max(
    visibleWidth - left,
    safeData.length * minSlotWidth,
  );

  const svgWidth = left + contentPlotW;

  const plotH = H - top - bottom;

  const slot = safeData.length > 0 ? contentPlotW / safeData.length : 0;

  const baseline = top + plotH;

  const gridRight = svgWidth;

  const y = (value: number) => top + plotH * (1 - value / chart.maxValue);

  const barW = Math.min(28, slot * 0.58);

  // ----------------------------------
  // Scroll to latest data
  // ----------------------------------

  useEffect(() => {
    const element = scrollRef.current;

    if (element) {
      element.scrollLeft = Math.max(
        0,
        element.scrollWidth - element.clientWidth,
      );
    }
  }, [safeData.length, svgWidth]);

  // ----------------------------------
  // ----------------------------------
  // Select bar
  // ----------------------------------

  const selectBar = (index: number) => {
    setSelectedIndex(Math.max(0, Math.min(index, safeData.length - 1)));
  };

  // ----------------------------------
  // Keyboard navigation
  // ----------------------------------

  const handleBarKeyDown = (
    event: React.KeyboardEvent<SVGRectElement>,
    index: number,
  ) => {
    let nextIndex = index;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = Math.min(index + 1, safeData.length - 1);
        break;

      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = Math.max(index - 1, 0);
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
        selectBar(index);
        return;

      default:
        return;
    }

    event.preventDefault();

    selectBar(nextIndex);

    const target = document.getElementById(`${chartId}-bar-${nextIndex}`);

    target?.focus();

    target?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  // ----------------------------------
  // Empty state
  // ----------------------------------

  if (!safeData.length || safeData.every((item) => item.value === 0)) {
    return (
      <section className="h-full w-full min-w-0 overflow-hidden rounded-3xl">
        {title && (
          <h4 className="mb-2 px-4 font-semibold text-text-secondary">
            {title}
          </h4>
        )}

        <div className="h-82 w-full flex justify-center items-center rounded-3xl bg-background-secondary">
          <p className="font-semibold text-text-secondary">No data available</p>
        </div>
      </section>
    );
  }

  // ----------------------------------
  // Render chart
  // ----------------------------------

  return (
    <section className="h-full w-full min-w-0 overflow-hidden rounded-3xl">
      {title && (
        <h4 className="mb-2 px-4 font-semibold text-text-secondary">{title}</h4>
      )}

      <div className="rounded-3xl bg-background-secondary pb-2">
        <div className="min-w-0 p-4 pb-0">
          {/* Selected value */}
          <p className="text-xs font-semibold uppercase text-text-secondary">
            {selected?.label}
          </p>

          <p
            className="mt-1 wrap-break-words text-3xl font-semibold"
            aria-live="polite"
            aria-atomic="true"
          >
            {format(selected.value)}
          </p>
        </div>

        {/* Chart area */}
        <div className="flex w-full min-w-0 items-stretch px-5">
          {/* Plot viewport */}

          <div
            ref={viewportRef}
            className="relative min-w-0 flex-1 overflow-hidden"
          >
            {/* Scrollable chart */}

            <div
              ref={scrollRef}
              className="chart-scroll h-full w-full overflow-x-auto overflow-y-hidden"
            >
              <svg
                width={svgWidth}
                height={H}
                viewBox={`0 0 ${svgWidth} ${H}`}
                className="block"
                role="group"
                aria-label={`${title || "Data"} bar chart`}
              >
                {/* Horizontal grid lines */}

                {chart.ticks.map((tick, i) => {
                  if (i === 0) return null;

                  return (
                    <line
                      key={`h-${i}`}
                      x1={left}
                      x2={gridRight}
                      y1={y(tick)}
                      y2={y(tick)}
                      stroke="var(--color-chart-grid)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  );
                })}

                {/* Vertical grid lines */}

                {Array.from({ length: safeData.length }, (_, i) => {
                  const x = left + i * slot;

                  return (
                    <line
                      key={`v-${i}`}
                      x1={x}
                      x2={x}
                      y1={top}
                      y2={i === 0 ? baseline : baseline + 20}
                      stroke="var(--color-chart-grid)"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  );
                })}

                {/* Selected column highlight */}

                <rect
                  x={left + activeIndex * slot}
                  y={top}
                  width={slot}
                  height={plotH}
                  rx={4}
                  fill={color}
                  opacity={0.06}
                  pointerEvents="none"
                />

                {/* Bars */}

                {safeData.map((item, index) => {
                  const barX = left + index * slot + (slot - barW) / 2;

                  const barY = y(item.value);

                  const barHeight = Math.max(0, baseline - barY);

                  const isSelected = index === activeIndex;

                  const animateOnLoad = !shouldReduceMotion;

                  return (
                    <motion.rect
                      key={`${item.label}-${index}`}
                      id={`${chartId}-bar-${index}`}
                      x={barX}
                      width={barW}
                      rx={Math.min(6, barW / 2)}
                      fill={color}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.label}: ${format(item.value)}`}
                      aria-pressed={isSelected}
                      initial={
                        animateOnLoad
                          ? {
                              y: baseline,
                              height: 0,
                              opacity: 0.65,
                            }
                          : false
                      }
                      animate={{
                        y: barY,
                        height: barHeight,
                        opacity: isSelected ? 1 : 0.8,
                      }}
                      transition={
                        animateOnLoad
                          ? {
                              y: {
                                type: "spring",
                                stiffness: 220,
                                damping: 27,
                                delay: index * 0.035,
                              },
                              height: {
                                type: "spring",
                                stiffness: 220,
                                damping: 27,
                                delay: index * 0.035,
                              },
                              opacity: { duration: 0.12 },
                            }
                          : { duration: 0.12 }
                      }
                      onClick={() => selectBar(index)}
                      onPointerEnter={(event) => {
                        if (event.pointerType !== "touch") {
                          selectBar(index);
                        }
                      }}
                      onFocus={() => selectBar(index)}
                      onKeyDown={(event) => handleBarKeyDown(event, index)}
                      className="cursor-pointer outline-none focus-visible:stroke-white focus-visible:stroke-2"
                    />
                  );
                })}

                {/* Bottom labels */}

                {safeData.map((item, index) => (
                  <text
                    key={`x-${index}`}
                    x={left + index * slot + 8}
                    y={baseline + 14}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fontSize="14"
                    fontWeight="500"
                    fill="var(--color-text-tertiary)"
                    className="cursor-pointer select-none"
                    onClick={() => selectBar(index)}
                  >
                    {item.label}
                  </text>
                ))}
              </svg>
            </div>

            {/* Fixed overlay */}

            <svg
              className="pointer-events-none absolute inset-0 z-10 block h-full w-full"
              viewBox={`0 0 ${visibleWidth} ${H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Bottom axis */}

              <line
                x1={left}
                x2={visibleWidth}
                y1={baseline}
                y2={baseline}
                stroke="var(--color-chart-grid)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />

              {/* Fixed right boundary */}

              <line
                x1={visibleWidth - 0.5}
                x2={visibleWidth - 0.5}
                y1={top}
                y2={baseline}
                stroke="var(--color-chart-grid)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* Fixed Y-axis labels */}

          <svg
            ref={yAxisRef}
            width={axisWidth}
            height={H}
            viewBox={`0 0 ${axisWidth} ${H}`}
            className="block shrink-0"
            aria-hidden="true"
          >
            {chart.ticks.map((tick, i) => (
              <text
                key={`y-${i}`}
                x={6}
                y={y(tick)}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="500"
                fill="var(--color-text-tertiary)"
                data-y-axis-label
              >
                {format(tick)}
              </text>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
