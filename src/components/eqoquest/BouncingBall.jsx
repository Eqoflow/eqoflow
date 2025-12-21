import React, { useEffect, useRef } from "react";

export default function BouncingBall({ color = "var(--color-primary)" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let x = Math.random() * canvas.width;
    let y = Math.random() * canvas.height;
    let dx = (Math.random() - 0.5) * 2;
    let dy = (Math.random() - 0.5) * 2;
    const radius = 30;

    // Get computed color value
    const computedColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ball with gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, computedColor + "60");
      gradient.addColorStop(1, computedColor + "10");
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Update position
      x += dx;
      y += dy;

      // Bounce off walls
      if (x + radius > canvas.width || x - radius < 0) {
        dx = -dx;
      }
      if (y + radius > canvas.height || y - radius < 0) {
        dy = -dy;
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.4 }}
    />
  );
}