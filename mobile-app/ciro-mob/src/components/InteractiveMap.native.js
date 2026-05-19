import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

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
    // Custom premium dark theme style for Google Maps on Android/iOS (pitch black cyber canvas)
    const darkMapStyle = [
        { "elementType": "geometry", "stylers": [{ "color": "#06090e" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }, { "lightness": 13 }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#52627a" }] },
        { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },
        { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#111823" }, { "weight": 1.2 }] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#06090e" }] },
        { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#0c0f16" }] },
        { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#121b26" }] },
        { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#06090e" }, { "width": 1 }] },
        { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#172332" }] },
        { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#0d141d" }] },
        { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#0c0f16" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#030508" }] }
    ];

    return (
        <View style={styles.container}>
            {/* Tactical Compass Overlay */}
            <View style={styles.compassContainer}>
                <Text style={styles.compassText}>TACTICAL TELEMETRY GRID · LAHORE</Text>
                <Text style={styles.compassCoords}>N {center.latitude.toFixed(4)}° / E {center.longitude.toFixed(4)}°</Text>
            </View>

            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: center.latitude,
                    longitude: center.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                customMapStyle={darkMapStyle}
                provider="google"
            >
                {/* Draw emergency markers with localized Urdu titles */}
                {emergencyMarkers?.map(marker => {
                    const statusText = showAfter ? marker.statusAfter : marker.statusBefore;
                    const sevColor = severityColors[marker.severity] || '#34C759';
                    const urduTitle = TRANSLATIONS[marker.title] || marker.title;
                    
                    return (
                        <Marker
                            key={marker.id}
                            coordinate={marker.coordinate}
                            title={`${marker.icon} ${urduTitle}`}
                            description={statusText}
                            onPress={() => onSelectMarker({ ...marker, title: urduTitle, activeStatus: statusText, color: sevColor })}
                            pinColor={sevColor}
                        />
                    );
                })}

                {/* Draw blocked routes pre-response */}
                {!showAfter && blockedRoutes?.map(route => (
                    <Polyline
                        key={route.id}
                        coordinates={route.coordinates}
                        strokeColor="#FF3B30"
                        strokeWidth={4.5}
                        lineDashPattern={[6, 6]}
                    />
                ))}

                {/* Draw alternate routes post-response */}
                {showAfter && alternateRoutes?.map(route => (
                    <Polyline
                        key={route.id}
                        coordinates={route.coordinates}
                        strokeColor="#34C759"
                        strokeWidth={5}
                    />
                ))}
            </MapView>

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
    map: {
        flex: 1,
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
        fontFamily: 'monospace'
    }
});
