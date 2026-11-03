"use client";

import React, { useCallback, useId, useMemo, useRef, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface LineChartDataItem {
  label: string | number;
  value: number;
}

interface LineChartProps {
  data?: LineChartDataItem[];
  title?: string;
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  height?: number;
  gradientOpacity?: number;
  curve?: boolean;
}

function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 5;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;

  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

  return step * magnitude;
}

export default function LineChart({
  data = [],
  title = "",
  color = "var(--color-accent)",
  valuePrefix = "",
  valueSuffix = "",
  formatValue,
  height = 260,
  gradientOpacity = 0.3,
  curve = true,
}: LineChartProps) {
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

  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data
      .filter(
        (item) =>
          item && item.label != null && Number.isFinite(Number(item.value)),
      )
      .map((item) => ({
        label: String(item.label),
        value: Number(item.value),
      }));
  }, [data]);

  const activeIndex = Math.max(0, Math.min(selectedIndex, safeData.length - 1));

  const selected = safeData[activeIndex] ?? null;

  const chart = useMemo(() => {
    const maxValue = niceMax(
      Math.max(0, ...safeData.map((item) => item.value)),
    );

    return {
      maxValue,
      ticks: Array.from({ length: 5 }, (_, i) => (maxValue * i) / 4),
    };
  }, [safeData]);

  const format = useCallback(
    (value: number) =>
      formatValue
        ? formatValue(value)
        : `${valuePrefix}${new Intl.NumberFormat("en", {
            maximumFractionDigits: 1,
          }).format(value)}${valueSuffix}`,
    [formatValue, valuePrefix, valueSuffix],
  );

  // Measure viewport
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateWidth = () => {
      setViewportWidth(element.clientWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  // Chart geometry
  const H = Math.max(180, height);
  const left = 0;
  const top = 18;
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

  const contentPlotW = Math.max(visibleWidth, safeData.length * minSlotWidth);

  const svgWidth = contentPlotW;
  const plotH = H - top - bottom;

  const slot = safeData.length > 0 ? contentPlotW / safeData.length : 0;

  const baseline = top + plotH;

  const x = (index: number) => left + index * slot + slot / 2;

  const y = (value: number) => top + plotH * (1 - value / chart.maxValue);

  // Chart points
  const points = safeData.map((item, index) => ({
    x: x(index),
    y: y(item.value),
    ...item,
  }));

  // Line path
  const linePath = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const previous = points[index - 1];

      if (!curve) {
        return `L ${point.x} ${point.y}`;
      }

      const midX = (previous.x + point.x) / 2;

      return [
        `C ${midX} ${previous.y}`,
        `${midX} ${point.y}`,
        `${point.x} ${point.y}`,
      ].join(" ");
    })
    .join(" ");

  // Gradient area
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
    : "";

  // Scroll to latest point
  useEffect(() => {
    const element = scrollRef.current;

    if (element) {
      element.scrollLeft = Math.max(
        0,
        element.scrollWidth - element.clientWidth,
      );
    }
  }, [safeData.length, svgWidth]);

  const selectPoint = (index: number) => {
    setSelectedIndex(Math.max(0, Math.min(index, safeData.length - 1)));
  };

  // Keyboard navigation
  const handlePointKeyDown = (
    event: React.KeyboardEvent<SVGCircleElement>,
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
        selectPoint(index);
        return;

      default:
        return;
    }

    event.preventDefault();
    selectPoint(nextIndex);

    const target = document.getElementById(`${chartId}-point-${nextIndex}`);

    target?.focus();

    target?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  // Empty state
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
            {selected ? format(selected.value) : ""}
          </p>
        </div>

        {/* Chart area */}
        <div className="flex w-full min-w-0 items-stretch px-5">
          {/* Plot viewport */}
          <div
            ref={viewportRef}
            className="relative min-w-0 flex-1 overflow-hidden"
          >
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
                aria-label={`${title || "Data"} line chart`}
              >
                <defs>
                  <linearGradient
                    id={`${chartId}-area`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={color}
                      stopOpacity={Math.max(0, Math.min(1, gradientOpacity))}
                    />

                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                {chart.ticks.map((tick, i) => {
                  if (i === 0) return null;

                  return (
                    <line
                      key={`h-${i}`}
                      x1={left}
                      x2={svgWidth}
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
                {safeData.map((_, i) => {
                  const gridX = left + i * slot;

                  return (
                    <line
                      key={`v-${i}`}
                      x1={gridX}
                      x2={gridX}
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
                  opacity="0.06"
                  pointerEvents="none"
                />

                {/* Gradient area */}
                <motion.path
                  d={areaPath}
                  fill={`url(#${chartId}-area)`}
                  initial={
                    !shouldReduceMotion
                      ? { opacity: 0 }
                      : false
                  }
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.6,
                    ease: "easeOut",
                  }}
                  pointerEvents="none"
                />

                {/* Main line */}
                <motion.path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={
                    !shouldReduceMotion
                      ? {
                          pathLength: 0,
                          opacity: 0.7,
                        }
                      : false
                  }
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                  }}
                  transition={
                    !shouldReduceMotion
                      ? {
                          pathLength: {
                            duration: 1.1,
                            ease: "easeOut",
                          },
                          opacity: {
                            duration: 0.3,
                          },
                        }
                      : { duration: 0 }
                  }
                  pointerEvents="none"
                />

                {/* Interactive points */}
                {points.map((point, index) => {
                  const isSelected = index === activeIndex;

                  return (
                    <g key={`point-${index}`}>
                      <motion.circle
                        id={`${chartId}-point-${index}`}
                        cx={point.x}
                        cy={point.y}
                        fill={isSelected ? "var(--color-text)" : color}
                        stroke="var(--color-background-secondary)"
                        strokeWidth={2}
                        role="button"
                        tabIndex={0}
                        aria-label={`${point.label}: ${format(point.value)}`}
                        aria-pressed={isSelected}
                        animate={{
                          r: isSelected ? 5 : 3,
                          opacity: isSelected ? 1 : 0.8,
                        }}
                        transition={{ duration: 0.12 }}
                        onClick={() => selectPoint(index)}
                        onPointerEnter={(event) => {
                          if (event.pointerType !== "touch") {
                            selectPoint(index);
                          }
                        }}
                        onFocus={() => selectPoint(index)}
                        onKeyDown={(event) => handlePointKeyDown(event, index)}
                        className="cursor-pointer outline-none"
                      />
                    </g>
                  );
                })}

                {/* X-axis labels */}
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
                    onClick={() => selectPoint(index)}
                  >
                    {item.label}
                  </text>
                ))}
              </svg>
            </div>

            {/* Fixed bottom axis and right boundary */}
            <svg
              className="pointer-events-none absolute inset-0 z-10 block h-full w-full"
              viewBox={`0 0 ${visibleWidth} ${H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                x1={left}
                x2={visibleWidth}
                y1={baseline}
                y2={baseline}
                stroke="var(--color-chart-grid)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />

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
