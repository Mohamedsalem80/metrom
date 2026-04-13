export default function FeatureSection({ featureCards }) {
  return (
    <section className="features" id="features" role="region" aria-label="Platform Features">
      <div className="container">
        <div className="section-heading text-center">
          <h2>Features</h2>
          <p>Everything you need to navigate Cairo Metro</p>
        </div>
        <div className="features-grid">
          {featureCards.map((card) => (
            <article className="feature-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
