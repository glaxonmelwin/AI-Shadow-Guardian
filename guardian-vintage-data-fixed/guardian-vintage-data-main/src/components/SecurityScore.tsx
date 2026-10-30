import { motion } from "framer-motion";

interface SecurityScoreProps {
  score: number; // 0-100
  size?: number;
}

export function SecurityScore({ score, size = 120 }: SecurityScoreProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = "#5a7247"; // sage green
  let label = "Strong";
  if (clampedScore < 30) { color = "#8b2500"; label = "Critical"; }
  else if (clampedScore < 50) { color = "#a0522d"; label = "At Risk"; }
  else if (clampedScore < 70) { color = "#b8860b"; label = "Moderate"; }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke="var(--border)"
          strokeWidth="8"
          opacity={0.3}
        />
        {/* Score arc */}
        <motion.circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          transform="rotate(-90 50 50)"
        />
        {/* Score text */}
        <text x="50" y="46" textAnchor="middle" className="fill-foreground" fontSize="20" fontWeight="bold" fontFamily="Georgia, serif">
          {clampedScore}
        </text>
        <text x="50" y="60" textAnchor="middle" className="fill-muted-foreground" fontSize="8" fontFamily="Inter, sans-serif">
          / 100
        </text>
      </svg>
      <span className="mt-1 text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
}
