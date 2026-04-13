import { useEffect, useRef, useState } from 'react';
import { loadScript } from '../../utils/loadScript';

function normalizeStationName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function lineColor(lineValue) {
  if (lineValue === 'one') return '#2E86DE';
  if (lineValue === 'two') return '#E74C3C';
  return '#27AE60';
}

export default function MetroMapSection({ metroLines = [], onApiReady, onTravelStateChange }) {
  const mapContainerRef = useRef(null);
  const mapStateRef = useRef(null);
  const routeGeoPointsRef = useRef([]);
  const travelWatchIdRef = useRef(null);
  const travelSampleRef = useRef(null);
  const travelSpeedSamplesRef = useRef([]);
  const apiReadyCallbackRef = useRef(onApiReady);
  const travelStateCallbackRef = useRef(onTravelStateChange);
  const [travelStatus, setTravelStatus] = useState('');
  const [travelSpeed, setTravelSpeed] = useState('Speed: -- km/h');

  useEffect(() => {
    apiReadyCallbackRef.current = onApiReady;
  }, [onApiReady]);

  useEffect(() => {
    travelStateCallbackRef.current = onTravelStateChange;
  }, [onTravelStateChange]);

  const resetTravelSpeedTracking = () => {
    travelSampleRef.current = null;
    travelSpeedSamplesRef.current = [];
  };

  const pushTravelSpeedSample = (speedKmh) => {
    if (!Number.isFinite(speedKmh) || speedKmh < 0) return null;

    const samples = travelSpeedSamplesRef.current;
    samples.push(speedKmh);
    if (samples.length > 5) {
      samples.shift();
    }

    const total = samples.reduce((sum, value) => sum + value, 0);
    return total / samples.length;
  };

  useEffect(() => {
    let cancelled = false;

    const initializeMap = async () => {
      await loadScript('/js/leaflet.js');
      if (cancelled || !mapContainerRef.current || typeof window.L === 'undefined') return;

      const response = await fetch('/js/cairo_metro_station_points.geojson');
      const geojson = await response.json();
      if (cancelled) return;

      const geoStations = (geojson.features || []).map((feature) => ({
        name: feature.properties.originalName,
        plannerName: feature.properties.stationName,
        lineId: feature.properties.lineId,
        lineValue: feature.properties.lineValue,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0]
      }));

      window.metroGeoStations = geoStations;

      const map = window.L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([30.045, 31.24], 11);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(map);

      window.L.control.attribution({ prefix: false }).addTo(map);

      const routeLayer = window.L.layerGroup().addTo(map);
      const contextLayer = window.L.layerGroup().addTo(map);
      const travelLayer = window.L.layerGroup().addTo(map);

      const labels = [];
      const allBounds = [];

      metroLines.forEach((line) => {
        const orderedStations = line.stations
          .map((stationName) => geoStations.find(
            (station) => station.lineValue === line.id && normalizeStationName(station.plannerName) === normalizeStationName(stationName)
          ))
          .filter(Boolean);

        orderedStations.forEach((station) => {
          const marker = window.L.circleMarker([station.lat, station.lng], {
            radius: 5,
            color: '#102a27',
            weight: 2,
            fillColor: lineColor(line.id),
            fillOpacity: 0.95
          }).addTo(map);

          marker.bindPopup(`<strong>${station.name}</strong><br>Line: ${station.lineId}`);
          marker.bindTooltip(station.name, {
            permanent: true,
            direction: 'top',
            offset: [0, -8],
            className: 'station-label'
          });

          labels.push(marker);
          allBounds.push([station.lat, station.lng]);
        });

        if (orderedStations.length > 1) {
          window.L.polyline(
            orderedStations.map((station) => [station.lat, station.lng]),
            {
              color: lineColor(line.id),
              weight: 4,
              opacity: 0.9
            }
          ).addTo(map);
        }
      });

      if (allBounds.length > 0) {
        map.fitBounds(allBounds, { padding: [24, 24] });
      }

      const initialBounds = allBounds.length > 0 ? window.L.latLngBounds(allBounds) : null;

      const updateLabels = () => {
        const show = map.getZoom() >= 13;
        labels.forEach((marker) => {
          if (show) marker.openTooltip();
          else marker.closeTooltip();
        });
      };

      map.on('zoomend', updateLabels);
      updateLabels();

      mapStateRef.current = { map, routeLayer, contextLayer, travelLayer, geoStations };

      const getGeoStationByPlanner = (lineValue, stationName) => {
        const normalized = normalizeStationName(stationName);
        const exact = geoStations.find((station) => station.lineValue === lineValue && normalizeStationName(station.plannerName) === normalized);
        if (exact) return exact;
        return geoStations.find((station) => normalizeStationName(station.plannerName) === normalized) || null;
      };

      const clearHighlights = () => {
        if (!mapStateRef.current) return;
        mapStateRef.current.routeLayer.clearLayers();
        mapStateRef.current.contextLayer.clearLayers();
      };

      const resetMap = () => {
        if (!mapStateRef.current) return;

        stopTravelMode(true);
        resetTravelSpeedTracking();
        routeGeoPointsRef.current = [];
        mapStateRef.current.routeLayer.clearLayers();
        mapStateRef.current.contextLayer.clearLayers();
        mapStateRef.current.travelLayer.clearLayers();

        if (initialBounds) {
          map.fitBounds(initialBounds, { padding: [24, 24] });
        } else {
          map.setView([30.045, 31.24], 11);
        }

        updateLabels();
        setTravelStatus('');
        setTravelSpeed('Speed: -- km/h');
      };

      mapStateRef.current = { map, routeLayer, contextLayer, travelLayer, geoStations, resetMap };

      const showRoute = (routeStations, startLine, endLine, transferStation) => {
        if (!mapStateRef.current || !Array.isArray(routeStations) || routeStations.length === 0) return;
        const { map: activeMap, routeLayer: activeRouteLayer } = mapStateRef.current;
        activeRouteLayer.clearLayers();

        let switched = false;
        const transferNorm = normalizeStationName(transferStation || '');
        const points = routeStations.map((name, index) => {
          let activeLine = startLine;
          if (startLine !== endLine && switched) {
            activeLine = endLine;
          }
          const station = getGeoStationByPlanner(activeLine, name) || getGeoStationByPlanner(endLine, name);
          if (!switched && transferNorm && normalizeStationName(name) === transferNorm && index !== 0) {
            switched = true;
          }
          return station;
        }).filter(Boolean);

        if (points.length < 2) return;

        routeGeoPointsRef.current = points;
        const latLngs = points.map((point) => [point.lat, point.lng]);

        window.L.polyline(latLngs, {
          color: '#9C27B0',
          weight: 6,
          opacity: 0.95
        }).addTo(activeRouteLayer);

        window.L.circleMarker([points[0].lat, points[0].lng], {
          radius: 8,
          color: '#1b5e20',
          weight: 2,
          fillColor: '#4CAF50',
          fillOpacity: 1
        }).bindPopup(`Route start: ${points[0].plannerName}`).addTo(activeRouteLayer);

        const endPoint = points[points.length - 1];
        window.L.circleMarker([endPoint.lat, endPoint.lng], {
          radius: 8,
          color: '#8e0000',
          weight: 2,
          fillColor: '#F44336',
          fillOpacity: 1
        }).bindPopup(`Route end: ${endPoint.plannerName}`).addTo(activeRouteLayer);

        activeMap.fitBounds(window.L.latLngBounds(latLngs), { padding: [36, 36] });
      };

      const showNearestPoint = (userLat, userLng, nearest) => {
        if (!mapStateRef.current || !nearest) return;
        const { contextLayer: activeContext, map: activeMap } = mapStateRef.current;
        activeContext.clearLayers();

        const userPoint = [userLat, userLng];
        const stationPoint = [nearest.lat, nearest.lng];

        window.L.circleMarker(userPoint, {
          radius: 7,
          color: '#0d47a1',
          weight: 2,
          fillColor: '#42A5F5',
          fillOpacity: 1
        }).addTo(activeContext);

        window.L.circleMarker(stationPoint, {
          radius: 8,
          color: '#1b5e20',
          weight: 2,
          fillColor: '#66BB6A',
          fillOpacity: 1
        }).addTo(activeContext);

        window.L.polyline([userPoint, stationPoint], {
          color: '#81D4FA',
          weight: 4,
          dashArray: '8,8',
          opacity: 0.9
        }).addTo(activeContext);

        activeMap.fitBounds(window.L.latLngBounds([userPoint, stationPoint]), { padding: [42, 42] });
      };

      const showNearestStartEnd = (curLat, curLng, dstLat, dstLng, nearestStart, nearestEnd) => {
        if (!mapStateRef.current || !nearestStart || !nearestEnd) return;
        const { contextLayer: activeContext, map: activeMap } = mapStateRef.current;
        activeContext.clearLayers();

        const currentPoint = [curLat, curLng];
        const destinationPoint = [dstLat, dstLng];
        const startStationPoint = [nearestStart.lat, nearestStart.lng];
        const endStationPoint = [nearestEnd.lat, nearestEnd.lng];

        window.L.circleMarker(currentPoint, { radius: 6, color: '#0d47a1', weight: 2, fillColor: '#42A5F5', fillOpacity: 1 }).addTo(activeContext);
        window.L.circleMarker(destinationPoint, { radius: 6, color: '#4a148c', weight: 2, fillColor: '#BA68C8', fillOpacity: 1 }).addTo(activeContext);
        window.L.circleMarker(startStationPoint, { radius: 8, color: '#1b5e20', weight: 2, fillColor: '#4CAF50', fillOpacity: 1 }).addTo(activeContext);
        window.L.circleMarker(endStationPoint, { radius: 8, color: '#8e0000', weight: 2, fillColor: '#F44336', fillOpacity: 1 }).addTo(activeContext);

        window.L.polyline([currentPoint, startStationPoint], { color: '#80DEEA', weight: 4, dashArray: '8,8', opacity: 0.9 }).addTo(activeContext);
        window.L.polyline([destinationPoint, endStationPoint], { color: '#FFAB91', weight: 4, dashArray: '8,8', opacity: 0.9 }).addTo(activeContext);

        activeMap.fitBounds(window.L.latLngBounds([currentPoint, destinationPoint, startStationPoint, endStationPoint]), { padding: [42, 42] });
      };

      const stopTravelMode = (silent) => {
        if (travelWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(travelWatchIdRef.current);
          travelWatchIdRef.current = null;
        }

        travelLayer.clearLayers();
        travelStateCallbackRef.current?.(false);
        setTravelSpeed('Speed: 0.0 km/h');
        resetTravelSpeedTracking();
        if (!silent) {
          setTravelStatus('Travel mode stopped.');
        }
      };

      const toggleTravelMode = () => {
        if (travelWatchIdRef.current !== null) {
          stopTravelMode(false);
          return false;
        }

        if (!navigator.geolocation) {
          setTravelStatus('Travel mode unavailable: geolocation is not supported by this browser.');
          return false;
        }

        if (!routeGeoPointsRef.current || routeGeoPointsRef.current.length < 2) {
          setTravelStatus('Please find a valid route first, then start traveling.');
          return false;
        }

        travelStateCallbackRef.current?.(true);
        resetTravelSpeedTracking();
        setTravelStatus('Travel mode active. Waiting for live location updates...');
        setTravelSpeed('Speed: -- km/h');

        travelWatchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = Number(position.coords.accuracy || 0);
            const timestamp = Number(position.timestamp || Date.now());
            const gpsSpeedKmh = Number.isFinite(position.coords.speed) && position.coords.speed >= 0
              ? position.coords.speed * 3.6
              : null;

            let estimatedSpeedKmh = null;
            const previousSample = travelSampleRef.current;
            if (previousSample && Number.isFinite(previousSample.timestamp) && timestamp > previousSample.timestamp) {
              const elapsedHours = (timestamp - previousSample.timestamp) / 3600000;
              const traveledKm = haversineKm(previousSample.lat, previousSample.lng, lat, lng);
              if (elapsedHours > 0) {
                estimatedSpeedKmh = traveledKm / elapsedHours;
              }
            }

            travelSampleRef.current = { lat, lng, timestamp };

            const smoothedSpeedKmh = estimatedSpeedKmh !== null
              ? pushTravelSpeedSample(estimatedSpeedKmh)
              : pushTravelSpeedSample(gpsSpeedKmh ?? 0);

            const displaySpeedKmh = Number.isFinite(smoothedSpeedKmh)
              ? smoothedSpeedKmh
              : (Number.isFinite(gpsSpeedKmh) ? gpsSpeedKmh : 0);

            const route = routeGeoPointsRef.current;
            let nearestIdx = 0;
            let nearestDistance = Number.MAX_VALUE;

            route.forEach((point, index) => {
              const distance = haversineKm(lat, lng, point.lat, point.lng);
              if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIdx = index;
              }
            });

            const nearestStation = route[nearestIdx];
            const destination = route[route.length - 1];
            const remainingKm = haversineKm(lat, lng, destination.lat, destination.lng);

            travelLayer.clearLayers();

            window.L.circleMarker([lat, lng], {
              radius: 8,
              color: '#0d47a1',
              weight: 2,
              fillColor: '#42A5F5',
              fillOpacity: 1
            }).addTo(travelLayer);

            window.L.circleMarker([nearestStation.lat, nearestStation.lng], {
              radius: 9,
              color: '#1b5e20',
              weight: 2,
              fillColor: '#66BB6A',
              fillOpacity: 1
            }).addTo(travelLayer);

            window.L.polyline(
              route.slice(nearestIdx).map((point) => [point.lat, point.lng]),
              {
                color: '#FFC107',
                weight: 5,
                opacity: 0.95
              }
            ).addTo(travelLayer);

            setTravelStatus(`Traveling: nearest station is ${nearestStation.plannerName} on ${nearestStation.lineId}. Remaining to destination ~${(remainingKm * 1000).toFixed(0)} m (±${accuracy.toFixed(0)} m).`);
            setTravelSpeed(`Speed: ${(displaySpeedKmh > 1 ? displaySpeedKmh : 0).toFixed(1)} km/h`);

            if (remainingKm <= 0.08) {
              stopTravelMode(true);
              setTravelStatus('You reached near your destination station. Travel mode stopped automatically.');
            }
          },
          (error) => {
            setTravelStatus(`Travel mode error: ${error.message}`);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 20000
          }
        );

        return true;
      };

      apiReadyCallbackRef.current?.({
        showRoute,
        clearHighlights,
        resetMap,
        showNearestPoint,
        showNearestStartEnd,
        toggleTravelMode,
        stopTravelMode
      });
    };

    initializeMap().catch((error) => {
      if (!cancelled) {
        setTravelStatus('Map failed to initialize. Please refresh the page.');
        console.error(error);
      }
    });

    return () => {
      cancelled = true;
      if (travelWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(travelWatchIdRef.current);
      }
      if (mapStateRef.current?.map) {
        mapStateRef.current.map.remove();
      }
      apiReadyCallbackRef.current?.(null);
    };
  }, []);

  return (
    <section className="metro-map" id="metroMap" role="region" aria-label="Interactive Metro Map">
      <h2>Cairo Metro Network Map</h2>
      <div className="travel-hud" role="status" aria-live="polite">
        {travelStatus ? <div id="travelStatus" className="travel-status">{travelStatus}</div> : null}
        <div className="travel-actions">
          <div id="travelSpeed" className="travel-speed-chip">{travelSpeed}</div>
          <button type="button" className="btn btn-secondary map-reset-btn" onClick={() => mapStateRef.current?.resetMap?.()}>
            Reset Map
          </button>
        </div>
      </div>
      <div id="stationMap" ref={mapContainerRef} className="station-map"></div>
    </section>
  );
}
