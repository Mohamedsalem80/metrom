import { useEffect, useState } from 'react';
import { downloadTripsAsCsv, downloadTripsAsGeoJson, downloadTripsAsJson, getTripsForUser } from '../../utils/tripStorage';

export default function ProfileSection({ user, accessToken, onSignOut, onPlannerClick, onUpdateAccount, onDeleteAccount, onBootstrapAdmin }) {
  const [savedTrips, setSavedTrips] = useState([]);
  const [exportStatus, setExportStatus] = useState({ type: '', message: '' });
  const [tripStatus, setTripStatus] = useState({ type: '', message: '' });
  const [editStatus, setEditStatus] = useState({ type: '', message: '' });
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: ''
  });

  useEffect(() => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: ''
    });
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadTrips = async () => {
      if (!accessToken) {
        if (active) {
          setSavedTrips([]);
          setTripStatus({ type: '', message: '' });
        }
        return;
      }

      const result = await getTripsForUser(accessToken);
      if (!active) {
        return;
      }

      if (!result.ok) {
        setSavedTrips([]);
        setTripStatus({ type: 'error', message: result.message || 'Unable to load saved trips right now.' });
        return;
      }

      setSavedTrips(result.trips);
      setTripStatus({ type: '', message: '' });
    };

    loadTrips();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const handleExport = (format) => {
    let result;
    if (format === 'json') {
      result = downloadTripsAsJson(user?.email, savedTrips);
    } else if (format === 'csv') {
      result = downloadTripsAsCsv(user?.email, savedTrips);
    } else {
      result = downloadTripsAsGeoJson(user?.email, savedTrips);
    }

    setExportStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setEditStatus({ type: '', message: '' });

    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const currentPassword = editForm.currentPassword.trim();
    const newPassword = editForm.newPassword.trim();

    if (!name || !email) {
      setEditStatus({ type: 'error', message: 'Name and email are required.' });
      return;
    }

    if (newPassword && !currentPassword) {
      setEditStatus({ type: 'error', message: 'Current password is required to change your password.' });
      return;
    }

    const payload = { name, email };
    if (currentPassword) payload.currentPassword = currentPassword;
    if (newPassword) payload.newPassword = newPassword;

    const result = await onUpdateAccount(payload);
    setEditStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message
    });

    if (result.ok) {
      setEditForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your account permanently? This will remove your profile and saved trips.');
    if (!confirmed) {
      return;
    }

    const result = await onDeleteAccount();
    setEditStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message
    });
  };

  const handleBootstrapAdmin = async () => {
    const confirmed = window.confirm('Enable admin mode for this account if no admin exists yet?');
    if (!confirmed) {
      return;
    }

    const result = await onBootstrapAdmin();
    setEditStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message
    });
  };

  return (
    <section className="planner-page profile-page" id="profile" aria-label="User profile">
      <div className="container">
        <div className="page-title">
          <h1>Your Profile</h1>
          <p>Manage your account and jump back to route planning any time.</p>
        </div>

        <div className="profile-shell">
          {user ? (
            <>
              <div className="profile-card">
                <h2>Account Details</h2>
                <form className="profile-edit-form" onSubmit={handleEditSubmit}>
                  <label>
                    <span>Name</span>
                    <input
                      className="auth-input"
                      type="text"
                      value={editForm.name}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </label>

                  <label>
                    <span>Email</span>
                    <input
                      className="auth-input"
                      type="email"
                      value={editForm.email}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </label>

                  <label>
                    <span>Current Password</span>
                    <input
                      className="auth-input"
                      type="password"
                      value={editForm.currentPassword}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                      placeholder="Required for password changes"
                    />
                  </label>

                  <label>
                    <span>New Password</span>
                    <input
                      className="auth-input"
                      type="password"
                      value={editForm.newPassword}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                      placeholder="Leave blank to keep your current password"
                    />
                  </label>

                  <div className="profile-edit-actions">
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button type="button" className="btn btn-secondary" onClick={handleDeleteAccount}>Delete Account</button>
                  </div>

                  {editStatus.message ? (
                    <p className={`trip-save-status ${editStatus.type === 'error' ? 'error' : 'success'}`} role="status" aria-live="polite">
                      {editStatus.message}
                    </p>
                  ) : null}
                </form>
              </div>

              <div className="profile-card">
                <h2>Saved Trips</h2>
                <div className="saved-trips-export">
                  <button type="button" className="btn btn-secondary" onClick={() => handleExport('json')}>Download JSON</button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleExport('csv')}>Download CSV</button>
                  <button type="button" className="btn btn-secondary" onClick={() => handleExport('geojson')}>Download GeoJSON</button>
                </div>
                {exportStatus.message ? (
                  <p className={`trip-save-status ${exportStatus.type === 'error' ? 'error' : 'success'}`}>{exportStatus.message}</p>
                ) : null}
                {tripStatus.message ? (
                  <p className={`trip-save-status ${tripStatus.type === 'error' ? 'error' : 'success'}`}>{tripStatus.message}</p>
                ) : null}
                {savedTrips.length ? (
                  <div className="saved-trips-list">
                    {savedTrips.slice(0, 12).map((trip) => (
                      <article className="saved-trip-item" key={trip.id}>
                        <div className="saved-trip-head">
                          <strong>{trip.startStation} → {trip.endStation}</strong>
                          <span>{new Date(trip.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{trip.stationsCount} stations • {trip.estimatedTime} • {trip.fares?.regular || '-'} ticket</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="saved-trip-empty">No saved trips yet. Plan a route and use Save Trip to store it.</p>
                )}
              </div>
            </>
          ) : (
            <div className="profile-card">
              <h2>No active account</h2>
              <p>Please sign in to view your profile.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
