import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

const TRANSLATIONS = {
    // Markers
    'Liberty Chowk Flooding': 'لبرٹی چوک سیلاب',
    'Liberty Underpass CLOSED': 'لبرٹی انڈر پاس بند',
    'Canal Road Overflow': 'کینال روڈ طغیانی',
    'MM Alam Road Gridlock': 'ایم ایم عالم روڈ جام',
    'Jail Road Reroute': 'جیل روڈ متبادل راستہ',
    'WASA Pump Dispatch': 'واسا پمپ روانگی',
    'Rescue 1122 Medical': 'ریسکیو 1122 طبی امداد',
    'Kalma Chowk Signal Override': 'کلمہ چوک سگنل کنٹرول',
    'DHA Y-Block (AQI 387)': 'ڈی ایچ اے وائی بلاک اسموگ',
    'Ferozpur Toll Pileup': 'فیروز پور ٹول حادثہ',
    'Shahrah-e-Faisal Jam': 'شاہراہ فیصل ٹریفک جام',
    'Main Boulevard DHA Warning': 'مین بلیوارڈ ڈی ایچ اے وارننگ',
    'Airport Road Low Visibility': 'ایئرپورٹ روڈ کم حد نگاہ',
    'Rescue 1122 Ambulance': 'ریسکیو 1122 ایمبولینس',
    'DHA Air Scrubber Unit': 'ڈی ایچ اے ایئر سکروبر',
    'M-2 Motorway Restriction': 'ایم 2 موٹر وے حد رفتار',

    // Routes
    'Liberty Underpass Submerged': 'لبرٹی انڈر پاس بند',
    'Canal Road Overflowing': 'کینال روڈ طغیانی',
    'MM Alam Road Gridlock': 'ایم ایم عالم روڈ جام',
    'Jail Road Bypass': 'جیل روڈ بائی پاس',
    'Kalma Chowk Diversion': 'کلمہ چوک متبادل',
    'Ferozpur Road Pileup Section': 'فیروز پور روڈ بندش',
    'Shahrah-e-Faisal DHA Corridor': 'شاہراہ فیصل کاریڈور',
    'Ring Road Lahore Divert': 'لاہور رنگ روڈ متبادل',
    'Walton Road Bypass': 'والٹن روڈ بائی پاس'
};

export default function InteractiveMap({
    center,
    radius,
    blockedRoutes,
    alternateRoutes,
    emergencyMarkers,
    showAfter,
    onSelectMarker,
    severityColors
}) {
    // Translate markers and routes on the fly for localized Map display
    const translatedMarkers = emergencyMarkers?.map(m => ({
        ...m,
        titleUrdu: TRANSLATIONS[m.title] || m.title
    }));

    const translatedBlockedRoutes = blockedRoutes?.map(r => ({
        ...r,
        nameUrdu: TRANSLATIONS[r.name] || r.name
    }));

    const translatedAlternateRoutes = alternateRoutes?.map(r => ({
        ...r,
        nameUrdu: TRANSLATIONS[r.name] || r.name
    }));

    // Generate Leaflet iframe source with native Urdu labels and absolute cyber dark themes
    const mapHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                html, body, #map {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 0;
                    background-color: #030508;
                }
                /* High-tech pulsing marker */
                .pulse-marker {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                }
                .pulse-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid #ffffff;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                }
                .pulse-ring {
                    position: absolute;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    border: 1.5px solid;
                    opacity: 0;
                    animation: pulseRadar 2s infinite ease-out;
                }
                @keyframes pulseRadar {
                    0% {
                        transform: scale(0.4);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1.6);
                        opacity: 0;
                    }
                }
                /* Custom Cyber Dark Tooltip for Urdu Labels */
                .custom-tooltip {
                    background-color: rgba(5, 8, 12, 0.95) !important;
                    border: 0.5px solid #1d2a3a !important;
                    border-radius: 6px !important;
                    color: #e2e8f0 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', sans-serif !important;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
                    padding: 4px 8px !important;
                    white-space: nowrap !important;
                }
                .custom-tooltip::before {
                    border-bottom-color: rgba(5, 8, 12, 0.95) !important;
                }
                .leaflet-bar {
                    border: 0.5px solid #1d2a3a !important;
                    box-shadow: none !important;
                }
                .leaflet-bar a {
                    background-color: #06090e !important;
                    color: #00d2ff !important;
                    border-bottom: 0.5px solid #1d2a3a !important;
                }
                .leaflet-bar a:hover {
                    background-color: #121b26 !important;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                // Initialize Lahore Map
                const map = L.map('map', {
                    zoomControl: true,
                    attributionControl: false
                }).setView([${center.latitude}, ${center.longitude}], 13.5);

                // CartoDB Dark Matter tile layer for absolute pitch-black aesthetics
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 20
                }).addTo(map);

                // Severity configuration
                const colors = ${JSON.stringify(severityColors)};

                // Rerouting Polylines
                const showAfter = ${showAfter};
                if (!showAfter) {
                    // Pre-response: draw blocked routes in neon red
                    const blocked = ${JSON.stringify(translatedBlockedRoutes || [])};
                    blocked.forEach(route => {
                        const coords = route.coordinates.map(c => [c.latitude, c.longitude]);
                        const pl = L.polyline(coords, {
                            color: '#FF3B30',
                            weight: 5,
                            opacity: 0.85,
                            dashArray: '8, 8'
                        }).addTo(map);

                        pl.bindTooltip(\`<div style="color: #FF3B30; font-weight: bold; font-family: sans-serif; font-size: 10px;">\${route.nameUrdu}</div>\`, {
                            sticky: true,
                            className: 'custom-tooltip'
                        });
                    });
                } else {
                    // Post-response: draw coordinated alternate routes in neon green
                    const routes = ${JSON.stringify(translatedAlternateRoutes || [])};
                    routes.forEach(route => {
                        const coords = route.coordinates.map(c => [c.latitude, c.longitude]);
                        const pl = L.polyline(coords, {
                            color: '#34C759',
                            weight: 5.5,
                            opacity: 0.95
                        }).addTo(map);

                        pl.bindTooltip(\`<div style="color: #34C759; font-weight: bold; font-family: sans-serif; font-size: 10px;">\${route.nameUrdu}</div>\`, {
                            sticky: true,
                            className: 'custom-tooltip'
                        });
                    });
                }

                // Add 8+ hardcoded interactive markers with dynamic Urdu Tooltips
                const markers = ${JSON.stringify(translatedMarkers || [])};
                markers.forEach(m => {
                    const sevColor = colors[m.severity] || '#34C759';
                    const iconHtml = \`
                        <div class="pulse-marker">
                            <div class="pulse-ring" style="border-color: \${sevColor}"></div>
                            <div class="pulse-dot" style="background-color: \${sevColor}"></div>
                        </div>
                    \`;

                    const myIcon = L.divIcon({
                        html: iconHtml,
                        className: 'custom-div-icon',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                    });

                    const leafletMarker = L.marker([m.coordinate.latitude, m.coordinate.longitude], { icon: myIcon })
                        .addTo(map);

                    // Permanent high-contrast Urdu label floating under the tactical pulse blip
                    leafletMarker.bindTooltip(\`<div style="display: flex; align-items: center; gap: 6px;"><span>\${m.icon}</span><span>\${m.titleUrdu}</span></div>\`, {
                        permanent: true,
                        direction: 'bottom',
                        className: 'custom-tooltip',
                        offset: [0, 8]
                    });

                    leafletMarker.on('click', () => {
                        window.parent.postMessage({
                            type: 'MARKER_CLICK',
                            payload: {
                                id: m.id,
                                title: m.titleUrdu, // pass translated Urdu title back
                                icon: m.icon,
                                severity: m.severity,
                                coordinate: m.coordinate,
                                activeStatus: showAfter ? m.statusAfter : m.statusBefore,
                                color: sevColor
                            }
                        }, '*');
                    });
                });
            </script>
        </body>
        </html>
    `;

    // Handle postMessage communication from iframe
    React.useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'MARKER_CLICK') {
                onSelectMarker(event.data.payload);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onSelectMarker]);

    return (
        <View style={styles.container}>
            {/* Tactical Compass Overlay */}
            <View style={styles.compassContainer}>
                <Text style={styles.compassText}>TACTICAL TELEMETRY GRID · LAHORE</Text>
                <Text style={styles.compassCoords}>N {center.latitude.toFixed(4)}° / E {center.longitude.toFixed(4)}°</Text>
            </View>

            {/* Premium road-level dark mode map iframe */}
            <iframe
                title="Lahore Crisis Map"
                srcDoc={mapHtml}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
            />
            
            <Text style={styles.mapTip}>💡 Tap tactical blips to examine agent swarm response data</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#030508',
        position: 'relative',
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: '#111823',
        overflow: 'hidden',
    },
    compassContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(3, 5, 8, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: '#111823',
        zIndex: 999,
        pointerEvents: 'none',
    },
    compassText: { color: '#00d2ff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, fontFamily: 'monospace' },
    compassCoords: { color: '#4a5b70', fontSize: 8, marginTop: 4, fontFamily: 'monospace', fontWeight: '700' },
    mapTip: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        color: '#4a5b70',
        fontSize: 9,
        fontWeight: '700',
        zIndex: 999,
        backgroundColor: 'rgba(3, 5, 8, 0.95)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: '#11182355',
        pointerEvents: 'none',
        fontFamily: 'monospace'
    }
});
