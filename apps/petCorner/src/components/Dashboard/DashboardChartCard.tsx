import { useEffect, useRef, useState } from "react";

import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

import type { DashboardChartSection } from "./dashboard.types";

type Props = DashboardChartSection;

export default function DashboardChartCard({
  title,
  subtitle,
  kind,
  data,
  emptyMessage,
}: Props) {
  const chartCanvasRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const element = chartCanvasRef.current;

    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      setChartWidth(Math.max(Math.floor(element.clientWidth), 0));
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(element);
    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const resolvedChartWidth = Math.max(chartWidth, 260);

  return (
    <section className="dashboard-panel dashboard-panel--chart">
      <header className="dashboard-panel__header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </header>

      {data.length ? (
        <>
          <div className="dashboard-chart-canvas" ref={chartCanvasRef}>
            {chartWidth > 0 ? kind === "donut" ? (
              <PieChart
                width={resolvedChartWidth}
                height={260}
                hideLegend
                skipAnimation
                series={[
                  {
                    innerRadius: 52,
                    outerRadius: 96,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    data: data.map((item, index) => ({
                      id: index,
                      label: item.label,
                      value: item.value,
                      color: item.accent,
                    })),
                  },
                ]}
              />
            ) : (
              <BarChart
                width={resolvedChartWidth}
                height={260}
                hideLegend
                skipAnimation
                axisHighlight={{ x: "none", y: "none" }}
                xAxis={[
                  {
                    scaleType: "band",
                    data: data.map((item) => item.label),
                  },
                ]}
                yAxis={[
                  {
                    width: 36,
                  },
                ]}
                series={[
                  {
                    data: data.map((item) => item.value),
                    color: data[0]?.accent ?? "#FB8B24",
                  },
                ]}
                margin={{ top: 16, right: 12, bottom: 28, left: 8 }}
              />
            ) : (
              <div className="dashboard-empty-state dashboard-empty-state--compact">
                Preparando grafico...
              </div>
            )}
          </div>

          <div className="dashboard-chart-legend">
            {data.map((item) => (
              <article className="dashboard-chart-legend__item" key={`${title}-${item.label}`}>
                <span
                  className="dashboard-chart-legend__swatch"
                  style={{ backgroundColor: item.accent ?? "#FB8B24" }}
                />

                <div>
                  <strong>
                    {item.label} <span>{item.value}</span>
                  </strong>
                  <small>{item.helper}</small>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="dashboard-empty-state">{emptyMessage}</div>
      )}
    </section>
  );
}
