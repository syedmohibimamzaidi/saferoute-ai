// components/RiskGauge.jsx — SVG arc gauge for the risk score.

import { riskStyle } from "../lib/format.js";

export default function RiskGauge({ score, level }) {
  const style = riskStyle(level);

  // Geometry for a 3/4-circle arc gauge.
  const size = 132;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Arc spans 270° (from 135° to 405°). Full circumference of that arc:
  const arcFraction = 0.75;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * arcFraction;
  const filled = arcLength * (Math.max(0, Math.min(100, score)) / 100);

  // Rotate so the gap sits at the bottom.
  const rotation = 135;

  return (
    <div className="gauge-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${arcLength} ${circumference}`}
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
        {/* Filled portion */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={style.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform={`rotate(${rotation} ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        {/* Center label */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="30"
          fontWeight="700"
          fill={style.color}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          / 100
        </text>
      </svg>
    </div>
  );
}
