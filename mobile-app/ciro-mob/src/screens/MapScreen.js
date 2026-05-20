import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { useCrisis } from '../context/CrisisContext';
import InteractiveMap from '../components/InteractiveMap';
import { getMap } from '../services/api';
import AnimatedCard from '../components/AnimatedCard';
import PulsingBeacon from '../components/PulsingBeacon';

// ── LAHORE COORDINATE DATASETS ────────────────────
const LAHORE_MAPS = {
    FLOOD: {
        center: { latitude: 31.5126, longitude: 74.3533 }, // Liberty Chowk
        blockedRoutes: [
            { id: 'FBR-1', name: 'Liberty Underpass Submerged', coordinates: [{ latitude: 31.5108, longitude: 74.3512 }, { latitude: 31.5135, longitude: 74.3530 }], severity: 'CRITICAL', color: '#FF3B30' },
            { id: 'FBR-2', name: 'Canal Road Overflowing', coordinates: [{ latitude: 31.5200, longitude: 74.3550 }, { latitude: 31.5250, longitude: 74.3620 }], severity: 'CRITICAL', color: '#FF3B30' },
            { id: 'FBR-3', name: 'MM Alam Road Gridlock', coordinates: [{ latitude: 31.5150, longitude: 74.3460 }, { latitude: 31.5180, longitude: 74.3500 }], severity: 'HIGH', color: '#FF9500' },
        ],
        alternateRoutes: [
            { id: 'FAR-1', name: 'Jail Road Bypass', coordinates: [{ latitude: 31.5310, longitude: 74.3460 }, { latitude: 31.5280, longitude: 74.3380 }, { latitude: 31.5220, longitude: 74.3320 }], status: 'ACTIVE', color: '#34C759' },
            { id: 'FAR-2', name: 'Kalma Chowk Diversion', coordinates: [{ latitude: 31.5030, longitude: 74.3330 }, { latitude: 31.5010, longitude: 74.3450 }, { latitude: 31.5000, longitude: 74.3500 }], status: 'ACTIVE', color: '#30D158' },
        ],
        emergencyMarkers: [
            { id: 'FEM-1', type: 'FLOOD', title: 'Liberty Chowk Flooding', coordinate: { latitude: 31.5126, longitude: 74.3533 }, icon: '🌊', severity: 'CRITICAL', statusBefore: 'IMPASSABLE (Water Level 2.4ft)', statusAfter: 'CLEARING (0.2ft)' },
            { id: 'FEM-2', type: 'ROAD_CLOSURE', title: 'Liberty Underpass CLOSED', coordinate: { latitude: 31.5108, longitude: 74.3512 }, icon: '🚧', severity: 'CRITICAL', statusBefore: 'CLOSED (12 stranded)', statusAfter: 'RESOLVED (0 stranded)' },
            { id: 'FEM-3', type: 'ROAD_CLOSURE', title: 'Canal Road Overflow', coordinate: { latitude: 31.5220, longitude: 74.3580 }, icon: '🌊', severity: 'CRITICAL', statusBefore: 'CLOSED (Submerged)', statusAfter: 'PARTIALLY OPEN' },
            { id: 'FEM-4', type: 'TRAFFIC', title: 'MM Alam Road Gridlock', coordinate: { latitude: 31.5160, longitude: 74.3485 }, icon: '🚗', severity: 'HIGH', statusBefore: 'CONGESTED (3km/h)', statusAfter: 'FLOWING (18km/h)' },
            { id: 'FEM-5', type: 'REROUTE', title: 'Jail Road Reroute', coordinate: { latitude: 31.5310, longitude: 74.3460 }, icon: '🔀', severity: 'MODERATE', statusBefore: 'GRIDLOCK', statusAfter: 'RECOMMENDED (Green)' },
            { id: 'FEM-6', type: 'RESCUE', title: 'WASA Pump Dispatch', coordinate: { latitude: 31.4705, longitude: 74.2405 }, icon: '🚒', severity: 'LOW', statusBefore: 'PENDING', statusAfter: 'ON_SITE (4 pumps)' },
            { id: 'FEM-7', type: 'RESCUE', title: 'Rescue 1122 Medical', coordinate: { latitude: 31.5100, longitude: 74.3450 }, icon: '🚑', severity: 'LOW', statusBefore: 'EN_ROUTE', statusAfter: 'ON_SITE (Active)' },
            { id: 'FEM-8', type: 'TRAFFIC', title: 'Kalma Chowk Signal Override', coordinate: { latitude: 31.5030, longitude: 74.3330 }, icon: '🚦', severity: 'LOW', statusBefore: 'NORMAL_TIMER', statusAfter: '90s GREEN EXTENSION' },
        ]
    },
    SMOG: {
        center: { latitude: 31.4697, longitude: 74.3750 }, // DHA Area
        blockedRoutes: [
            { id: 'SBR-1', name: 'Ferozpur Road Pileup Section', coordinates: [{ latitude: 31.4650, longitude: 74.2880 }, { latitude: 31.4600, longitude: 74.2800 }], severity: 'CRITICAL', color: '#FF3B30' },
            { id: 'SBR-2', name: 'Shahrah-e-Faisal DHA Corridor', coordinates: [{ latitude: 31.4780, longitude: 74.3850 }, { latitude: 31.4730, longitude: 74.3720 }], severity: 'HIGH', color: '#FF9500' },
        ],
        alternateRoutes: [
            { id: 'SAR-1', name: 'Ring Road Lahore Divert', coordinates: [{ latitude: 31.4800, longitude: 74.4050 }, { latitude: 31.4900, longitude: 74.4150 }], status: 'ACTIVE', color: '#34C759' },
            { id: 'SAR-2', name: 'Walton Road Bypass', coordinates: [{ latitude: 31.4880, longitude: 74.3600 }, { latitude: 31.4820, longitude: 74.3500 }], status: 'ACTIVE', color: '#30D158' },
        ],
        emergencyMarkers: [
            { id: 'SEM-1', type: 'SMOG', title: 'DHA Y-Block (AQI 387)', coordinate: { latitude: 31.4697, longitude: 74.3750 }, icon: '🌫️', severity: 'CRITICAL', statusBefore: 'HAZARDOUS (AQI 387)', statusAfter: 'STABLE (Scrubbers active)' },
            { id: 'SEM-2', type: 'ROAD_CLOSURE', title: 'Ferozpur Toll Pileup', coordinate: { latitude: 31.4650, longitude: 74.2880 }, icon: '💥', severity: 'CRITICAL', statusBefore: 'PARTIAL CLOSURE (5 cars)', statusAfter: 'RESOLVED (Cleared)' },
            { id: 'SEM-3', type: 'TRAFFIC', title: 'Shahrah-e-Faisal Jam', coordinate: { latitude: 31.4780, longitude: 74.3850 }, icon: '🚗', severity: 'HIGH', statusBefore: 'CONGESTED (12km/h)', statusAfter: 'FLOWING (28km/h)' },
            { id: 'SEM-4', type: 'TRAFFIC', title: 'Main Boulevard DHA Warning', coordinate: { latitude: 31.4850, longitude: 74.3910 }, icon: '⚠️', severity: 'HIGH', statusBefore: 'SLOW (18km/h)', statusAfter: 'ADVISED (30km/h max)' },
            { id: 'SEM-5', type: 'SMOG', title: 'Airport Road Low Visibility', coordinate: { latitude: 31.5200, longitude: 74.4000 }, icon: '✈️', severity: 'CRITICAL', statusBefore: '0.3km visibility', statusAfter: '0.3km visibility' },
            { id: 'SEM-6', type: 'RESCUE', title: 'Rescue 1122 Ambulance', coordinate: { latitude: 31.5050, longitude: 74.3720 }, icon: '🚑', severity: 'LOW', statusBefore: 'DISPATCHED', statusAfter: 'ON_SITE' },
            { id: 'SEM-7', type: 'RESCUE', title: 'DHA Air Scrubber Unit', coordinate: { latitude: 31.4710, longitude: 74.3680 }, icon: '💧', severity: 'LOW', statusBefore: 'ON_SITE (Testing)', statusAfter: 'ON_SITE (Scrubbing)' },
            { id: 'SEM-8', type: 'TRAFFIC', title: 'M-2 Motorway Restriction', coordinate: { latitude: 31.4550, longitude: 74.2750 }, icon: '🚦', severity: 'MODERATE', statusBefore: 'NORMAL', statusAfter: '30km/h MANDATORY SPEED' },
        ]
    }
};

const SEVERITY_COLORS = {
    CRITICAL: '#FF2D55',
    HIGH: '#FF9500',
    MODERATE: '#FFD607',
    LOW: '#34C759',
};

const URDU_NAMES = {
    'FLOOD': 'طغیانی / سیلاب',
    'SMOG': 'اسموگ / دھند'
};

export default function MapScreen() {
    const { scenario, loading } = useCrisis();
    const [viewState, setViewState] = useState('BEFORE'); // 'BEFORE' | 'AFTER'
    const [selected, setSelected] = useState(null);

    const [mapData, setMapData] = useState(LAHORE_MAPS[scenario] || LAHORE_MAPS.FLOOD);
    const showAfter = viewState === 'AFTER';

    // Dynamic reset & FastAPI zones fetch when scenario changes
    useEffect(() => {
        setSelected(null);
        let active = true;

        async function fetchZones() {
            try {
                console.log("[CIRO MAP] Querying FastAPI /map/zones...");
                const res = await getMap();
                if (res.data && active) {
                    setMapData(res.data);
                }
            } catch (e) {
                console.warn("[CIRO MAP] API failed, reverting to Lahore static assets:", e.message);
                if (active) {
                    setMapData(LAHORE_MAPS[scenario] || LAHORE_MAPS.FLOOD);
                }
            }
        }

        fetchZones();
        return () => { active = false; };
    }, [scenario]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <InteractiveMap
                center={mapData.center}
                radius={scenario === 'FLOOD' ? 1200 : 2500}
                blockedRoutes={mapData.blockedRoutes}
                alternateRoutes={mapData.alternateRoutes}
                emergencyMarkers={mapData.emergencyMarkers}
                showAfter={showAfter}
                onSelectMarker={setSelected}
                severityColors={SEVERITY_COLORS}
            />

            {/* ── TOP CONTROL HUD overlay ── */}
            <View style={styles.topOverlay}>
                <View style={styles.headerTelemetry}>
                    <Text style={styles.headerText}>🛰️ LAHORE COMMAND CENTER EOC</Text>
                    <View style={styles.chipRow}>
                        <View style={styles.activeChip}>
                            <PulsingBeacon color="#FF2D55" size={5} />
                            <Text style={styles.activeChipText}>SIMULATION ACTIVE</Text>
                        </View>
                        <View style={styles.scenarioChip}>
                            <Text style={styles.scenarioChipText}>{URDU_NAMES[scenario] || 'لاہور'}</Text>
                        </View>
                    </View>
                </View>

                {/* State Toggles (Before/After Reroutes) */}
                <View style={styles.toggleContainer}>
                    {['BEFORE', 'AFTER'].map(state => (
                        <TouchableOpacity
                            key={state}
                            style={[
                                styles.toggleBtn, 
                                viewState === state && (state === 'BEFORE' ? styles.activeBefore : styles.activeAfter)
                            ]}
                            onPress={() => { setViewState(state); setSelected(null); }}
                        >
                            <Text style={[styles.toggleText, viewState === state && styles.toggleTextActive]}>
                                {state === 'BEFORE' ? '🔴 PRE-RESPONSE (قبل)' : '🟢 POST-RESPONSE (بعد)'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* ── TACTICAL COMPASS LEGEND ── */}
            <AnimatedCard delay={150} style={styles.legend}>
                <Text style={styles.legendHeader}>SEVERITY LEVELS</Text>
                <LegendItem color="#FF2D55" label="Severe (شدید)" />
                <LegendItem color="#FF9500" label="High (زیادہ)" />
                <LegendItem color="#FFD607" label="Moderate (معتدل)" />
                <LegendItem color="#34C759" label="Cleared (محفوظ)" />
            </AnimatedCard>

            {/* ── MARKER DETAIL CARD overlay ── */}
            {selected && (
                <AnimatedCard delay={50} style={styles.detailCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardIcon}>{selected.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{selected.title}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                                <PulsingBeacon color={selected.color} size={8} />
                                <Text style={[styles.cardStatus, { color: selected.color, marginLeft: 6 }]}>
                                    {selected.activeStatus}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeBox} onPress={() => setSelected(null)}>
                            <Text style={styles.closeBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.cardRow}>
                        <Text style={styles.metaLabel}>GPS COORDS</Text>
                        <Text style={styles.metaVal}>
                            {selected.coordinate?.latitude ? `${selected.coordinate.latitude.toFixed(5)}° N` : 'N/A'}, {selected.coordinate?.longitude ? `${selected.coordinate.longitude.toFixed(5)}° E` : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.cardRow}>
                        <Text style={styles.metaLabel}>SEVERITY VECTOR</Text>
                        <Text style={[styles.metaVal, { color: selected.color, fontWeight: '800' }]}>{selected.severity}</Text>
                    </View>
                </AnimatedCard>
            )}

            {/* ── TACTICAL STATS STATUS INDICATOR HUD ── */}
            <AnimatedCard delay={200} style={styles.bottomBar}>
                <View style={styles.bottomHeader}>
                    <PulsingBeacon color={showAfter ? '#34C759' : '#FF2D55'} size={7} />
                    <Text style={styles.bottomTitle}>
                        {showAfter ? 'SWARM ORCHESTRATION IN EFFECT' : 'UNMANAGED CRITICAL ANOMALY'}
                    </Text>
                </View>
                <Text style={styles.bottomDesc}>
                    {showAfter 
                        ? (scenario === 'FLOOD' ? 'WASA emergency drainage units deployed to Gulberg. Jail Road alternate routes active.' : 'EPA Air scrubber trucks dispatched. Lahore Ring Road speed locks active.') 
                        : (scenario === 'FLOOD' ? 'Liberty Underpass completely submerged. Canal Road overflowing. 12 gridlocked entities trapped.' : 'Hazardous PM2.5 threshold exceeded in DHA. Visibility dropped below 300 meters.')}
                </Text>
            </AnimatedCard>
        </View>
    );
}

function LegendItem({ color, label }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#030508' },

    topOverlay: {
        position: 'absolute', top: 50, left: 16, right: 16,
        alignItems: 'center', gap: 10, zIndex: 99
    },
    headerTelemetry: {
        width: '100%',
        backgroundColor: 'rgba(5, 8, 12, 0.95)',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#111823',
        padding: 10,
        alignItems: 'center',
        gap: 6
    },
    headerText: { color: '#00d2ff', fontSize: 10, fontWeight: '800', fontFamily: 'monospace', letterSpacing: 0.5 },
    chipRow: { flexDirection: 'row', gap: 6 },
    activeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF2D5515', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 0.5, borderColor: '#FF2D5555' },
    activeChipText: { color: '#FF2D55', fontSize: 8, fontWeight: '800', fontFamily: 'monospace' },
    scenarioChip: { backgroundColor: '#A066FF15', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 0.5, borderColor: '#A066FF55' },
    scenarioChipText: { color: '#A066FF', fontSize: 8, fontWeight: '800', fontFamily: 'monospace' },

    toggleContainer: {
        flexDirection: 'row', backgroundColor: 'rgba(5, 8, 12, 0.95)',
        borderRadius: 10, padding: 3, borderWidth: 0.5, borderColor: '#111823',
        width: '100%'
    },
    toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    activeBefore: { backgroundColor: '#FF2D55' },
    activeAfter: { backgroundColor: '#1D9E75' },
    toggleText: { fontSize: 9.5, fontWeight: '800', color: '#4a5b70', fontFamily: 'monospace' },
    toggleTextActive: { color: '#fff' },

    legend: {
        position: 'absolute', top: 180, right: 16,
        backgroundColor: 'rgba(5, 8, 12, 0.95)', borderRadius: 10,
        padding: 12, gap: 8, borderWidth: 0.5, borderColor: '#111823',
        zIndex: 99
    },
    legendHeader: { color: '#4a5b70', fontSize: 7.5, fontWeight: '800', letterSpacing: 0.5, fontFamily: 'monospace', marginBottom: 2 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 6, height: 6, borderRadius: 3 },
    legendText: { fontSize: 9, color: '#8e9aa8', fontWeight: '700', fontFamily: 'monospace' },

    detailCard: {
        position: 'absolute', bottom: 120, left: 16, right: 16,
        backgroundColor: 'rgba(5, 8, 12, 0.96)', borderRadius: 12,
        padding: 14, borderWidth: 0.5, borderColor: '#1d2a3a',
        zIndex: 99
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardIcon: { fontSize: 22 },
    cardTitle: { fontSize: 13, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
    cardStatus: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
    closeBox: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#111823', justifyContent: 'center', alignItems: 'center' },
    closeBtn: { fontSize: 10, color: '#4a5b70', fontWeight: '800' },
    divider: { height: 0.5, backgroundColor: '#111823', marginVertical: 10 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    metaLabel: { fontSize: 8.5, color: '#4a5b70', fontWeight: '700', fontFamily: 'monospace' },
    metaVal: { fontSize: 9.5, color: '#8e9aa8', fontFamily: 'monospace' },

    bottomBar: {
        position: 'absolute', bottom: 25, left: 16, right: 16,
        backgroundColor: 'rgba(5, 8, 12, 0.95)', borderRadius: 12,
        padding: 12, borderWidth: 0.5, borderColor: '#111823',
        alignItems: 'center', zIndex: 99
    },
    bottomHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    bottomTitle: { fontSize: 10.5, fontWeight: '800', color: '#fff', fontFamily: 'monospace', letterSpacing: 0.5 },
    bottomDesc: { fontSize: 10, color: '#4a5b70', textAlign: 'center', lineHeight: 14, fontFamily: 'monospace' },
});