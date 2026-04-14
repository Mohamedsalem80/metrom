import { useState } from 'react';

function getLineNumber(lineId) {
  return lineId === 'one' ? 1 : lineId === 'two' ? 2 : 3;
}

function getLineColor(lineId) {
  const colors = { one: '#EF4444', two: '#F97316', three: '#22C55E' };
  return colors[lineId] || '#FFC686';
}

export default function MetroInfo({ fareBands, metroLines }) {
  const [expandedLine, setExpandedLine] = useState(null);
  const [showFares, setShowFares] = useState(true);

  const toggleLine = (lineId) => {
    setExpandedLine(expandedLine === lineId ? null : lineId);
  };

  return (
    <>
      <section className="fares-section" id="fares" role="region" aria-label="Ticket Fares">
        <div className="fares-header" onClick={() => setShowFares(!showFares)}>
          <h2>Metro Fare Table</h2>
          <span className={`fares-toggle ${showFares ? 'open' : ''}`}>▼</span>
        </div>
        {showFares && (
          <div className="fares-table-wrap">
            <table className="fares-table">
              <thead>
                <tr>
                  <th>Distance</th>
                  <th>Ticket Price (Lines 1,2,3)</th>
                  <th>Elderly (Over 60) / Army / Police</th>
                  <th>Special Needs</th>
                </tr>
              </thead>
              <tbody>
                {fareBands.map((band) => (
                  <tr key={band.distance}>
                    <td>{band.distance}</td>
                    <td>{band.ticket}</td>
                    <td>{band.elderly}</td>
                    <td>{band.specialNeeds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="lines-section" id="lineStations" role="region" aria-label="Metro lines and stations">
        <h2>Lines & Station Network</h2>
        <div className="metro-lines-accordion">
          {metroLines.map((line) => (
            <div key={line.id} className="metro-line-item">
              <button
                className="metro-line-header"
                onClick={() => toggleLine(line.id)}
                aria-expanded={expandedLine === line.id}
              >
                <span className="line-badge" style={{ backgroundColor: getLineColor(line.id) }}>
                  {getLineNumber(line.id)}
                </span>
                <div className="line-info">
                  <span className="line-name">Line {getLineNumber(line.id)}</span>
                  <span className="line-route">{line.routeLabel}</span>
                </div>
                <span className={`line-toggle ${expandedLine === line.id ? 'open' : ''}`}>▼</span>
              </button>
              {expandedLine === line.id && (
                <div className="metro-line-content">
                  <div className="station-count">Station Directory ({line.stations.length})</div>
                  <div className="stations-grid">
                    {line.stations.map((station) => (
                      <span className="station-pill" key={station}>{station}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
