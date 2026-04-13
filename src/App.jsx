import { useCallback, useEffect, useRef, useState } from 'react';
import AuthSection from './components/auth/AuthSection';
import AdminPanel from './components/admin/AdminPanel';
import ProfileSection from './components/auth/ProfileSection';
import FeatureSection from './components/sections/FeatureSection';
import HeroSection from './components/sections/HeroSection';
import HomeOverviewSection from './components/sections/HomeOverviewSection';
import MetroInfo from './components/planner/MetroInfo';
import RoutePlanner from './components/planner/RoutePlanner';
import SiteFooter from './components/layout/SiteFooter';
import SiteHeader from './components/layout/SiteHeader';
import { featureCards, heroLayers } from './data/metroData';
import { useMetroBootstrap } from './hooks/useMetroBootstrap';
import { bootstrapAdminRequest, deleteAccountRequest, getCurrentUser, signInRequest, signOutRequest, signUpRequest, updateAccountRequest } from './utils/authApi';
import { getMetroConfig } from './utils/metroApi';

const SESSION_STORAGE_KEY = 'metroom-session';

function safeReadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const mapApiRef = useRef(null);
  const pendingRouteRef = useRef(null);
  const pendingTravelRef = useRef(false);
  const pendingVisualRef = useRef(null);
  const [isTraveling, setIsTraveling] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [authTokens, setAuthTokens] = useState({ accessToken: '', refreshToken: '' });
  const [metroConfig, setMetroConfig] = useState({ lines: [], fareBands: [] });

  useMetroBootstrap();

  useEffect(() => {
    const loadMetroConfig = async () => {
      const config = await getMetroConfig();
      if (!config.ok) {
        return;
      }

      setMetroConfig({ lines: config.lines, fareBands: config.fareBands });
    };

    loadMetroConfig();
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const session = safeReadJson(SESSION_STORAGE_KEY, null);
      if (!session?.accessToken) {
        setAuthUser(null);
        setAuthTokens({ accessToken: '', refreshToken: '' });
        return;
      }

      const me = await getCurrentUser(session.accessToken);
      if (!me.ok || !me.user) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setAuthUser(null);
        setAuthTokens({ accessToken: '', refreshToken: '' });
        return;
      }

      setAuthUser({ id: me.user.id, name: me.user.name, email: me.user.email, role: me.user.role });
      setAuthTokens({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken || ''
      });
    };

    restoreSession();
  }, []);

  const showHome = useCallback((event) => {
    event.preventDefault();
    setActivePage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showPlanner = useCallback((event) => {
    if (event) {
      event.preventDefault();
    }
    setActivePage('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showInfo = useCallback((event) => {
    if (event) {
      event.preventDefault();
    }
    setActivePage('info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showAuth = useCallback((event) => {
    if (event) {
      event.preventDefault();
    }
    setActivePage('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showProfile = useCallback((event) => {
    if (event) {
      event.preventDefault();
    }
    setActivePage(authUser ? 'profile' : 'auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [authUser]);

  const handleSignIn = useCallback(async (email, password) => {
    const result = await signInRequest(email, password);
    if (!result.ok || !result.user || !result.accessToken) {
      return { ok: false, message: result.message || 'Invalid email or password. Please try again.' };
    }

    const sessionUser = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role
    };

    const session = {
      user: sessionUser,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || ''
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setAuthUser(sessionUser);
    setAuthTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    setActivePage('profile');
    return { ok: true, message: result.message || 'Signed in successfully.' };
  }, []);

  const handleSignUp = useCallback(async (name, email, password) => {
    const result = await signUpRequest(name, email, password);
    if (!result.ok || !result.user || !result.accessToken) {
      return { ok: false, message: result.message || 'Unable to create account right now.' };
    }

    const sessionUser = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role
    };

    const session = {
      user: sessionUser,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || ''
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setAuthUser(sessionUser);
    setAuthTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    setActivePage('profile');
    return { ok: true, message: result.message || 'Account created successfully.' };
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutRequest(authTokens.refreshToken);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setAuthUser(null);
    setAuthTokens({ accessToken: '', refreshToken: '' });
    setActivePage('home');
  }, [authTokens.refreshToken]);

  const handleAccountUpdate = useCallback(async (payload) => {
    const result = await updateAccountRequest(authTokens.accessToken, payload);
    if (!result.ok || !result.user || !result.accessToken) {
      return { ok: false, message: result.message || 'Unable to update account right now.' };
    }

    const session = {
      user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || authTokens.refreshToken
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setAuthUser(session.user);
    setAuthTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    return { ok: true, message: result.message || 'Account updated successfully.' };
  }, [authTokens.accessToken, authTokens.refreshToken]);

  const handleAccountDelete = useCallback(async () => {
    const result = await deleteAccountRequest(authTokens.accessToken);
    if (!result.ok) {
      return { ok: false, message: result.message || 'Unable to delete account right now.' };
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
    setAuthUser(null);
    setAuthTokens({ accessToken: '', refreshToken: '' });
    setActivePage('home');
    return { ok: true, message: result.message };
  }, [authTokens.accessToken]);

  const handleBootstrapAdmin = useCallback(async () => {
    const result = await bootstrapAdminRequest(authTokens.accessToken);
    if (!result.ok || !result.user) {
      return { ok: false, message: result.message || 'Unable to enable admin mode right now.' };
    }

    const nextUser = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role
    };

    const session = safeReadJson(SESSION_STORAGE_KEY, null) || {};
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      ...session,
      user: nextUser,
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken
    }));

    setAuthUser(nextUser);
    return { ok: true, message: result.message || 'Admin mode enabled.' };
  }, [authTokens.accessToken, authTokens.refreshToken]);

  const showAdmin = useCallback((event) => {
    if (event) {
      event.preventDefault();
    }

    if (authUser?.role !== 'ADMIN') {
      setActivePage('home');
      return;
    }

    setActivePage('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [authUser]);

  const refreshMetroConfig = useCallback(async () => {
    const config = await getMetroConfig();
    if (!config.ok) {
      return;
    }

    setMetroConfig({ lines: config.lines, fareBands: config.fareBands });
  }, []);

  const handleApiReady = useCallback((api) => {
    mapApiRef.current = api;
    if (api && pendingRouteRef.current) {
      const { route, startLine, endLine, transferStation } = pendingRouteRef.current;
      api.showRoute?.(route, startLine, endLine, transferStation);
      pendingRouteRef.current = null;
    }
    if (api && pendingVisualRef.current) {
      const pending = pendingVisualRef.current;
      pendingVisualRef.current = null;
      if (pending.type === 'nearestPoint') {
        api.showNearestPoint?.(pending.lat, pending.lng, pending.nearest);
      } else if (pending.type === 'nearestStartEnd') {
        api.showNearestStartEnd?.(
          pending.curLat,
          pending.curLng,
          pending.dstLat,
          pending.dstLng,
          pending.nearestStart,
          pending.nearestEnd
        );
      }
    }
    if (api && pendingTravelRef.current) {
      pendingTravelRef.current = false;
      api.toggleTravelMode?.();
    }
  }, []);

  const handleStartTravel = useCallback(() => {
    if (mapApiRef.current) {
      mapApiRef.current.toggleTravelMode?.();
      return;
    }

    pendingTravelRef.current = true;
    setActivePage('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleShowRoute = useCallback((route, startLine, endLine, transferStation) => {
    pendingRouteRef.current = { route, startLine, endLine, transferStation };
    mapApiRef.current?.showRoute?.(route, startLine, endLine, transferStation);
  }, []);
  const handleClearHighlights = useCallback(() => mapApiRef.current?.clearHighlights?.(), []);
  const handleShowNearestPoint = useCallback((lat, lng, nearest) => {
    pendingVisualRef.current = { type: 'nearestPoint', lat, lng, nearest };
    setActivePage('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mapApiRef.current?.showNearestPoint?.(lat, lng, nearest);
  }, []);
  const handleShowNearestStartEnd = useCallback((curLat, curLng, dstLat, dstLng, nearestStart, nearestEnd) => {
    pendingVisualRef.current = { type: 'nearestStartEnd', curLat, curLng, dstLat, dstLng, nearestStart, nearestEnd };
    setActivePage('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mapApiRef.current?.showNearestStartEnd?.(curLat, curLng, dstLat, dstLng, nearestStart, nearestEnd);
  }, []);

  return (
    <div className="app-shell">
      <SiteHeader
        activePage={activePage}
        authUser={authUser}
        onHomeClick={showHome}
        onPlannerClick={showPlanner}
        onInfoClick={showInfo}
        onAuthClick={showAuth}
        onProfileClick={showProfile}
        onAdminClick={showAdmin}
        onSignOut={handleSignOut}
      />

      <main id="main-content">
        {activePage === 'home' ? (
          <>
            <HeroSection heroLayers={heroLayers} onPlannerClick={showPlanner} />
            <HomeOverviewSection metroLines={metroConfig.lines} fareBands={metroConfig.fareBands} />
            <FeatureSection featureCards={featureCards} />
          </>
        ) : null}

        {activePage === 'planner' ? (
          <RoutePlanner
            authUser={authUser}
            accessToken={authTokens.accessToken}
            metroLines={metroConfig.lines}
            fareBands={metroConfig.fareBands}
            onStartTravel={handleStartTravel}
            onShowRoute={handleShowRoute}
            onClearHighlights={handleClearHighlights}
            onShowNearestPoint={handleShowNearestPoint}
            onShowNearestStartEnd={handleShowNearestStartEnd}
            onMapApiReady={handleApiReady}
            onTravelStateChange={setIsTraveling}
            isTraveling={isTraveling}
          />
        ) : null}

        {activePage === 'info' ? (
          <section className="planner-page info-page" id="metroInfo" aria-label="Metro information">
            <div className="container">
              <div className="page-title">
                <h1>Metro Information</h1>
                <p>Fare bands, line coverage, and station details at a glance.</p>
              </div>
              <MetroInfo fareBands={metroConfig.fareBands} metroLines={metroConfig.lines} />
            </div>
          </section>
        ) : null}

        {activePage === 'admin' ? (
          authUser?.role === 'ADMIN' ? (
            <AdminPanel accessToken={authTokens.accessToken} onRefreshMetroConfig={refreshMetroConfig} />
          ) : (
            <section className="planner-page" aria-label="Admin access denied">
              <div className="container">
                <div className="profile-card">
                  <h2>Admin Access Required</h2>
                  <p>You need an admin account to manage metro data.</p>
                </div>
              </div>
            </section>
          )
        ) : null}

        {activePage === 'auth' ? (
          <AuthSection onSignIn={handleSignIn} onSignUp={handleSignUp} />
        ) : null}

        {activePage === 'profile' ? (
          <ProfileSection
            user={authUser}
            accessToken={authTokens.accessToken}
            onSignOut={handleSignOut}
            onPlannerClick={showPlanner}
            onUpdateAccount={handleAccountUpdate}
            onDeleteAccount={handleAccountDelete}
            onBootstrapAdmin={handleBootstrapAdmin}
          />
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}

export default App;
