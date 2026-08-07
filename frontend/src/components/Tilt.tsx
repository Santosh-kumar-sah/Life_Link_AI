import React, { useState, useEffect, useRef, MouseEvent } from "react";

interface TiltProps {
  children: React.ReactNode;
  className?: string;
  maxRotation?: number; // default: 8 degrees
  scale?: number; // default: 1.02
}

export const Tilt: React.FC<TiltProps> = ({
  children,
  className = "",
  maxRotation = 6, // Slightly reduced to be even more subtle & precise
  scale = 1.02
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transformStyle, setTransformStyle] = useState<string>("rotateX(0deg) rotateY(0deg) scale(1)");
  const [shouldDisableTilt, setShouldDisableTilt] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setShouldDisableTilt(isTouch || prefersReduced);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (shouldDisableTilt) return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to card center
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Calculate rotation angles
    const rotateX = -(mouseY / (height / 2)) * maxRotation;
    const rotateY = (mouseX / (width / 2)) * maxRotation;

    setTransformStyle(`rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale})`);
  };

  const handleMouseLeave = () => {
    if (shouldDisableTilt) return;
    setTransformStyle("rotateX(0deg) rotateY(0deg) scale(1)");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: shouldDisableTilt ? undefined : transformStyle,
        transition: "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)",
      }}
      className={`perspective-container preserve-3d transition-transform duration-200 active:scale-[0.98] ${className}`}
    >
      {children}
    </div>
  );
};

export default Tilt;
