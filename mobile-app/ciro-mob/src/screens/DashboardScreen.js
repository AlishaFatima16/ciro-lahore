import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    SafeAreaView, StatusBar, TouchableOpacity,
    ActivityIndicator, RefreshControl,
} from 'react-native';
import { useCrisis } from '../context/CrisisContext';
import AnimatedCard from '../components/AnimatedCard';
import PulsingBeacon from '../components/PulsingBeacon';

const SEVERITY_COLORS = {
    CRITICAL: '#FF3B30',
    HIGH: '#FF6B35',
    MODERATE: '#EF9F27',
    LOW: '#34C759',
    NONE: '#555',
};

export default function DashboardScreen() {
    const {
        scenario,
        loading,
        apiError,
        getIngestPayload,
        getSocialSignals,
        getTrafficData,
        getWeatherData
    } = useCrisis();

    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState('');

    useEffect(() => {
        setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, [scenario]);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            setLastUpdated(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 800);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.center}>
                    <ActivityIndicator color="#1D9E75" size="large" />
                    <Text style={styles.loadingText}>Orchestrating agent traces...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const payload = getIngestPayload();
    const weather = getWeatherData();
    const traffic = getTrafficData();
    const social = getSocialSignals();

    const isFlood = scenario === 'FLOOD';
    const severity = isFlood ? 'CRITICAL' : 'CRITICAL';
    const confidence = isFlood ? 94 : 96;
    const location = isFlood ? 'Liberty Chowk / Gulberg, Lahore' : 'DHA / Ferozpur Road, Lahore';
    const affectedArea = isFlood ? '3.5 km radius' : '10 km radius';
    const estimatedAffected = isFlood ? '140,000+ residents' : '340,000+ residents';

    const sevColor = SEVERITY_COLORS[severity] || SEVERITY_COLORS.NONE;

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1D9E75" />}
            >
                {/* ── HEADER ── */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>CIRO Dashboard</Text>
                        <Text style={[styles.headerSub, { color: apiError ? '#FF9500' : '#34C759' }]}>
                            {apiError ? '⚠️ Local Offline Fallback' : '⚡ FastAPI Cloud Synced'} · {lastUpdated}
                        </Text>
                    </View>
                    <View style={styles.scenarioBadge}>
                        <Text style={styles.scenarioBadgeText}>{scenario} SCENARIO</Text>
                    </View>
                </View>

                {/* ── ACTIVE WARNING BANNER ── */}
                <AnimatedCard delay={100}>
                    <View style={[styles.criticalBanner, { borderColor: sevColor + '66' }]}>
                        <PulsingBeacon color={sevColor} size={10} />
                        <Text style={[styles.criticalText, { color: sevColor, marginLeft: 8 }]}>
                            🚨  ACTIVE AGENTIC RESPONSE DETECTED
                        </Text>
                    </View>
                </AnimatedCard>

                {/* ── CRISIS DETAILS CARD ── */}
                <AnimatedCard delay={200}>
                    <View style={[styles.card, { borderColor: sevColor + '44' }]}>
                        <Text style={styles.crisisType}>{isFlood ? 'Urban Flooding' : 'Smog Crisis'}</Text>
                        <Text style={styles.crisisSubtype}>
                            {isFlood ? 'Monsoon Cloudburst & Drain Overflow' : 'Hazardous PM2.5 Inversion'}
                        </Text>
                        <Text style={styles.crisisLoc}>📍  {location}</Text>

                        <View style={styles.divider} />

                        {[
                            { label: 'Incident Severity', value: severity, color: sevColor },
                            { label: 'Agent Confidence', value: `${confidence}%`, color: '#1D9E75' },
                            { label: 'Affected Boundary', value: affectedArea },
                            { label: 'Population at Risk', value: estimatedAffected },
                        ].map(row => (
                            <View key={row.label} style={styles.detailRow}>
                                <Text style={styles.detailKey}>{row.label}</Text>
                                <Text style={[styles.detailVal, row.color && { color: row.color, fontWeight: '700' }]}>
                                    {row.value}
                                </Text>
                            </View>
                        ))}
                    </View>
                </AnimatedCard>

                {/* ── STATS ROW ── */}
                <AnimatedCard delay={300}>
                    <View style={styles.statsRow}>
                        {[
                            { value: `${confidence}%`, label: 'Certainty' },
                            { value: isFlood ? '847' : '5 Acc.', label: isFlood ? 'Stalled' : 'Events' },
                            { value: isFlood ? '94%' : '84%', label: 'Congestion' },
                        ].map(s => (
                            <View key={s.label} style={styles.statBox}>
                                <Text style={styles.statVal}>{s.value}</Text>
                                <Text style={styles.statKey}>{s.label}</Text>
                            </View>
                        ))}
                    </View>
                </AnimatedCard>

                {/* ── WEATHER CONDITIONS ── */}
                <Text style={styles.sectionLabel}>WEATHER INSTRUMENTS</Text>
                <AnimatedCard delay={400}>
                    <View style={styles.card}>
                        {[
                            { icon: '🌧️', label: 'Atmosphere', value: isFlood ? 'Heavy Cloudburst' : 'Hazardous Smog Blanket' },
                            { icon: '💧', label: isFlood ? 'Precipitation' : 'PM2.5 Index', value: isFlood ? '94 mm (Extreme)' : '312 µg/m³ (20x limit)' },
                            { icon: '💨', label: 'Wind Velocity', value: isFlood ? '22 km/h' : '3 km/h (Dead Calm)' },
                            { icon: '🔭', label: 'Alert Warning', value: weather.alerts?.[0]?.message || 'No alerts' },
                        ].map(r => (
                            <View key={r.label} style={styles.detailRow}>
                                <Text style={styles.detailKey}>{r.icon} {r.label}</Text>
                                <Text style={styles.detailVal} numberOfLines={1} ellipsizeMode="tail">{r.value}</Text>
                            </View>
                        ))}
                    </View>
                </AnimatedCard>

                {/* ── TRAFFIC STATIONS ── */}
                <Text style={styles.sectionLabel}>TRAFFIC MONITORING</Text>
                <AnimatedCard delay={500}>
                    <View style={styles.card}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailKey}>🚗 Corridor Congestion</Text>
                            <Text style={[styles.detailVal, { color: '#FF6B35', fontWeight: '700' }]}>
                                {isFlood ? '94%' : '84% (DHA Area)'}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailKey}>🚘 Average Speed</Text>
                            <Text style={[styles.detailVal, { fontWeight: '700' }]}>
                                {isFlood ? '3 km/h (Gridlock)' : '14 km/h (Slowing)'}
                            </Text>
                        </View>
                        <Text style={styles.roadListHeader}>🚧 Affected Arterials & Incidents</Text>
                        {traffic.zones?.flatMap(z => z.roads || [])?.map((road, i) => (
                            <View key={i} style={styles.roadRow}>
                                <View style={[styles.roadDot, { backgroundColor: road.status === 'CLOSED' || road.status === 'SEVERELY_CONGESTED' ? '#FF3B30' : '#EF9F27' }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.roadText}>{road.road} — <Text style={styles.roadStatusText}>{road.status}</Text></Text>
                                    <Text style={styles.roadIncidentText}>{road.incident}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </AnimatedCard>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0a0a0a' },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { color: '#666', fontSize: 13 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
    headerSub: { fontSize: 11, color: '#555', marginTop: 2 },

    scenarioBadge: {
        backgroundColor: '#1D9E7522', borderRadius: 8,
        borderWidth: 0.5, borderColor: '#1D9E75',
        paddingHorizontal: 10, paddingVertical: 5,
    },
    scenarioBadgeText: { color: '#1D9E75', fontSize: 10, fontWeight: '700' },

    criticalBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderWidth: 1, borderRadius: 10,
        backgroundColor: '#1a0505', padding: 12, marginBottom: 14,
    },
    pulseDot: { width: 10, height: 10, borderRadius: 5 },
    criticalText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

    card: {
        backgroundColor: '#111', borderRadius: 12,
        borderWidth: 0.5, borderColor: '#222',
        padding: 16, marginBottom: 14,
    },
    crisisType: { fontSize: 20, fontWeight: '700', color: '#fff' },
    crisisSubtype: { fontSize: 12, color: '#666', marginTop: 2, marginBottom: 6 },
    crisisLoc: { fontSize: 12, color: '#888', marginBottom: 14 },
    divider: { height: 0.5, backgroundColor: '#222', marginBottom: 12 },

    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
        borderBottomWidth: 0.5, borderBottomColor: '#1d1d1d',
    },
    detailKey: { fontSize: 12, color: '#666' },
    detailVal: { fontSize: 12, color: '#aaa' },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
    statBox: {
        flex: 1, backgroundColor: '#111', borderRadius: 10,
        borderWidth: 0.5, borderColor: '#222',
        padding: 12, alignItems: 'center',
    },
    statVal: { fontSize: 20, fontWeight: '700', color: '#fff' },
    statKey: { fontSize: 9, color: '#555', marginTop: 3 },

    sectionLabel: { fontSize: 9, color: '#444', letterSpacing: 1, marginBottom: 10 },

    roadListHeader: { fontSize: 12, color: '#999', marginTop: 12, marginBottom: 8, fontWeight: '600' },
    roadRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#1d1d1d' },
    roadDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
    roadText: { fontSize: 12, color: '#ddd', fontWeight: '500' },
    roadStatusText: { fontWeight: '700' },
    roadIncidentText: { fontSize: 11, color: '#555', marginTop: 2 },
});