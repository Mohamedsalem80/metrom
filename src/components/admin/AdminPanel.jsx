import { useEffect, useState } from 'react';
import {
  createFareBand,
  createMetroLine,
  createMetroStation,
  deleteFareBand,
  deleteMetroLine,
  deleteMetroStation,
  getAdminMetroConfig,
  updateFareBand,
  updateMetroLine,
  updateMetroStation
} from '../../utils/metroApi';

export default function AdminPanel({ accessToken, onRefreshMetroConfig }) {
  const [config, setConfig] = useState({ lines: [], fareBands: [] });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [lineForm, setLineForm] = useState({ id: '', label: '', routeLabel: '' });
  const [stationForm, setStationForm] = useState({ lineId: '', name: '', sortOrder: 0 });
  const [fareForm, setFareForm] = useState({ distance: '', minStations: 0, maxStations: 0, ticket: '', elderly: '', specialNeeds: '' });

  const refreshData = async () => {
    const result = await getAdminMetroConfig(accessToken);
    if (!result.ok) {
      setStatus({ type: 'error', message: result.message || 'Unable to load admin data.' });
      return;
    }

    setConfig({ lines: result.lines, fareBands: result.fareBands });
    setStatus({ type: '', message: '' });
  };

  useEffect(() => {
    refreshData();
  }, [accessToken]);

  const notifyResult = async (result, successMessage) => {
    if (!result.ok) {
      setStatus({ type: 'error', message: result.message || 'Operation failed.' });
      return;
    }

    setStatus({ type: 'success', message: successMessage });
    await refreshData();
    await onRefreshMetroConfig();
  };

  const handleCreateLine = async (event) => {
    event.preventDefault();
    const result = await createMetroLine(accessToken, {
      id: lineForm.id.trim(),
      label: lineForm.label.trim(),
      routeLabel: lineForm.routeLabel.trim()
    });
    await notifyResult(result, 'Line created.');
    if (result.ok) setLineForm({ id: '', label: '', routeLabel: '' });
  };

  const handleCreateStation = async (event) => {
    event.preventDefault();
    const result = await createMetroStation(accessToken, {
      lineId: stationForm.lineId,
      name: stationForm.name.trim(),
      sortOrder: Number(stationForm.sortOrder)
    });
    await notifyResult(result, 'Station created.');
    if (result.ok) setStationForm((prev) => ({ ...prev, name: '', sortOrder: 0 }));
  };

  const handleCreateFare = async (event) => {
    event.preventDefault();
    const result = await createFareBand(accessToken, {
      distance: fareForm.distance.trim(),
      minStations: Number(fareForm.minStations),
      maxStations: Number(fareForm.maxStations),
      ticket: fareForm.ticket.trim(),
      elderly: fareForm.elderly.trim(),
      specialNeeds: fareForm.specialNeeds.trim()
    });
    await notifyResult(result, 'Fare band created.');
    if (result.ok) setFareForm({ distance: '', minStations: 0, maxStations: 0, ticket: '', elderly: '', specialNeeds: '' });
  };

  const handleQuickEditLine = async (line) => {
    const nextLabel = window.prompt('Update line label:', line.label);
    if (!nextLabel) return;
    const nextRoute = window.prompt('Update route label:', line.routeLabel);
    if (!nextRoute) return;
    const result = await updateMetroLine(accessToken, line.id, { label: nextLabel, routeLabel: nextRoute });
    await notifyResult(result, 'Line updated.');
  };

  const handleQuickEditStation = async (lineId, station) => {
    const nextName = window.prompt('Update station name:', station.name);
    if (!nextName) return;
    const nextOrderRaw = window.prompt('Update station order:', String(station.sortOrder));
    if (nextOrderRaw === null) return;
    const nextOrder = Number(nextOrderRaw);
    if (!Number.isFinite(nextOrder)) return;

    const result = await updateMetroStation(accessToken, station.id, {
      lineId,
      name: nextName,
      sortOrder: nextOrder
    });
    await notifyResult(result, 'Station updated.');
  };

  const handleQuickEditFare = async (fare) => {
    const nextDistance = window.prompt('Update distance label:', fare.distance);
    if (!nextDistance) return;
    const nextTicket = window.prompt('Update ticket price:', fare.ticket);
    if (!nextTicket) return;

    const result = await updateFareBand(accessToken, fare.id, {
      distance: nextDistance,
      ticket: nextTicket
    });
    await notifyResult(result, 'Fare band updated.');
  };

  return (
    <section className="planner-page" aria-label="Admin panel">
      <div className="container">
        <div className="page-title">
          <h1>Admin Panel</h1>
          <p>Manage lines, stations, and fare bands directly from the database.</p>
        </div>

        {status.message ? (
          <p className={`trip-save-status ${status.type === 'error' ? 'error' : 'success'}`}>{status.message}</p>
        ) : null}

        <div className="profile-shell">
          <div className="profile-card">
            <h2>Create Metro Line</h2>
            <form className="profile-edit-form" onSubmit={handleCreateLine}>
              <label>
                <span>Line ID</span>
                <input className="auth-input" value={lineForm.id} onChange={(event) => setLineForm((prev) => ({ ...prev, id: event.target.value }))} placeholder="one" />
              </label>
              <label>
                <span>Line Label</span>
                <input className="auth-input" value={lineForm.label} onChange={(event) => setLineForm((prev) => ({ ...prev, label: event.target.value }))} />
              </label>
              <label>
                <span>Route Label</span>
                <input className="auth-input" value={lineForm.routeLabel} onChange={(event) => setLineForm((prev) => ({ ...prev, routeLabel: event.target.value }))} />
              </label>
              <div className="profile-edit-actions">
                <button type="submit" className="btn btn-primary">Add Line</button>
              </div>
            </form>
          </div>

          <div className="profile-card">
            <h2>Create Station</h2>
            <form className="profile-edit-form" onSubmit={handleCreateStation}>
              <label>
                <span>Line</span>
                <select className="auth-input" value={stationForm.lineId} onChange={(event) => setStationForm((prev) => ({ ...prev, lineId: event.target.value }))}>
                  <option value="">Choose line</option>
                  {config.lines.map((line) => (
                    <option key={line.id} value={line.id}>{line.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Station Name</span>
                <input className="auth-input" value={stationForm.name} onChange={(event) => setStationForm((prev) => ({ ...prev, name: event.target.value }))} />
              </label>
              <label>
                <span>Sort Order</span>
                <input className="auth-input" type="number" value={stationForm.sortOrder} onChange={(event) => setStationForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) }))} />
              </label>
              <div className="profile-edit-actions">
                <button type="submit" className="btn btn-primary">Add Station</button>
              </div>
            </form>
          </div>

          <div className="profile-card">
            <h2>Create Fare Band</h2>
            <form className="profile-edit-form" onSubmit={handleCreateFare}>
              <label>
                <span>Distance Label</span>
                <input className="auth-input" value={fareForm.distance} onChange={(event) => setFareForm((prev) => ({ ...prev, distance: event.target.value }))} />
              </label>
              <label>
                <span>Min Stations</span>
                <input className="auth-input" type="number" value={fareForm.minStations} onChange={(event) => setFareForm((prev) => ({ ...prev, minStations: Number(event.target.value) }))} />
              </label>
              <label>
                <span>Max Stations</span>
                <input className="auth-input" type="number" value={fareForm.maxStations} onChange={(event) => setFareForm((prev) => ({ ...prev, maxStations: Number(event.target.value) }))} />
              </label>
              <label>
                <span>Ticket</span>
                <input className="auth-input" value={fareForm.ticket} onChange={(event) => setFareForm((prev) => ({ ...prev, ticket: event.target.value }))} />
              </label>
              <label>
                <span>Elderly</span>
                <input className="auth-input" value={fareForm.elderly} onChange={(event) => setFareForm((prev) => ({ ...prev, elderly: event.target.value }))} />
              </label>
              <label>
                <span>Special Needs</span>
                <input className="auth-input" value={fareForm.specialNeeds} onChange={(event) => setFareForm((prev) => ({ ...prev, specialNeeds: event.target.value }))} />
              </label>
              <div className="profile-edit-actions">
                <button type="submit" className="btn btn-primary">Add Fare Band</button>
              </div>
            </form>
          </div>

          <div className="profile-card">
            <h2>Manage Lines & Stations</h2>
            <div className="saved-trips-list">
              {config.lines.map((line) => (
                <article key={line.id} className="saved-trip-item">
                  <div className="saved-trip-head">
                    <strong>{line.label}</strong>
                    <div className="profile-actions">
                      <button type="button" className="btn btn-secondary" onClick={() => handleQuickEditLine(line)}>Edit</button>
                      <button type="button" className="btn btn-secondary" onClick={() => deleteMetroLine(accessToken, line.id).then((result) => notifyResult(result, 'Line deleted.'))}>Delete</button>
                    </div>
                  </div>
                  <p>{line.routeLabel}</p>
                  <div className="saved-trips-list">
                    {(line.stationRecords || []).map((station) => (
                      <article key={station.id} className="saved-trip-item">
                        <div className="saved-trip-head">
                          <strong>{station.name}</strong>
                          <span>Order: {station.sortOrder}</span>
                        </div>
                        <div className="profile-actions">
                          <button type="button" className="btn btn-secondary" onClick={() => handleQuickEditStation(line.id, station)}>Edit</button>
                          <button type="button" className="btn btn-secondary" onClick={() => deleteMetroStation(accessToken, station.id).then((result) => notifyResult(result, 'Station deleted.'))}>Delete</button>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="profile-card">
            <h2>Manage Fare Bands</h2>
            <div className="saved-trips-list">
              {config.fareBands.map((fare) => (
                <article key={fare.id} className="saved-trip-item">
                  <div className="saved-trip-head">
                    <strong>{fare.distance}</strong>
                    <span>{fare.ticket}</span>
                  </div>
                  <p>{fare.minStations} - {fare.maxStations} stations • Elderly: {fare.elderly} • Special: {fare.specialNeeds}</p>
                  <div className="profile-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => handleQuickEditFare(fare)}>Edit</button>
                    <button type="button" className="btn btn-secondary" onClick={() => deleteFareBand(accessToken, fare.id).then((result) => notifyResult(result, 'Fare band deleted.'))}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
