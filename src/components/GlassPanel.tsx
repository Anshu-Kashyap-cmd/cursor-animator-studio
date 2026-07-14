import React from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface GlassPanelProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  intensity = "medium",
  ...props
}) => {
  // Map intensity to backdrop-blur strengths
  const blurStrength =
    intensity === "low" ? "blur(10px)" : intensity === "high" ? "blur(24px)" : "blur(18px)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
        backdropFilter: blurStrength,
        WebkitBackdropFilter: blurStrength,
        border: "1px solid rgba(255, 255, 255, 0.14)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        ...props.style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
