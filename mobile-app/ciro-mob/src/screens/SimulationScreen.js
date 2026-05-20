import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet, SafeAreaView,
    StatusBar, TouchableOpacity, TextInput, Switch,
    ActivityIndicator
} from 'react-native';
import { useCrisis } from '../context/CrisisContext';
import AnimatedCard from '../components/AnimatedCard';
import PulsingBeacon from '../components/PulsingBeacon';

const ACTION_ICONS = {
    ROAD_CLOSURE:      { icon: '🚧', color: '#FF3B30' },
    ROUTE_ACTIVATE:    { icon: '🔀', color: '#34C759' },
    EMERGENCY_DISPATCH:{ icon: '🚨', color: '#FF6B35' },
    ALERT_SENT:        { icon: '📢', color: '#378ADD' },
    SIGNAL_OVERRIDE:   { icon: '🚦', color: '#EF9F27' },
    DRAINAGE_PUMP:     { icon: '💧', color: '#00D2FF' },
    RESCUE_1122:       { icon: '🚑', color: '#E100FF' },
};

const AGENT_COLORS = {
    'ORCHESTRATOR':            '#A066FF',
    'Signal Detection Agent':  '#34C759',
    'Weather Correlation Agent':'#00D2FF',
    'Traffic Analysis Agent':  '#FF9500',
    'Response Planning Agent':  '#FF2D55',
    'Emergency Dispatch Agent': '#AF52DE',
};

function StatCompare({ label, before, after, good }) {
    return (
        <View style={styles.compareRow}>
            <Text style={styles.compareLabel}>{label}</Text>
            <View style={styles.compareValues}>
                <Text style={styles.beforeVal}>{before}</Text>
                <Text style={styles.arrow}>→</Text>
                <Text style={[styles.afterVal, good && styles.valGood]}>{after}</Text>
            </View>
        </View>
    );
}

export default function SimulationScreen() {
    const {
        scenario,
        loading,
        logs,
        simulationState,
        outcomeState,
        apiError,
        runSimulatedAnalysis
    } = useCrisis();

    const [inputText, setInputText] = useState('');
    const [floodRisk, setFloodRisk] = useState(true);
    const [smokeDetected, setSmokeDetected] = useState(false);
    const [powerOutage, setPowerOutage] = useState(false);
    const [analyzed, setAnalyzed] = useState(true);
    const [tab, setTab] = useState('OVERVIEW');
    const loaderScrollRef = useRef(null);

    const PRESETS = [
        {
            title: '🌧️ Gulberg Flash Flood',
            text: 'Liberty Chowk is completely flooded, underpass submerged, 12 cars stranded! RESCUE 1122 and WASA needed urgently.',
            floodRisk: true,
            smokeDetected: false,
            powerOutage: true,
        },
        {
            title: '🌫️ DHA Smog Incident',
            text: 'Extremely hazardous AQI 387 blanket at DHA Main Boulevard. Visibility below 300m. saans lena mushkil ho raha hai.',
            floodRisk: false,
            smokeDetected: true,
            powerOutage: false,
        }
    ];

    // Auto scroll loader console
    useEffect(() => {
        if (loading && loaderScrollRef.current) {
            setTimeout(() => {
                loaderScrollRef.current?.scrollToEnd({ animated: true });
            }, 80);
        }
    }, [logs.length, loading]);

    const handleApplyPreset = (preset) => {
        setInputText(preset.text);
        setFloodRisk(preset.floodRisk);
        setSmokeDetected(preset.smokeDetected);
        setPowerOutage(preset.powerOutage);
    };

    const handleStartAnalysis = () => {
        runSimulatedAnalysis(inputText || 'Manual generic alert signal reported near Liberty Chowk.', {
            floodRisk,
            smokeDetected,
            powerOutage
        });
        setAnalyzed(true);
    };

    const sim = simulationState;
    const outcome = outcomeState || {
        wasa: { title: 'WASA Pump Dispatch Unit', status: 'DISPATCHED', units: 4, flowRate: '4,200 Litres/Min', eta: '8 mins', station: 'Gulberg Sewerage Command' },
        rescue: { title: 'Rescue 1122 Medical Swarm', status: 'EN ROUTE', ambulances: 3, paramedics: 8, eta: '6 mins', priority: 'CRITICAL (P1)' },
        sms: { title: 'Broadcast Emergency Alert', sender: 'PROV_ALERT', text: '⚠️ EMERGENCY ADVISORY: Liberty Chowk Gulberg flooded. Red diversion routes active. Avoid travel.', deliveryRate: '98.4%' },
        timeline: []
    };

    const TABS = ['OVERVIEW', 'ACTIONS', 'TICKETS'];

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" />

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Crisis Intelligence</Text>
                    <Text style={[styles.headerSub, { color: apiError ? '#FF9500' : '#34C759' }]}>
                        {apiError ? '⚠️ Local Offline Fallback' : '⚡ FastAPI Backend Active'}
                    </Text>
                </View>
                {analyzed && !loading && (
                    <TouchableOpacity style={styles.resetBtn} onPress={() => setAnalyzed(false)}>
                        <Text style={styles.resetBtnText}>🔄 Trigger New</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                /* ── ORCHESTRATION TERMINAL STREAMING LOADER ── */
                <View style={styles.loaderContainer}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                        <PulsingBeacon color="#34C759" size={14} />
                        <Text style={styles.loaderTitle}>🧠 SWARM ORCHESTRATION ACTIVE</Text>
                    </View>
                    <Text style={styles.loaderSub}>5 AI Agent nodes correlating sensory data live. Execution stream below.</Text>
                    
                    <ScrollView 
                        ref={loaderScrollRef}
                        style={styles.terminalLoaderCard} 
                        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
                    >
                        {logs.map((log, idx) => {
                            if (!log) return null;
                            return (
                                <View key={idx} style={styles.loaderLogLine}>
                                    <Text style={styles.loaderLogTime}>[{log.timestamp || '--:--'}]</Text>
                                    <Text style={[styles.loaderLogAgent, { color: AGENT_COLORS[log.agent] || '#8E8E93' }]}>{log.agent || 'SYSTEM'}:</Text>
                                    <Text style={styles.loaderLogMsg}>{log.message || ''}</Text>
                                    {log.tool && (
                                        <View style={styles.loaderToolBox}>
                                            <Text style={styles.loaderToolText}><Text style={{ color: '#FF375F' }}>&gt; Tool Invoke: </Text>{log.tool.name}</Text>
                                            <Text style={styles.loaderToolText}><Text style={{ color: '#FFD60A' }}>&gt; Input: </Text>{log.tool.input}</Text>
                                            <Text style={styles.loaderToolText}><Text style={{ color: '#34C759' }}>&gt; Output: </Text>{log.tool.output}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                        <View style={styles.loaderStreamingIndicator}>
                            <ActivityIndicator color="#34C759" size="small" />
                            <Text style={styles.loaderStreamingText}>Executing swarm tools...</Text>
                        </View>
                    </ScrollView>
                </View>
            ) : !analyzed ? (
                /* ── SIGNAL INPUT SCREEN ── */
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.sectionLabel}>CHOOSE PRESET INCIDENT PAYLOAD</Text>
                    <AnimatedCard delay={100}>
                        <View style={styles.presetsRow}>
                            {PRESETS.map((p, idx) => (
                                <TouchableOpacity key={idx} style={styles.presetCard} onPress={() => handleApplyPreset(p)}>
                                    <Text style={inputText === p.text ? styles.presetTitleActive : styles.presetTitle}>{p.title}</Text>
                                    <Text style={styles.presetDesc} numberOfLines={2}>{p.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </AnimatedCard>

                    <Text style={styles.sectionLabel}>CUSTOM INCIDENT TEXT SIGNAL</Text>
                    <AnimatedCard delay={200}>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Type Roman Urdu or English emergency text report..."
                                placeholderTextColor="#555"
                                multiline
                                numberOfLines={4}
                                value={inputText}
                                onChangeText={setInputText}
                            />
                        </View>
                    </AnimatedCard>

                    <Text style={styles.sectionLabel}>RISK CORRELATION TOGGLES</Text>
                    <AnimatedCard delay={300}>
                        <View style={styles.card}>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>🌧️ Flash Flood Anomaly detected</Text>
                                <Switch
                                    value={floodRisk}
                                    onValueChange={(val) => {
                                        setFloodRisk(val);
                                        if (val) setSmokeDetected(false);
                                    }}
                                    trackColor={{ false: '#111', true: '#1D9E75' }}
                                    thumbColor={floodRisk ? '#fff' : '#444'}
                                />
                            </View>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>🌫️ Smog / Smoke Index Threshold Exceeded</Text>
                                <Switch
                                    value={smokeDetected}
                                    onValueChange={(val) => {
                                        setSmokeDetected(val);
                                        if (val) setFloodRisk(false);
                                    }}
                                    trackColor={{ false: '#111', true: '#1D9E75' }}
                                    thumbColor={smokeDetected ? '#fff' : '#444'}
                                />
                            </View>
                            <View style={styles.toggleRow}>
                                <Text style={styles.toggleLabel}>🔌 Grid Station / Power Outage risk</Text>
                                <Switch
                                    value={powerOutage}
                                    onValueChange={setPowerOutage}
                                    trackColor={{ false: '#111', true: '#1D9E75' }}
                                    thumbColor={powerOutage ? '#fff' : '#444'}
                                />
                            </View>
                        </View>
                    </AnimatedCard>

                    <AnimatedCard delay={400}>
                        <TouchableOpacity style={styles.analyzeBtn} onPress={handleStartAnalysis}>
                            <Text style={styles.analyzeBtnText}>⚡ RUN SWARM COORDINATION</Text>
                        </TouchableOpacity>
                    </AnimatedCard>
                </ScrollView>
            ) : (
                /* ── HACKATHON EXECUTION DASHBOARD VIEW ── */
                <View style={{ flex: 1 }}>
                    <View style={styles.tabRow}>
                        {TABS.map(t => (
                            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {/* ── OVERVIEW TAB (EXECUTION DASHBOARD) ── */}
                        {tab === 'OVERVIEW' && (
                            <>
                                <AnimatedCard delay={50}>
                                    <View style={styles.statusBadge}>
                                        <PulsingBeacon color="#34C759" size={8} />
                                        <Text style={[styles.statusText, { marginLeft: 8 }]}>ORCHESTRATED SWARM RESPONSE COMPLETE</Text>
                                    </View>
                                </AnimatedCard>

                                <Text style={styles.sectionLabel}>QUANTIFIED IMPACT METRICS</Text>
                                <AnimatedCard delay={100}>
                                    <View style={styles.kpiGrid}>
                                        {[
                                            { value: sim.summary?.congestionReduced, label: 'Congestion\nReduced', color: '#34C759' },
                                            { value: sim.summary?.vehiclesCleared, label: 'Cleared\nEntities', color: '#00D2FF' },
                                            { value: `${sim.summary?.estimatedLivesProtected || 120}+`, label: 'Lives\nProtected', color: '#FF2D55' },
                                        ].map(k => (
                                            <View key={k.label} style={styles.kpiCard}>
                                                <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                                                <Text style={styles.kpiLabel}>{k.label}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </AnimatedCard>

                                {/* WASA & RESCUE 1122 DISPATCH OVERLAYS */}
                                <Text style={styles.sectionLabel}>MUNICIPAL RESPONDER DISPATCH STATUS</Text>
                                <View style={styles.dispatchGrid}>
                                    {/* WASA Dispatch Card */}
                                    <AnimatedCard delay={150} style={[styles.dispatchCard, { borderLeftColor: '#00D2FF' }]}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.dispatchTitle}>🚰 {outcome.wasa?.title || 'WASA Dispatch'}</Text>
                                            <View style={styles.pulseRow}>
                                                <PulsingBeacon color="#34C759" size={6} />
                                                <Text style={styles.dispatchStatusText}>{outcome.wasa?.status || 'DISPATCHED'}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.dispatchDesc}>Units Active: <Text style={styles.dispatchHighlight}>{outcome.wasa?.units || 4} Pump Trucks</Text></Text>
                                        <Text style={styles.dispatchDesc}>Drainage Rate: <Text style={styles.dispatchHighlight}>{outcome.wasa?.flowRate || '4,200 LPM'}</Text></Text>
                                        <Text style={styles.dispatchDesc}>Station: <Text style={styles.dispatchSubHighlight}>{outcome.wasa?.station}</Text></Text>
                                        <View style={styles.etaBarBg}>
                                            <View style={[styles.etaBarFill, { width: '80%', backgroundColor: '#00D2FF' }]} />
                                        </View>
                                        <Text style={styles.etaText}>On-Site ETA: {outcome.wasa?.eta || '8 mins'}</Text>
                                    </AnimatedCard>

                                    {/* Rescue 1122 Dispatch Card */}
                                    <AnimatedCard delay={200} style={[styles.dispatchCard, { borderLeftColor: '#FF2D55' }]}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.dispatchTitle}>🚑 {outcome.rescue?.title || 'Rescue 1122'}</Text>
                                            <View style={styles.pulseRow}>
                                                <PulsingBeacon color="#34C759" size={6} />
                                                <Text style={styles.dispatchStatusText}>{outcome.rescue?.status || 'EN ROUTE'}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.dispatchDesc}>Ambulances: <Text style={styles.dispatchHighlight}>{outcome.rescue?.ambulances || 3} ALS Crews</Text></Text>
                                        <Text style={styles.dispatchDesc}>Paramedics: <Text style={styles.dispatchHighlight}>{outcome.rescue?.paramedics || 8} Active EMTs</Text></Text>
                                        <Text style={styles.dispatchDesc}>EMS Priority: <Text style={{ color: '#FF2D55', fontWeight: '700' }}>{outcome.rescue?.priority || 'P1'}</Text></Text>
                                        <View style={styles.etaBarBg}>
                                            <View style={[styles.etaBarFill, { width: '90%', backgroundColor: '#FF2D55' }]} />
                                        </View>
                                        <Text style={styles.etaText}>On-Site ETA: {outcome.rescue?.eta || '6 mins'}</Text>
                                    </AnimatedCard>
                                </View>

                                {/* SMS PUBLIC CELL BROADCAST PREVIEW */}
                                <Text style={styles.sectionLabel}>PUBLIC RESIDENT WARNING ALERTS</Text>
                                <AnimatedCard delay={250}>
                                    <View style={styles.smsCard}>
                                        <View style={styles.smsHeader}>
                                            <Text style={styles.smsSender}>📢 GOVERNMENT CELL BROADCAST · {outcome.sms?.sender || 'CIV_ALERT'}</Text>
                                            <Text style={styles.smsDelivery}>Delivered: {outcome.sms?.deliveryRate || '98%'}</Text>
                                        </View>
                                        <View style={styles.smsBubble}>
                                            <Text style={styles.smsText}>{outcome.sms?.text || '⚠️ EMERGENCY: Alert issued.'}</Text>
                                        </View>
                                    </View>
                                </AnimatedCard>

                                {/* CONNECTED TIMELINE PLOTS */}
                                <Text style={styles.sectionLabel}>EMERGENCY SWARM DISPATCH TIMELINE</Text>
                                <AnimatedCard delay={300} style={styles.timelineCard}>
                                    {outcome.timeline?.map((step, idx) => (
                                        <View key={idx} style={styles.timelineNode}>
                                            <View style={styles.timelineLeft}>
                                                <Text style={styles.timelineTime}>{step.time}</Text>
                                                <View style={styles.timelineLine} />
                                            </View>
                                            <View style={styles.timelineDotContainer}>
                                                <PulsingBeacon color={idx === outcome.timeline.length - 1 ? '#34C759' : '#00D2FF'} size={6} />
                                            </View>
                                            <View style={styles.timelineRight}>
                                                <Text style={styles.timelineNodeTitle}>{step.title}</Text>
                                                <Text style={styles.timelineNodeDesc}>{step.desc}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </AnimatedCard>

                                <Text style={styles.sectionLabel}>BEFORE vs AFTER CORRIDOR COMPARISON</Text>
                                <AnimatedCard delay={350}>
                                    <View style={styles.compareBox}>
                                        <StatCompare label="Traffic Congestion Ratio" before={sim.before?.congestion} after={sim.after?.congestion} good />
                                        <StatCompare label="Average Corridor Velocity" before={sim.before?.avgSpeed} after={sim.after?.avgSpeed} good />
                                        <StatCompare label="Stranded/At-Risk Entities" before={sim.before?.vehiclesStranded} after={sim.after?.vehiclesStranded} good />
                                        <StatCompare label="Warning Alerts Transmitted" before={sim.before?.alertsSent} after={sim.after?.alertsSent} good />
                                        <StatCompare label="Emergency System Status" before={sim.before?.systemStatus} after={sim.after?.systemStatus} good />
                                    </View>
                                </AnimatedCard>
                            </>
                        )}

                        {/* ── ACTIONS TAB ── */}
                        {tab === 'ACTIONS' && (
                            <>
                                <Text style={styles.sectionLabel}>{sim.actions?.length || 0} DECISIONS EXECUTED</Text>
                                {sim.actions?.map((action, i) => {
                                    const cfg = ACTION_ICONS[action.type] || { icon: '⚙️', color: '#555' };
                                    return (
                                        <AnimatedCard key={i} delay={i * 40} style={{ marginBottom: 12 }}>
                                            <View style={[styles.actionCard, { borderLeftColor: cfg.color }]}>
                                                <View style={styles.actionRow}>
                                                    <Text style={styles.actionIcon}>{cfg.icon}</Text>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.actionType, { color: cfg.color }]}>{action.type.replace(/_/g, ' ')}</Text>
                                                        <Text style={styles.actionDetail}>{action.detail}</Text>
                                                    </View>
                                                    <View style={[styles.statusPill, { backgroundColor: cfg.color + '15' }]}>
                                                        <Text style={[styles.statusPillText, { color: cfg.color }]}>{action.status}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </AnimatedCard>
                                    );
                                })}
                            </>
                        )}

                        {/* ── TICKETS TAB ── */}
                        {tab === 'TICKETS' && (
                            <>
                                <Text style={styles.sectionLabel}>{sim.tickets?.length || 0} INCIDENT TICKETS ISSUED</Text>
                                {sim.tickets?.map((t, i) => (
                                    <AnimatedCard key={i} delay={i * 40} style={{ marginBottom: 12 }}>
                                        <View style={styles.ticketCard}>
                                            <View style={styles.ticketHeader}>
                                                <Text style={styles.ticketId}>{t.id}</Text>
                                                <View style={[styles.priorityBadge, t.priority === 'P1' ? styles.p1 : styles.p2]}>
                                                    <Text style={styles.priorityText}>{t.priority}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.ticketType}>{t.type.replace(/_/g, ' ')}</Text>
                                            <Text style={styles.ticketStatus}>● {t.status}</Text>
                                        </View>
                                    </AnimatedCard>
                                ))}
                            </>
                        )}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#030508' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#111823' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
    headerSub: { fontSize: 11, color: '#4a5b70', marginTop: 2, fontFamily: 'monospace' },
    
    resetBtn: { backgroundColor: '#111823', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5, borderColor: '#222' },
    resetBtnText: { color: '#00D2FF', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },

    tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginVertical: 8 },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#070a0f', alignItems: 'center', borderWidth: 0.5, borderColor: '#111823' },
    tabActive: { backgroundColor: '#1D9E7515', borderColor: '#1D9E75' },
    tabText: { fontSize: 11, color: '#4a5b70', fontWeight: '700', fontFamily: 'monospace' },
    tabTextActive: { color: '#1D9E75' },

    sectionLabel: { fontSize: 9, color: '#4a5b70', letterSpacing: 0.8, marginBottom: 10, marginTop: 14, fontWeight: '700', fontFamily: 'monospace' },
    
    presetsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    presetCard: { flex: 1, backgroundColor: '#070a0f', borderRadius: 10, borderWidth: 0.5, borderColor: '#111823', padding: 12 },
    presetTitle: { fontSize: 12, fontWeight: '700', color: '#8e9aa8', marginBottom: 4 },
    presetTitleActive: { fontSize: 12, fontWeight: '700', color: '#A066FF', marginBottom: 4 },
    presetDesc: { fontSize: 10, color: '#4a5b70', lineHeight: 14 },

    inputContainer: { backgroundColor: '#070a0f', borderRadius: 10, borderWidth: 0.5, borderColor: '#111823', padding: 12, marginBottom: 14 },
    textInput: { color: '#fff', fontSize: 12, textAlignVertical: 'top', minHeight: 80, fontFamily: 'monospace' },

    card: { backgroundColor: '#070a0f', borderRadius: 12, borderWidth: 0.5, borderColor: '#111823', padding: 14, marginBottom: 16 },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#111823' },
    toggleLabel: { fontSize: 12, color: '#8e9aa8', fontWeight: '500', fontFamily: 'monospace' },

    analyzeBtn: { backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
    analyzeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, fontFamily: 'monospace' },

    loaderContainer: { flex: 1, padding: 16, backgroundColor: '#020305' },
    loaderTitle: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.8, textAlign: 'center', marginTop: 10, fontFamily: 'monospace' },
    loaderSub: { fontSize: 10, color: '#445', textAlign: 'center', marginTop: 4, marginBottom: 16, fontFamily: 'monospace' },
    
    terminalLoaderCard: { flex: 1, backgroundColor: '#05070a', borderRadius: 10, borderWidth: 0.5, borderColor: '#1d2a3a' },
    loaderLogLine: { marginBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#1d2a3a33', paddingBottom: 8 },
    loaderLogTime: { fontSize: 9.5, color: '#445', fontFamily: 'monospace' },
    loaderLogAgent: { fontSize: 10.5, fontWeight: '700', fontFamily: 'monospace', marginTop: 2 },
    loaderLogMsg: { fontSize: 11.5, color: '#ccc', fontFamily: 'monospace', marginTop: 2, lineHeight: 16 },
    
    loaderToolBox: { backgroundColor: '#020305', borderRadius: 6, borderWidth: 0.5, borderColor: '#1d2a3a', padding: 6, marginTop: 6, gap: 2 },
    loaderToolText: { fontSize: 9.5, color: '#a1a1aa', fontFamily: 'monospace', lineHeight: 12 },
    
    loaderStreamingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingVertical: 6 },
    loaderStreamingText: { color: '#34C759', fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },

    statusBadge: { borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center', backgroundColor: '#051a10', borderWidth: 0.5, borderColor: '#1D9E75' },
    statusText: { color: '#1D9E75', fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },

    kpiGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    kpiCard: { flex: 1, backgroundColor: '#070a0f', borderRadius: 10, borderWidth: 0.5, borderColor: '#111823', padding: 14, alignItems: 'center' },
    kpiValue: { fontSize: 22, fontWeight: '800', fontFamily: 'monospace' },
    kpiLabel: { fontSize: 8.5, color: '#4a5b70', marginTop: 4, textAlign: 'center', lineHeight: 11, fontWeight: '700', fontFamily: 'monospace' },

    // Dispatch Card overrides
    dispatchGrid: { flexDirection: 'column', gap: 10, marginBottom: 16 },
    dispatchCard: { backgroundColor: '#070a0f', borderRadius: 10, borderWidth: 0.5, borderColor: '#111823', borderLeftWidth: 4, padding: 14 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    dispatchTitle: { fontSize: 12.5, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
    pulseRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dispatchStatusText: { fontSize: 9, fontWeight: '800', color: '#34C759', fontFamily: 'monospace' },
    dispatchDesc: { fontSize: 11, color: '#8e9aa8', marginTop: 4, fontFamily: 'monospace' },
    dispatchHighlight: { color: '#fff', fontWeight: '700' },
    dispatchSubHighlight: { color: '#4a5b70' },
    etaBarBg: { height: 4, backgroundColor: '#111823', borderRadius: 2, overflow: 'hidden', marginTop: 8 },
    etaBarFill: { height: '100%', borderRadius: 2 },
    etaText: { fontSize: 9.5, color: '#4a5b70', fontWeight: '700', fontFamily: 'monospace', marginTop: 6 },

    // SMS Warning Panel
    smsCard: { backgroundColor: '#070a0f', borderRadius: 10, borderWidth: 0.5, borderColor: '#111823', padding: 14, marginBottom: 16 },
    smsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    smsSender: { fontSize: 9, fontWeight: '800', color: '#EF9F27', fontFamily: 'monospace' },
    smsDelivery: { fontSize: 9, color: '#4a5b70', fontWeight: '700', fontFamily: 'monospace' },
    smsBubble: { backgroundColor: '#111823', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: '#EF9F27' },
    smsText: { fontSize: 11.5, color: '#d1d5db', lineHeight: 16, fontFamily: 'monospace' },

    // Timeline plots
    timelineCard: { backgroundColor: '#070a0f', borderRadius: 10, borderWidth: 0.5, borderColor: '#111823', padding: 14, marginBottom: 16 },
    timelineNode: { flexDirection: 'row', minHeight: 44 },
    timelineLeft: { width: 60, alignItems: 'flex-end', paddingRight: 10, position: 'relative' },
    timelineTime: { fontSize: 9, color: '#4a5b70', fontFamily: 'monospace', fontWeight: '700' },
    timelineLine: { position: 'absolute', right: -3, top: 12, bottom: -12, width: 1, backgroundColor: '#111823' },
    timelineDotContainer: { width: 16, alignItems: 'center', zIndex: 9 },
    timelineRight: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
    timelineNodeTitle: { fontSize: 11, fontWeight: '800', color: '#fff', fontFamily: 'monospace' },
    timelineNodeDesc: { fontSize: 10, color: '#4a5b70', fontFamily: 'monospace', marginTop: 2 },

    compareBox: { backgroundColor: '#070a0f', borderRadius: 12, borderWidth: 0.5, borderColor: '#111823', padding: 14 },
    compareRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#111823' },
    compareLabel: { fontSize: 12, color: '#8e9aa8', flex: 1, fontFamily: 'monospace' },
    compareValues: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    beforeVal: { fontSize: 12, color: '#FF3B30', fontWeight: '700', fontFamily: 'monospace' },
    arrow: { fontSize: 12, color: '#333' },
    afterVal: { fontSize: 12, color: '#8e9aa8', fontWeight: '700', fontFamily: 'monospace' },
    valGood: { color: '#34C759' },

    actionCard: { backgroundColor: '#070a0f', borderRadius: 10, borderLeftWidth: 3, padding: 12, marginBottom: 8, borderWidth: 0.5, borderColor: '#111823' },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionIcon: { fontSize: 20 },
    actionType: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, fontFamily: 'monospace' },
    actionDetail: { fontSize: 12, color: '#4a5b70', marginTop: 2, fontFamily: 'monospace' },
    statusPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    statusPillText: { fontSize: 9, fontWeight: '700', fontFamily: 'monospace' },

    ticketCard: { backgroundColor: '#070a0f', borderRadius: 10, borderWidth: 0.5, borderColor: '#111823', padding: 14, marginBottom: 8 },
    ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    ticketId: { fontSize: 12, fontWeight: '700', color: '#A066FF', fontFamily: 'monospace' },
    priorityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    p1: { backgroundColor: '#FF3B3015' },
    p2: { backgroundColor: '#EF9F2715' },
    priorityText: { fontSize: 10, fontWeight: '700', color: '#EF9F27', fontFamily: 'monospace' },
    ticketType: { fontSize: 12, color: '#8e9aa8', marginBottom: 4, fontFamily: 'monospace' },
    ticketStatus: { fontSize: 11, color: '#34C759', fontWeight: '600', fontFamily: 'monospace' },
});