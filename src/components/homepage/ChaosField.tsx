"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { chaosIcons } from "./content";

interface Particle {
  baseScale: number;
  el: HTMLElement;
  pulseOffset: number;
  rot: number;
  rotSpeed: number;
  size: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
}

const MOUSE_OFFSCREEN = -9_999;
const REPEL_RADIUS = 90;

export function ChaosField() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const containerElement = container;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    const iconElements = Array.from(
      containerElement.querySelectorAll<HTMLElement>("[data-chaos-icon]"),
    );

    const state = {
      height: containerElement.clientHeight,
      mouseX: MOUSE_OFFSCREEN,
      mouseY: MOUSE_OFFSCREEN,
      width: containerElement.clientWidth,
    };

    const particles: Particle[] = iconElements.map((element, index) => {
      const size = element.offsetWidth || 56;

      return {
        baseScale: 0.92 + Math.random() * 0.22,
        el: element,
        pulseOffset: index * 0.8,
        rot: Math.random() * 80 - 40,
        rotSpeed: (Math.random() - 0.5) * 0.22,
        size,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        x: Math.random() * Math.max(1, state.width - size),
        y: Math.random() * Math.max(1, state.height - size),
      };
    });

    let animationFrameId = 0;

    function animate(timestamp: number) {
      state.width = containerElement.clientWidth;
      state.height = containerElement.clientHeight;

      particles.forEach((particle) => {
        const centerX = particle.x + particle.size / 2;
        const centerY = particle.y + particle.size / 2;
        const deltaX = centerX - state.mouseX;
        const deltaY = centerY - state.mouseY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < REPEL_RADIUS) {
          const force = (REPEL_RADIUS - distance) / REPEL_RADIUS;
          const safeDistance = Math.max(distance, 0.001);

          particle.vx += (deltaX / safeDistance) * force * 0.65;
          particle.vy += (deltaY / safeDistance) * force * 0.65;
        }

        particle.vx *= 0.987;
        particle.vy *= 0.987;

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.rot += particle.rotSpeed;

        const maxX = state.width - particle.size;
        const maxY = state.height - particle.size;

        if (particle.x <= 0) {
          particle.x = 0;
          particle.vx = Math.abs(particle.vx);
        } else if (particle.x >= maxX) {
          particle.x = maxX;
          particle.vx = -Math.abs(particle.vx);
        }

        if (particle.y <= 0) {
          particle.y = 0;
          particle.vy = Math.abs(particle.vy);
        } else if (particle.y >= maxY) {
          particle.y = maxY;
          particle.vy = -Math.abs(particle.vy);
        }

        const wave = Math.sin(timestamp / 560 + particle.pulseOffset);
        const scale = particle.baseScale + wave * 0.06;

        particle.el.style.transform = `translate(${particle.x}px, ${particle.y}px) rotate(${particle.rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      });

      animationFrameId = window.requestAnimationFrame(animate);
    }

    function handleMouseMove(event: MouseEvent) {
      const rect = containerElement.getBoundingClientRect();
      state.mouseX = event.clientX - rect.left;
      state.mouseY = event.clientY - rect.top;
    }

    function handleMouseLeave() {
      state.mouseX = MOUSE_OFFSCREEN;
      state.mouseY = MOUSE_OFFSCREEN;
    }

    function handleResize() {
      state.width = containerElement.clientWidth;
      state.height = containerElement.clientHeight;
    }

    containerElement.addEventListener("mousemove", handleMouseMove);
    containerElement.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      containerElement.removeEventListener("mousemove", handleMouseMove);
      containerElement.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className="relative h-75 overflow-hidden rounded-xl border border-dashed border-slate-400/35 bg-linear-to-b from-slate-800/40 to-slate-950/60"
      ref={containerRef}
    >
      {chaosIcons.map((icon) => (
        <button
          className={cn(
            "absolute inline-flex size-14 cursor-default items-center justify-center rounded-xl border bg-slate-700/85 font-mono text-xs font-semibold text-slate-100 shadow-xl shadow-black/20 sm:size-[3.6rem]",
            icon.tone,
          )}
          data-chaos-icon={icon.id}
          key={icon.id}
          type="button"
        >
          {icon.label}
        </button>
      ))}
    </div>
  );
}
