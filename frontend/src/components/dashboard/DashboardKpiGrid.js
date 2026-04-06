import React, { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

function AnimatedValue({ value, prefix = "", suffix = "", decimals = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const nextValue = Number(value) || 0;
    const controls = animate(previousValue.current, nextValue, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => {
        previousValue.current = latest;
        setDisplayValue(latest);
      },
    });

    return () => controls.stop();
  }, [value]);

  return (
    <span>
      {prefix}
      {new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(displayValue)}
      {suffix}
    </span>
  );
}

export default function DashboardKpiGrid({ items }) {
  return (
    <div className="role-kpi-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <motion.div key={item.label} className="glass-card kpi-card" whileHover={{ y: -3 }}>
            <div className="kpi-card-head">
              <div className="kpi-card-icon">
                <Icon size={18} />
              </div>
              <ArrowUpRight size={16} />
            </div>
            <span>{item.label}</span>
            <strong>
              <AnimatedValue
                value={item.value}
                prefix={item.prefix}
                suffix={item.suffix}
                decimals={item.decimals}
              />
            </strong>
          </motion.div>
        );
      })}
    </div>
  );
}
