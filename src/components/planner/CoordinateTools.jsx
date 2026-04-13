export default function CoordinateTools({
  values,
  status,
  onFieldChange,
  onImport,
  onLiveLocation,
  onClosestStation,
  onClosestRoute
}) {
  return (
    <section className="coord-tools" id="coordTools">
      <h2>Find Closest Station by Coordinates</h2>
      <p className="coord-help">Enter your current coordinates and destination coordinates, or use live location.</p>
      <div className="coord-link-grid">
        <label>
          <p>Current Location Link</p>
          <input
            id="currentLocationLink"
            className="coord-link-input"
            type="text"
            placeholder="Paste Google Maps / Apple Maps / Waze / OSM link or lat,lng"
            value={values.currentLocationLink}
            onChange={(event) => onFieldChange('currentLocationLink', event.target.value)}
          />
        </label>
        <label>
          <p>Destination Location Link</p>
          <input
            id="destLocationLink"
            className="coord-link-input"
            type="text"
            placeholder="Paste location app link or lat,lng"
            value={values.destLocationLink}
            onChange={(event) => onFieldChange('destLocationLink', event.target.value)}
          />
        </label>
      </div>
      <div className="coord-grid">
        <label><p>Current Latitude</p><input id="currentLat" type="number" step="any" placeholder="e.g. 30.0444" value={values.currentLat} onChange={(event) => onFieldChange('currentLat', event.target.value)} /></label>
        <label><p>Current Longitude</p><input id="currentLng" type="number" step="any" placeholder="e.g. 31.2357" value={values.currentLng} onChange={(event) => onFieldChange('currentLng', event.target.value)} /></label>
        <label><p>Destination Latitude</p><input id="destLat" type="number" step="any" placeholder="e.g. 30.0100" value={values.destLat} onChange={(event) => onFieldChange('destLat', event.target.value)} /></label>
        <label><p>Destination Longitude</p><input id="destLng" type="number" step="any" placeholder="e.g. 31.2000" value={values.destLng} onChange={(event) => onFieldChange('destLng', event.target.value)} /></label>
      </div>
      <div className="coord-actions">
        <button type="button" className="btn btn-secondary" onClick={onImport}>Import Coordinates From Links</button>
        <button type="button" className="btn btn-secondary" onClick={onLiveLocation}>Use Live Location</button>
        <button type="button" className="btn btn-primary" onClick={onClosestStation}>Closest Station To Me</button>
        <button type="button" className="btn btn-primary" onClick={onClosestRoute}>Find Closest Start & End</button>
      </div>
      <div id="coordResult" className="coord-result">{status}</div>
    </section>
  );
}
