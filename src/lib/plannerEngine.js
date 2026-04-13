function buildNetwork(metroLines) {
  return Object.fromEntries(metroLines.map((line) => [line.id, line.stations]));
}

const lineThreeRouteSegments = [
  ['Adly Mansour', 'Heykestep', 'Omar Ibn Al Khattab', 'Qebaa', 'Hesham Barakat', 'El Nozha', 'Nadi El Shams', 'Alf Maskan', 'Heliopolis', 'Haroun', 'Al Ahram', 'Koleyet El Banat', 'Cairo Stadium', 'Fair Zone', 'Abbassiya', 'Abdou Pasha', 'El Geish', 'Bab El Shaaria', 'Ataba', 'Nasser', 'Maspero', 'Safaa Hegazy', 'Kit Kat'],
  ['Kit Kat', 'Sudan St.', 'Imbaba', 'El Bohy', 'El-Qawmia', 'Ring Rd.', 'Rod El Farag Corridor'],
  ['Kit Kat', 'Tawfikia', 'Wadi El Nile', 'Gamat El Dowal', 'Boulak El Dakrour', 'Cairo University']
];

const interchangeMatrix = {
  one: { two: ['Al Shohadaa', 'Sadat'], three: ['Nasser'] },
  two: { one: ['Al Shohadaa', 'Sadat'], three: ['Ataba'] },
  three: { one: ['Nasser'], two: ['Ataba'] }
};

function destinationLineThree(start, end) {
  if (start === end) return [start];

  const graph = {};
  const addEdge = (from, to) => {
    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];
    if (!graph[from].includes(to)) graph[from].push(to);
    if (!graph[to].includes(from)) graph[to].push(from);
  };

  lineThreeRouteSegments.forEach((segment) => {
    for (let i = 1; i < segment.length; i += 1) {
      addEdge(segment[i - 1], segment[i]);
    }
  });

  if (!graph[start] || !graph[end]) return [start];

  const queue = [start];
  const visited = { [start]: true };
  const previous = {};

  while (queue.length) {
    const current = queue.shift();
    if (current === end) break;
    graph[current].forEach((next) => {
      if (visited[next]) return;
      visited[next] = true;
      previous[next] = current;
      queue.push(next);
    });
  }

  if (!visited[end]) return [start];

  const path = [];
  let cursor = end;
  while (cursor !== undefined) {
    path.push(cursor);
    cursor = previous[cursor];
  }
  return path.reverse();
}

function destination(network, lineId, start, end) {
  if (start === end) return [start];
  if (lineId === 'three') return destinationLineThree(start, end);

  const stations = network[lineId] || [];
  const startIdx = stations.indexOf(start);
  const endIdx = stations.indexOf(end);
  if (startIdx === -1 || endIdx === -1) return [start];

  if (startIdx <= endIdx) return stations.slice(startIdx, endIdx + 1);
  return stations.slice(endIdx, startIdx + 1).reverse();
}

function fareBreakdown(stationsCount, fareBands) {
  if (!Array.isArray(fareBands) || fareBands.length === 0) {
    if (stationsCount <= 9) return { regular: '8 EGP', elderly: '4 EGP', special: '5 EGP' };
    if (stationsCount <= 16) return { regular: '10 EGP', elderly: '5 EGP', special: '5 EGP' };
    if (stationsCount <= 23) return { regular: '15 EGP', elderly: '8 EGP', special: '5 EGP' };
    return { regular: '20 EGP', elderly: '10 EGP', special: '5 EGP' };
  }

  const match = fareBands
    .slice()
    .sort((a, b) => a.minStations - b.minStations)
    .find((band) => stationsCount >= band.minStations && stationsCount <= band.maxStations)
    || fareBands[fareBands.length - 1];

  return {
    regular: match.ticket,
    elderly: match.elderly,
    special: match.specialNeeds
  };
}

function estimateTripTime(stationsCount, hasTransfer) {
  const base = Math.max(4, Math.round(stationsCount * 1.7 + (hasTransfer ? 5 : 2)));
  const min = Math.max(3, Math.round(base * 0.9));
  const max = Math.max(min + 1, Math.round(base * 1.15));
  return `${min}-${max} min`;
}

function lineLabelFromValue(lineValue) {
  if (lineValue === 'one') return 'Line 1';
  if (lineValue === 'two') return 'Line 2';
  return 'Line 3';
}

function terminalNameForDirection(lineValue, towardEnd) {
  const terminals = {
    one: { start: 'Helwan', end: 'El Marg' },
    two: { start: 'El Monib', end: 'Shubra Al Khaimah' },
    three: { start: 'Adly Mansour', end: 'Rod El Farag Corridor' }
  };
  const lineTerminals = terminals[lineValue] || terminals.one;
  return towardEnd ? lineTerminals.end : lineTerminals.start;
}

function getTransferDirectionGuidance(network, transferStation, targetLine, targetStation) {
  const stations = network[targetLine] || [];
  const transferIdx = stations.indexOf(transferStation);
  const targetIdx = stations.indexOf(targetStation);
  if (transferIdx === -1 || targetIdx === -1) {
    return `Transfer at ${transferStation} to ${lineLabelFromValue(targetLine)}.`;
  }
  const terminal = terminalNameForDirection(targetLine, targetIdx > transferIdx);
  return `Transfer at ${transferStation}. Take ${lineLabelFromValue(targetLine)} toward ${terminal}.`;
}

export function calculateRoutePlan(metroLines, fareBands, startLine, startStation, endLine, endStation) {
  const network = buildNetwork(metroLines || []);

  if (!startStation || !endStation) {
    return { error: 'Please select the stations.' };
  }

  if (startStation === endStation) {
    return { error: 'Start and destination cannot be the same station.' };
  }

  if (startLine === endLine) {
    const route = destination(network, startLine, startStation, endStation);
    const stationsCount = route.length;
    return {
      route,
      transferStation: null,
      transferGuide: 'No transfer required on this trip.',
      stationsCount,
      fares: fareBreakdown(stationsCount, fareBands),
      estimatedTime: estimateTripTime(stationsCount, false)
    };
  }

  const transferCandidates = interchangeMatrix[startLine]?.[endLine] || [];
  let bestRoute = [];
  let bestTransfer = null;
  let bestStationCount = Number.POSITIVE_INFINITY;

  transferCandidates.forEach((candidate) => {
    const startLeg = destination(network, startLine, startStation, candidate);
    const endLeg = destination(network, endLine, endStation, candidate);
    const stationCount = startLeg.length + endLeg.length - 1;
    if (stationCount < bestStationCount) {
      bestStationCount = stationCount;
      bestTransfer = candidate;
      const mergeLeg = endLeg.slice(0, endLeg.length - 1).reverse();
      bestRoute = startLeg.concat(mergeLeg);
    }
  });

  if (!Number.isFinite(bestStationCount) || !bestRoute.length || !bestTransfer) {
    return { error: 'No transfer path available between the selected lines in current metro data.' };
  }

  return {
    route: bestRoute,
    transferStation: bestTransfer,
    transferGuide: getTransferDirectionGuidance(network, bestTransfer, endLine, endStation),
    stationsCount: bestStationCount,
    fares: fareBreakdown(bestStationCount, fareBands),
    estimatedTime: estimateTripTime(bestStationCount, true)
  };
}