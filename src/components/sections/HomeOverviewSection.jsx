function buildHomeStats(metroLines, fareBands) {
  return [
    {
      value: metroLines.length,
      label: 'Metro Lines',
      detail: 'All active Cairo Metro corridors in one place.'
    },
    {
      value: metroLines.reduce((total, line) => total + line.stations.length, 0),
      label: 'Stations Covered',
      detail: 'Full station coverage for route planning.'
    },
    {
      value: fareBands.length,
      label: 'Fare Bands',
      detail: 'Clear pricing tiers for each trip length.'
    }
  ];
}

const quickSteps = [
  {
    title: 'Choose a route',
    text: 'Open the planner and pick your start and end stations.'
  },
  {
    title: 'Check the fare',
    text: 'See ticket cost, transfer guidance, and estimated time immediately.'
  },
  {
    title: 'Use the planner map',
    text: 'Review the live map inside the planner for route and travel visualization.'
  }
];

export default function HomeOverviewSection({ metroLines, fareBands }) {
  const homeStats = buildHomeStats(metroLines, fareBands);

  return (
    <section className="home-overview" aria-label="Metro overview">
      <div className="container">
        <div className="section-heading text-center">
          <h2>Metro at a Glance</h2>
          <p>A compact snapshot of the network, pricing, and next steps.</p>
        </div>

        <div className="overview-stats">
          {homeStats.map((stat) => (
            <article className="overview-card" key={stat.label}>
              <div className="overview-value">{stat.value}</div>
              <div className="overview-label">{stat.label}</div>
              <p>{stat.detail}</p>
            </article>
          ))}
        </div>

        <div className="overview-divider">
          <span>How it works</span>
        </div>

        <div className="overview-steps" aria-label="Quick steps">
          {quickSteps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <div className="step-head">
                <div className="step-index">0{index + 1}</div>
                <h3>{step.title}</h3>
              </div>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}