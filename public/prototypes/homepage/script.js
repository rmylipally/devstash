const nav = document.getElementById("siteNav");
const yearEl = document.getElementById("year");
const reveals = document.querySelectorAll(".reveal");
const billingButtons = document.querySelectorAll(".toggle-btn");
const priceEls = document.querySelectorAll(".price");

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

function handleNavScroll() {
  if (!nav) {
    return;
  }

  if (window.scrollY > 24) {
    nav.classList.add("scrolled");
  } else {
    nav.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", handleNavScroll, { passive: true });
handleNavScroll();

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.15 },
);

reveals.forEach((el) => observer.observe(el));

billingButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.billing;

    billingButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    priceEls.forEach((priceEl) => {
      if (!(priceEl instanceof HTMLElement)) {
        return;
      }

      const nextPrice = mode === "yearly" ? priceEl.dataset.yearly : priceEl.dataset.monthly;

      if (nextPrice) {
        priceEl.textContent = nextPrice;
      }
    });
  });
});

const chaosField = document.getElementById("chaosField");

if (chaosField) {
  const iconEls = Array.from(chaosField.querySelectorAll(".floating-icon"));
  const state = {
    mouseX: -9999,
    mouseY: -9999,
    width: chaosField.clientWidth,
    height: chaosField.clientHeight,
  };

  const particles = iconEls.map((icon, index) => {
    const size = icon.offsetWidth || 56;
    const x = Math.random() * Math.max(1, state.width - size);
    const y = Math.random() * Math.max(1, state.height - size);

    const particle = {
      el: icon,
      x,
      y,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.4,
      baseScale: 0.92 + Math.random() * 0.22,
      pulseOffset: index * 0.8,
      size,
      rot: Math.random() * 80 - 40,
      rotSpeed: (Math.random() - 0.5) * 0.22,
    };

    icon.style.transform = `translate(${x}px, ${y}px)`;

    return particle;
  });

  const repelRadius = 90;

  function step(timestamp) {
    state.width = chaosField.clientWidth;
    state.height = chaosField.clientHeight;

    particles.forEach((p) => {
      const centerX = p.x + p.size / 2;
      const centerY = p.y + p.size / 2;
      const dx = centerX - state.mouseX;
      const dy = centerY - state.mouseY;
      const dist = Math.hypot(dx, dy);

      if (dist < repelRadius) {
        const force = (repelRadius - dist) / repelRadius;
        const safeDist = Math.max(dist, 0.001);
        p.vx += (dx / safeDist) * force * 0.65;
        p.vy += (dy / safeDist) * force * 0.65;
      }

      p.vx *= 0.987;
      p.vy *= 0.987;

      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rotSpeed;

      const maxX = state.width - p.size;
      const maxY = state.height - p.size;

      if (p.x <= 0) {
        p.x = 0;
        p.vx = Math.abs(p.vx);
      } else if (p.x >= maxX) {
        p.x = maxX;
        p.vx = -Math.abs(p.vx);
      }

      if (p.y <= 0) {
        p.y = 0;
        p.vy = Math.abs(p.vy);
      } else if (p.y >= maxY) {
        p.y = maxY;
        p.vy = -Math.abs(p.vy);
      }

      const wave = Math.sin(timestamp / 560 + p.pulseOffset);
      const scale = p.baseScale + wave * 0.06;

      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });

    requestAnimationFrame(step);
  }

  chaosField.addEventListener("mousemove", (event) => {
    const rect = chaosField.getBoundingClientRect();
    state.mouseX = event.clientX - rect.left;
    state.mouseY = event.clientY - rect.top;
  });

  chaosField.addEventListener("mouseleave", () => {
    state.mouseX = -9999;
    state.mouseY = -9999;
  });

  window.addEventListener("resize", () => {
    state.width = chaosField.clientWidth;
    state.height = chaosField.clientHeight;
  });

  requestAnimationFrame(step);
}
