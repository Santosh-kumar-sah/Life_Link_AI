import React, { useEffect, useRef } from "react";

export const MoleculesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let particles: Particle[] = [];
    const isMobile = width < 768;
    const maxParticles = isMobile ? 22 : 55;
    const connectionDist = 140;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Super slow organic cell floating
        this.vx = prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.15;
        this.vy = prefersReducedMotion ? 0 : (Math.random() - 0.5) * 0.15;
        // Cell sizes
        this.radius = Math.random() * 5 + 3;
        this.alpha = Math.random() * 0.08 + 0.06;
        // Warm organic shades: Pine Teal or Soft Sand
        this.color = Math.random() > 0.5 ? "31, 111, 92" : "232, 226, 212";
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        // Cell boundary
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();

        // Faint inner nucleus
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha * 1.5})`;
        ctx.fill();
      }

      update() {
        if (prefersReducedMotion) return;
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around boundaries
        if (this.x < -10) this.x = width + 10;
        if (this.x > width + 10) this.x = -10;
        if (this.y < -10) this.y = height + 10;
        if (this.y > height + 10) this.y = -10;
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
      }
    };

    init();

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(31, 111, 92, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    let isActive = true;

    const animate = () => {
      if (!isActive) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      drawConnections();

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
      if (prefersReducedMotion) {
        // Redraw once
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p) => p.draw());
        drawConnections();
      }
    };

    window.addEventListener("resize", handleResize);

    // Pause when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        cancelAnimationFrame(animationFrameId);
      } else {
        isActive = true;
        animate();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Pause when hero out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isActive) {
              isActive = true;
              animate();
            }
          } else {
            isActive = false;
            cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: 0.01 }
    );

    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: "multiply" }}
    />
  );
};

export default MoleculesBackground;
