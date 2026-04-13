import { useEffect, useMemo, useState } from 'react';
import PlannerTabsNav from './PlannerTabsNav';
import PlannerTripForm from './PlannerTripForm';
import CoordinateTools from './CoordinateTools';
import MetroMapSection from '../map/MetroMapSection';
import { calculateRoutePlan } from '../../lib/plannerEngine';
import { extractCoordinatesFromText, findNearestStation, lineIdToPlannerValue, parseNumber } from '../../lib/coordinateEngine';
import { saveTripForUser } from '../../utils/tripStorage';

export default function RoutePlanner({ plannerRef, authUser, accessToken, metroLines, fareBands, onStartTravel, onShowRoute, onClearHighlights, onShowNearestPoint, onShowNearestStartEnd, onMapApiReady, onTravelStateChange, isTraveling }) {
  const fallbackStation = metroLines?.[0]?.stations?.[0] || '';
  const [activeTab, setActiveTab] = useState('tab-planner');
  const [plannerState, setPlannerState] = useState({
    startLine: metroLines?.[0]?.id || 'one',
    endLine: metroLines?.[0]?.id || 'one',
    startStation: fallbackStation,
    endStation: fallbackStation
  });
  const [results, setResults] = useState({
    visible: false,
    stationsCount: 0,
    fares: { regular: '-', elderly: '-', special: '-' },
    estimatedTime: '-',
    route: [],
    transferGuide: '',
    transferStation: null,
    error: ''
  });
  const [coords, setCoords] = useState({
    currentLocationLink: '',
    destLocationLink: '',
    currentLat: '',
    currentLng: '',
    destLat: '',
    destLng: ''
  });
  const [coordStatus, setCoordStatus] = useState('Closest-station results will appear here.');
  const [tripSaveStatus, setTripSaveStatus] = useState({ type: '', message: '' });

  const lineStations = useMemo(
    () => Object.fromEntries(metroLines.map((line) => [line.id, line.stations])),
    [metroLines]
  );

  useEffect(() => {
    if (!metroLines.length) return;

    const firstLine = metroLines[0];
    const firstStation = firstLine.stations[0] || '';

    setPlannerState((prev) => {
      const safeStartLine = lineStations[prev.startLine] ? prev.startLine : firstLine.id;
      const safeEndLine = lineStations[prev.endLine] ? prev.endLine : firstLine.id;
      const safeStartStations = lineStations[safeStartLine] || [];
      const safeEndStations = lineStations[safeEndLine] || [];

      return {
        startLine: safeStartLine,
        endLine: safeEndLine,
        startStation: safeStartStations.includes(prev.startStation) ? prev.startStation : (safeStartStations[0] || firstStation),
        endStation: safeEndStations.includes(prev.endStation) ? prev.endStation : (safeEndStations[0] || firstStation)
      };
    });
  }, [lineStations, metroLines]);

  const handleStartLineChange = (lineId) => {
    const stations = lineStations[lineId] || [];
    setPlannerState((prev) => ({
      ...prev,
      startLine: lineId,
      startStation: stations.includes(prev.startStation) ? prev.startStation : (stations[0] || '')
    }));
  };

  const handleEndLineChange = (lineId) => {
    const stations = lineStations[lineId] || [];
    setPlannerState((prev) => ({
      ...prev,
      endLine: lineId,
      endStation: stations.includes(prev.endStation) ? prev.endStation : (stations[0] || '')
    }));
  };

  const handleCalculate = () => {
    const plan = calculateRoutePlan(
      metroLines,
      fareBands,
      plannerState.startLine,
      plannerState.startStation,
      plannerState.endLine,
      plannerState.endStation
    );

    if (plan.error) {
      setTripSaveStatus({ type: '', message: '' });
      setResults((prev) => ({ ...prev, visible: true, error: plan.error, route: [], transferGuide: '' }));
      return;
    }

    setResults({
      visible: true,
      stationsCount: plan.stationsCount,
      fares: plan.fares,
      estimatedTime: plan.estimatedTime,
      route: plan.route,
      transferGuide: plan.transferGuide,
      transferStation: plan.transferStation,
      error: ''
    });

    onShowRoute?.(plan.route, plannerState.startLine, plannerState.endLine, plan.transferStation);
    setTripSaveStatus({ type: '', message: '' });
  };

  const handleReset = () => {
    setPlannerState({
      startLine: metroLines?.[0]?.id || 'one',
      endLine: metroLines?.[0]?.id || 'one',
      startStation: fallbackStation,
      endStation: fallbackStation
    });
    setResults({
      visible: false,
      stationsCount: 0,
      fares: { regular: '-', elderly: '-', special: '-' },
      estimatedTime: '-',
      route: [],
      transferGuide: '',
      transferStation: null,
      error: ''
    });
    onClearHighlights?.();
    setTripSaveStatus({ type: '', message: '' });
  };

  const handleSaveTrip = async () => {
    if (!results.route.length || results.error) {
      setTripSaveStatus({ type: 'error', message: 'Find a valid route before saving.' });
      return;
    }

    const response = await saveTripForUser(accessToken, {
      startLine: plannerState.startLine,
      endLine: plannerState.endLine,
      startStation: plannerState.startStation,
      endStation: plannerState.endStation,
      stationsCount: results.stationsCount,
      estimatedTime: results.estimatedTime,
      fares: results.fares,
      route: results.route,
      transferGuide: results.transferGuide,
      transferStation: results.transferStation
    });

    setTripSaveStatus({
      type: response.ok ? 'success' : 'error',
      message: response.message
    });
  };

  const setCoordField = (field, value) => {
    setCoords((prev) => ({ ...prev, [field]: value }));
  };

  const getGeoStations = () => (window.metroGeoStations || []);

  const handleImportCoordinates = async () => {
    if (!coords.currentLocationLink && !coords.destLocationLink) {
      setCoordStatus('Paste a current and/or destination map link first.');
      return;
    }

    setCoordStatus('Resolving coordinates...');

    const current = coords.currentLocationLink ? await extractCoordinatesFromText(coords.currentLocationLink) : null;
    const destination = coords.destLocationLink ? await extractCoordinatesFromText(coords.destLocationLink) : null;

    setCoords((prev) => ({
      ...prev,
      currentLat: current ? current.lat.toFixed(6) : prev.currentLat,
      currentLng: current ? current.lng.toFixed(6) : prev.currentLng,
      destLat: destination ? destination.lat.toFixed(6) : prev.destLat,
      destLng: destination ? destination.lng.toFixed(6) : prev.destLng
    }));

    if (current && destination) {
      setCoordStatus('Imported both current and destination coordinates from links.');
    } else if (current) {
      setCoordStatus('Imported current coordinates. Add destination link (or manual destination coordinates).');
    } else if (destination) {
      setCoordStatus('Imported destination coordinates. Add current link (or manual current coordinates).');
    } else {
      setCoordStatus('Could not read coordinates from the provided links.');
    }
  };

  const handleUseLiveLocation = () => {
    if (!navigator.geolocation) {
      setCoordStatus('Live location is not supported in this browser.');
      return;
    }

    setCoordStatus('Fetching live location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords((prev) => ({ ...prev, currentLat: lat.toFixed(6), currentLng: lng.toFixed(6) }));
        setCoordStatus(`Live location set to ${lat.toFixed(6)}, ${lng.toFixed(6)} (accuracy ±${Number(position.coords.accuracy || 0).toFixed(0)} m).`);
      },
      (error) => {
        setCoordStatus(`Could not get live location: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  };

  const handleClosestStation = () => {
    const lat = parseNumber(coords.currentLat);
    const lng = parseNumber(coords.currentLng);

    if (lat === null || lng === null) {
      setCoordStatus('Please enter valid current coordinates.');
      return;
    }

    const nearest = findNearestStation(lat, lng, getGeoStations());
    if (!nearest) {
      setCoordStatus('Station coordinate data is not loaded yet.');
      return;
    }

    setCoordStatus(`Closest station now: ${nearest.name} (${nearest.lineId}) - approx ${nearest.distanceKm.toFixed(2)} km away.`);
    onShowNearestPoint?.(lat, lng, nearest);
  };

  const handleClosestRoute = () => {
    const curLat = parseNumber(coords.currentLat);
    const curLng = parseNumber(coords.currentLng);
    const dstLat = parseNumber(coords.destLat);
    const dstLng = parseNumber(coords.destLng);

    if (curLat === null || curLng === null || dstLat === null || dstLng === null) {
      setCoordStatus('Please enter valid current and destination coordinates.');
      return;
    }

    const nearestStart = findNearestStation(curLat, curLng, getGeoStations());
    const nearestEnd = findNearestStation(dstLat, dstLng, getGeoStations());

    if (!nearestStart || !nearestEnd) {
      setCoordStatus('Station coordinate data is not loaded yet.');
      return;
    }

    const startLine = lineIdToPlannerValue(nearestStart.lineId);
    const endLine = lineIdToPlannerValue(nearestEnd.lineId);
    const startStation = nearestStart.plannerName;
    const endStation = nearestEnd.plannerName;

    setPlannerState({
      startLine,
      endLine,
      startStation,
      endStation
    });

    const plan = calculateRoutePlan(metroLines, fareBands, startLine, startStation, endLine, endStation);
    if (!plan.error) {
      setResults({
        visible: true,
        stationsCount: plan.stationsCount,
        fares: plan.fares,
        estimatedTime: plan.estimatedTime,
        route: plan.route,
        transferGuide: plan.transferGuide,
        transferStation: plan.transferStation,
        error: ''
      });
      onShowRoute?.(plan.route, startLine, endLine, plan.transferStation);
    }

    setCoordStatus(
      `Closest start: ${nearestStart.name} (${nearestStart.lineId}) - ${nearestStart.distanceKm.toFixed(2)} km. ` +
      `Closest destination: ${nearestEnd.name} (${nearestEnd.lineId}) - ${nearestEnd.distanceKm.toFixed(2)} km. Route fields auto-filled.`
    );

    onShowNearestStartEnd?.(curLat, curLng, dstLat, dstLng, nearestStart, nearestEnd);
    setActiveTab('tab-planner');
  };

  return (
    <section id="planner" ref={plannerRef} className="planner-page" aria-label="Route planner">
      <div className="container">
        <div className="page-title">
          <h1>Plan Your Cairo Metro Journey</h1>
          <p>Select your starting point and destination to find the best route</p>
        </div>

        <div className="tabs-shell">
          <PlannerTabsNav activeTab={activeTab} onTabChange={setActiveTab} />

          <section id="tab-planner" className={`tab-panel ${activeTab === 'tab-planner' ? 'active' : ''}`} role="tabpanel" aria-labelledby="tab-btn-planner" hidden={activeTab !== 'tab-planner'}>
            <PlannerTripForm
              metroLines={metroLines}
              plannerState={plannerState}
              results={results}
              onStartLineChange={handleStartLineChange}
              onStartStationChange={(station) => setPlannerState((prev) => ({ ...prev, startStation: station }))}
              onEndLineChange={handleEndLineChange}
              onEndStationChange={(station) => setPlannerState((prev) => ({ ...prev, endStation: station }))}
              onCalculate={handleCalculate}
              onStartTravel={onStartTravel}
              onReset={handleReset}
              onSaveTrip={handleSaveTrip}
              tripSaveStatus={tripSaveStatus}
              isTraveling={isTraveling}
            />
          </section>

          <section id="tab-coordinates" className={`tab-panel ${activeTab === 'tab-coordinates' ? 'active' : ''}`} role="tabpanel" aria-labelledby="tab-btn-coordinates" hidden={activeTab !== 'tab-coordinates'}>
            <CoordinateTools
              values={coords}
              status={coordStatus}
              onFieldChange={setCoordField}
              onImport={handleImportCoordinates}
              onLiveLocation={handleUseLiveLocation}
              onClosestStation={handleClosestStation}
              onClosestRoute={handleClosestRoute}
            />
          </section>

        </div>

        <MetroMapSection metroLines={metroLines} onApiReady={onMapApiReady} onTravelStateChange={onTravelStateChange} />
      </div>
    </section>
  );
}
