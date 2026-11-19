"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

const statistics = [
  { label: "Signature dishes", value: 12 },
  { label: "Years of culinary experience", value: 18 },
  { label: "Guests welcomed", value: 12400 },
  { label: "Culinary awards", value: 4 },
];

function AnimatedStatistic({
  label,
  value,
}: (typeof statistics)[number]) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const reducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const displayCount = useTransform(count, (current) =>
    Math.round(current).toLocaleString("en-IN"),
  );

  useEffect(() => {
    if (!isInView) return;

    if (reducedMotion) {
      count.set(value);
      return;
    }

    const controls = animate(count, value, {
      duration: 1.6,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [count, isInView, reducedMotion, value]);

  return (
    <div className="about-statistic" ref={ref}>
      <motion.span
        aria-label={`${value.toLocaleString("en-IN")} ${label}`}
        className="about-statistic-value"
      >
        {displayCount}
      </motion.span>
      <span className="about-statistic-label">{label}</span>
    </div>
  );
}

export function ExperienceStats() {
  return (
    <section
      aria-labelledby="about-experience-title"
      className="about-experience"
      id="experience"
    >
      <div className="about-experience-heading">
        <span className="eyebrow eyebrow-dark">A little perspective</span>
        <h2 id="about-experience-title">
          The experience,
          <br />
          <em>in numbers.</em>
        </h2>
      </div>

      <div className="about-statistics">
        {statistics.map((statistic) => (
          <AnimatedStatistic key={statistic.label} {...statistic} />
        ))}
      </div>

      <p className="about-statistics-note">
        Demonstration figures for this fictional restaurant concept. Guest
        totals and award counts are illustrative only; no real awards or
        customer statistics are claimed.
      </p>
    </section>
  );
}
