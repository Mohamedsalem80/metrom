function getLineStations(metroLines, lineId) {
  return metroLines.find((line) => line.id === lineId)?.stations || [];
}

function SummaryStat({ label, id, value }) {
  return (
    <div className="result-stat">
      <div className="result-stat-label">{label}</div>
      <div className="result-stat-value" id={id}>{value}</div>
    </div>
  );
}

export default function PlannerTripForm({
  metroLines,
  plannerState,
  results,
  onStartLineChange,
  onStartStationChange,
  onEndLineChange,
  onEndStationChange,
  onCalculate,
  onStartTravel,
  onReset,
  onSaveTrip,
  tripSaveStatus,
  isTraveling
}) {
  const plannerLineSelectOptions = metroLines.map((line) => ({ value: line.id, label: line.label }));
  const startStations = getLineStations(metroLines, plannerState.startLine);
  const endStations = getLineStations(metroLines, plannerState.endLine);
  const hasError = Boolean(results.error);
  const hasRoute = results.route.length > 0;

  return (
    <>
      <div className="planner-container">
        <div className="planner-section" id="planner">
          <h2>From (Starting Point)</h2>
          <label>
            <p>Select Line:</p>
            <div className="label-row">
              <select name="line" id="sline" autoComplete="off" value={plannerState.startLine} onChange={(event) => onStartLineChange(event.target.value)}>
                {plannerLineSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </label>
          <label>
            <p>Select Station:</p>
            <select name="pickup" autoComplete="off" value={plannerState.startStation} onChange={(event) => onStartStationChange(event.target.value)}>
              {startStations.map((station) => (
                <option key={station} value={station}>{station}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="planner-section">
          <h2>To (Destination)</h2>
          <label>
            <p>Select Line:</p>
            <div className="label-row">
              <select name="line" id="eline" autoComplete="off" value={plannerState.endLine} onChange={(event) => onEndLineChange(event.target.value)}>
                {plannerLineSelectOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </label>
          <label>
            <p>Select Station:</p>
            <select name="dropoff" autoComplete="off" value={plannerState.endStation} onChange={(event) => onEndStationChange(event.target.value)}>
              {endStations.map((station) => (
                <option key={station} value={station}>{station}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="action-buttons">
        <button type="button" className="btn btn-primary" onClick={onCalculate}>Find Route & Price</button>
        <button type="button" id="startTravelBtn" className="btn btn-primary" onClick={onStartTravel}>{isTraveling ? 'Stop Traveling' : 'Start Traveling'}</button>
        <button type="button" className="btn btn-secondary" onClick={onReset}>Reset</button>
      </div>

      <div id="resultsContainer" className={`results ${results.visible ? 'show' : ''}`}>
        {hasError ? (
          <div className="result-item result-item-error" role="alert" aria-live="assertive">
            <div className="result-item-header">
              <span className="result-item-icon">Notice</span>
              <h3>Unable to build this route yet</h3>
            </div>
            <p className="result-error-message">{results.error}</p>
            <p className="result-error-help">Pick a different start or destination station, then try again.</p>
          </div>
        ) : (
          <div className="result-item">
            <div className="result-item-header">
              <span className="result-item-icon">Fare</span>
              <h3>Your Journey Summary</h3>
            </div>
            <div className="result-item-content">
              <SummaryStat label="Total Stations" id="cstats" value={results.stationsCount} />
              <SummaryStat label="Ticket Price" id="ticketCost" value={results.fares.regular} />
              <SummaryStat label="Elderly / Army / Police" id="elderlyCost" value={results.fares.elderly} />
              <SummaryStat label="Special Needs" id="specialNeedsCost" value={results.fares.special} />
              <SummaryStat label="Estimated Trip Time" id="estimatedTime" value={results.estimatedTime} />
            </div>

            {hasRoute ? (
              <div className="route-visualization">
                <div className="route-label">Complete Route</div>
                <div className="route-stations" id="stationsList">
                  {results.route.map((station, index) => (
                    <span
                      key={`${station}-${index}`}
                      className={`station-badge ${index === 0 ? 'start' : ''} ${index === results.route.length - 1 ? 'end' : ''} ${results.transferStation === station ? 'transfer' : ''}`.trim()}
                    >
                      {station}
                    </span>
                  ))}
                </div>
                <div className="route-path" id="stations">{results.route.join(' → ')}</div>
                <div className="transfer-guide" id="transferGuide">{results.transferGuide}</div>
                <div className="trip-save-row">
                  <button type="button" className="btn btn-secondary" onClick={onSaveTrip}>Save Trip</button>
                </div>
                {tripSaveStatus?.message ? (
                  <p className={`trip-save-status ${tripSaveStatus.type === 'error' ? 'error' : 'success'}`} role="status" aria-live="polite">
                    {tripSaveStatus.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
