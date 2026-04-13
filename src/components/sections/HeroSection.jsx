import { useState } from 'react';

export default function HeroSection({ heroLayers, onPlannerClick }) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setParallax({ x, y });
  };

  const resetParallax = () => {
    setParallax({ x: 0, y: 0 });
  };

  return (
    <section id="home" className="hero-section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="slogan">Navigate Cairo Metro with Ease</div>
          <div className="more">
            Find your way through Cairo&apos;s metro system. Get real-time station information, route planning, and fare details for your journey.
          </div>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onPlannerClick}>Open Route Planner</button>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
        </div>

        <div
          className="parallax-frame mx-auto me-lg-0"
          aria-hidden="true"
          onMouseMove={handlePointerMove}
          onMouseLeave={resetParallax}
          onPointerMove={handlePointerMove}
          onPointerLeave={resetParallax}
        >
          {heroLayers.map((layer) => (
            <div
              key={layer.src}
              className={`parallax-layer ${layer.className}`.trim()}
              data-depth={layer.depth}
              style={{
                ...layer.style,
                transform: `${layer.transform} translate(${parallax.x * Number(layer.depth) * 40}px, ${parallax.y * Number(layer.depth) * 40}px)`
              }}
            >
              <img src={layer.src} alt="Cairo Metro illustration layer" width="1024" loading="lazy" decoding="async" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
