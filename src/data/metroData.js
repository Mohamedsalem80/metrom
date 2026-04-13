export const metroLines = [
  {
    id: 'one',
    label: 'Line 1 (Helwan - El Marg)',
    routeLabel: 'Helwan to New El-Marg',
    stations: [
      'Helwan',
      'Ain Helwan',
      'Helwan University',
      'Wadi Hof',
      'Hadayeq Helwan',
      'Elmasraa',
      'Tura El-Asmant',
      'Kozzika',
      'Tura El-Balad',
      'Sakanat El-Maadi',
      'Maadi',
      'Hadayeq El-Maadi',
      'Dar El-Salam',
      'El-Zahraa',
      'Mar Girgis',
      'El-Malek El-Saleh',
      'Al-Sayeda Zeinab',
      'Saad Zaghloul',
      'Sadat',
      'Nasser',
      'Urabi',
      'Al Shohadaa',
      'Ghamra',
      'El-Demerdash',
      'Manshiet El-Sadr',
      'Kobri El-Qobba',
      'Hammamat El-Qobba',
      'Saray El-Qobba',
      'Hadayeq El-Zaitoun',
      'Helmeyet El-Zaitoun',
      'El-Matareyya',
      'Ain Shams',
      'Ezbet El-Nakhl',
      'El-Marg',
      'New El-Marg'
    ]
  },
  {
    id: 'two',
    label: 'Line 2 (El Monib - Shubra Al Khaimah)',
    routeLabel: 'El Monib to Shubra Al Khaimah',
    stations: [
      'El Monib',
      'Sakiat Mekky',
      'Omm El-Masryeen',
      'Giza',
      'Faisal',
      'Cairo University',
      'Bohooth',
      'Dokki',
      'Opera',
      'Sadat',
      'Mohamed Naguib',
      'Ataba',
      'Al Shohadaa',
      'Masarra',
      'Rod El-Farag',
      'St. Teresa',
      'Khalafawy',
      'Mezallat',
      'Koliet El-Zeraa',
      'Shubra Al Khaimah'
    ]
  },
  {
    id: 'three',
    label: 'Line 3 (Adly Mansour - Ring Road)',
    routeLabel: 'Adly Mansour to Rod El Farag Corridor',
    stations: [
      'Adly Mansour',
      'Heykestep',
      'Omar Ibn Al Khattab',
      'Qebaa',
      'Hesham Barakat',
      'El Nozha',
      'Nadi El Shams',
      'Alf Maskan',
      'Heliopolis',
      'Haroun',
      'Al Ahram',
      'Koleyet El Banat',
      'Cairo Stadium',
      'Fair Zone',
      'Abbassiya',
      'Abdou Pasha',
      'El Geish',
      'Bab El Shaaria',
      'Ataba',
      'Nasser',
      'Maspero',
      'Safaa Hegazy',
      'Kit Kat',
      'Sudan St.',
      'Imbaba',
      'El Bohy',
      'El-Qawmia',
      'Ring Rd.',
      'Rod El Farag Corridor'
    ]
  }
];

export const fareBands = [
  { distance: 'Up to 9 stations', ticket: '8 EGP', elderly: '4 EGP', specialNeeds: '5 EGP' },
  { distance: '10 to 16 stations', ticket: '10 EGP', elderly: '5 EGP', specialNeeds: '5 EGP' },
  { distance: '17 to 23 stations', ticket: '15 EGP', elderly: '8 EGP', specialNeeds: '5 EGP' },
  { distance: '24 to 39 stations', ticket: '20 EGP', elderly: '10 EGP', specialNeeds: '5 EGP' }
];

export const featureCards = [
  {
    title: 'Complete Metro Map',
    description: 'Interactive map of all three Cairo Metro lines with accurate station information and connections.'
  },
  {
    title: 'Fare Information',
    description: 'Get accurate fare prices for any journey between stations on Cairo Metro lines.'
  },
  {
    title: 'Coordinate Search',
    description: 'Find the closest metro station by entering your GPS coordinates or current location.'
  },
  {
    title: 'Mobile Friendly',
    description: 'Access metro information anytime, anywhere on your phone while traveling in Cairo.'
  }
];

export const heroLayers = [
  { src: '/img/metrom-layer-1.png', depth: '-0.1', className: '', transform: 'translate(6.5px, -3.1px)', style: { position: 'relative' } },
  { src: '/img/metrom-layer-2.png', depth: '0.1', className: '', transform: 'translate(8.4px, -4px)', style: { position: 'absolute' } },
  { src: '/img/metrom-layer-3.png', depth: '-0.15', className: '', transform: 'translate(-7.7px, 3.7px)', style: { position: 'absolute' } },
  { src: '/img/metrom-layer-4-1.png', depth: '0.15', className: '', transform: 'translate(17.4px, -8.4px)', style: { position: 'absolute' } },
  { src: '/img/metrom-layer-4-2.png', depth: '-0.2', className: '', transform: 'translate(17.4px, -8.4px)', style: { position: 'absolute' } },
  { src: '/img/metrom-layer-5.png', depth: '0.2', className: 'zindex-1', transform: 'translate(6.5px, -3.1px)', style: { position: 'absolute' } },
  { src: '/img/metrom-layer-6.png', depth: '-0.25', className: 'zindex-1', transform: 'translate(-18.1px, 8.7px)', style: { position: 'absolute' } },
  { src: '/img/metrom-layer-7.png', depth: '0.25', className: 'zindex-1', transform: 'translate(6.5px, -3.1px)', style: { position: 'absolute' } },
  { src: '/img/metrom-layer-8.png', depth: '0.1', className: 'zindex-1', transform: 'translate(-18.1px, 8.7px)', style: { position: 'absolute' } }
];
