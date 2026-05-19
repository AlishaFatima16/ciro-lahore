/**
 * mockData.js
 * Realistic mock crisis signals for CIRO demo.
 * Simulates: Islamabad G-10 urban flooding scenario.
 */

const defaultSignals = [
  // Social Media Reports
  {
    source: 'social',
    text: 'G-10 mein pani bhar gaya hai! Roads completely flooded. Please help! #G10Flood',
    location: 'G-10/1, Islamabad',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    user: '@citizen_pk_1'
  },
  {
    source: 'social',
    text: 'Vehicles stranded near G-10 main road underpass. Water level rising fast.',
    location: 'G-10 Markaz',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    user: '@g10_resident'
  },
  {
    source: 'social',
    text: 'Koi sun raha hai? G-10/3 mein ghar mein pani ghus gaya. Emergency chahiye!',
    location: 'G-10/3, Islamabad',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    user: '@isb_local'
  },

  // Weather Alerts
  {
    source: 'weather',
    message: 'HEAVY RAINFALL ALERT: Islamabad receiving 78mm/hr rainfall. Flash flood risk HIGH for low-lying areas including G-9, G-10, G-11.',
    rainfall: '78mm/hr',
    windSpeed: '45 km/h',
    location: 'Islamabad Metropolitan Area',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    agency: 'PMD Pakistan Meteorological Department'
  },
  {
    source: 'weather',
    message: 'Extended heavy rainfall forecast: Next 6 hours. Drainage system capacity exceeded.',
    rainfall: '65mm/hr',
    location: 'Islamabad',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    agency: 'PMD'
  },

  // Traffic Sensors
  {
    source: 'traffic',
    message: 'Traffic spike detected on G-10 Main Boulevard. Speed: 4km/h (normal: 50km/h). Congestion: 87%',
    road: 'G-10 Main Boulevard',
    congestion: 87,
    speed: 4,
    location: 'G-10, Islamabad',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    sensor: 'TRF-ISB-G10-001'
  },
  {
    source: 'traffic',
    message: 'PWD Road G-10 blocked. 340 vehicles stranded. Emergency rerouting required.',
    road: 'PWD Road G-10',
    congestion: 100,
    vehiclesStranded: 340,
    location: 'G-10, Islamabad',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    sensor: 'TRF-ISB-G10-002'
  },

  // Emergency Complaints
  {
    source: 'complaint',
    message: 'URGENT: Elderly person stuck in flooded car near G-10 underpass. Medical assistance required immediately.',
    location: 'G-10 Markaz Underpass',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    reportedBy: 'CDA Emergency Line 1637'
  },
  {
    source: 'complaint',
    message: 'Children school bus stranded in water on G-10 road. Requesting rescue team.',
    location: 'G-10/2, Islamabad',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    reportedBy: 'Rescue 1122'
  }
];

module.exports = { defaultSignals };
