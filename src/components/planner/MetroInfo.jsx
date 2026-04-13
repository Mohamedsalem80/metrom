export default function MetroInfo({ fareBands, metroLines }) {
  return (
    <>
      <section className="fares-section" id="fares" role="region" aria-label="Ticket Fares">
        <h2>Metro Fare Table</h2>
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
      </section>

      <section className="lines-section" id="lineStations" role="region" aria-label="Metro lines and stations">
        <h2>Metro Lines and Stations Table</h2>
        <div className="lines-table-wrap">
          <table className="lines-table">
            <thead>
              <tr>
                <th>Line</th>
                <th>Route</th>
                <th>Stations</th>
              </tr>
            </thead>
            <tbody>
              {metroLines.map((line) => (
                <tr key={line.id}>
                  <td>{line.id === 'one' ? 'Line 1' : line.id === 'two' ? 'Line 2' : 'Line 3'}</td>
                  <td>{line.routeLabel}</td>
                  <td>
                    <div className="stations-row" aria-label={`${line.id} stations`}>
                      {line.stations.map((station) => (
                        <span className="station-pill" key={station}>{station}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
