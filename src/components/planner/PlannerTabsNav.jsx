export default function PlannerTabsNav({ activeTab, onTabChange }) {
  return (
    <div className="tabs-nav" role="tablist" aria-label="Metro tools sections">
      <button
        type="button"
        className={`tab-btn ${activeTab === 'tab-planner' ? 'active' : ''}`}
        data-tab-target="tab-planner"
        id="tab-btn-planner"
        role="tab"
        aria-controls="tab-planner"
        aria-selected={activeTab === 'tab-planner'}
        tabIndex={activeTab === 'tab-planner' ? 0 : -1}
        onClick={() => onTabChange('tab-planner')}
      >
        Planner
      </button>
      <button
        type="button"
        className={`tab-btn ${activeTab === 'tab-coordinates' ? 'active' : ''}`}
        data-tab-target="tab-coordinates"
        id="tab-btn-coordinates"
        role="tab"
        aria-controls="tab-coordinates"
        aria-selected={activeTab === 'tab-coordinates'}
        tabIndex={activeTab === 'tab-coordinates' ? 0 : -1}
        onClick={() => onTabChange('tab-coordinates')}
      >
        Coordinates
      </button>
    </div>
  );
}
