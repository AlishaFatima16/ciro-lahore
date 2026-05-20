import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    SafeAreaView, StatusBar, TouchableOpacity,
    RefreshControl, Animated, ActivityIndicator,
} from 'react-native';
import { useCrisis } from '../context/CrisisContext';
import AnimatedCard from '../components/AnimatedCard';
import PulsingBeacon from '../components/PulsingBeacon';

const LEVEL_CONFIG = {
    critical: { color: '#FF3B30', bg: '#1a0505', border: '#FF3B3033', badge: '🚨 CRITICAL' },
    warning:  { color: '#FF9500', bg: '#1a1005', border: '#FF950033', badge: '⚠️ WARNING' },
    success:  { color: '#34C759', bg: '#051a05', border: '#34C75933', badge: '✅ SUCCESS' },
    info:     { color: '#00D2FF', bg: '#05141a', border: '#00D2FF33', badge: 'ℹ️ INFO' },
    system:   { color: '#8E8E93', bg: '#0f0f12', border: '#8E8E9333', badge: '🛠️ SYSTEM' },
};

const AGENT_COLORS = {
    'ORCHESTRATOR':            '#A066FF',
    'Signal Detection Agent':  '#34C759',
    'Weather Correlation Agent':'#00D2FF',
    'Traffic Analysis Agent':  '#FF9500',
    'Response Planning Agent':  '#FF2D55',
    'Emergency Dispatch Agent': '#AF52DE',
};

const MOCK_ORCHESTRATION_STREAM = [
    {
        id: 'trace-1',
        agent: 'Signal Detection Agent',
        level: 'info',
        timestamp: '10:02:00',
        message: 'Scan triggered across Lahore municipal database looking for anomalies.',
        state: 'RUNNING',
        type: 'SENSORY_POLL',
        tool: { name: 'DB_Sensor_Scanner', input: '{ "coords": "31.5126, 74.3533", "radius": "5km" }', output: '{ "signals_detected": 4, "anomaly_index": 0.85 }' }
    },
    {
        id: 'trace-2',
        agent: 'Signal Detection Agent',
        level: 'warning',
        timestamp: '10:02:02',
        message: 'Keywords "water logging", "submerged underpass", and "Gulberg" detected in complaint feeds.',
        state: 'COMPLETED',
        type: 'KEYWORD_MATCH',
        tool: { name: 'NLP_Keyword_Parser', input: 'complaint_text: "Liberty underpass fully under water..."', output: 'match: "Gulberg Urban Flood", confidence: 0.94' }
    },
    {
        id: 'trace-3',
        agent: 'Weather Correlation Agent',
        level: 'info',
        timestamp: '10:02:04',
        message: 'Correlating meteorological sensor data for Gulberg corridor.',
        state: 'RUNNING',
        type: 'WEATHER_LOOKUP',
        tool: { name: 'WASA_Rain_Sensors', input: '{ "station_id": "WASA-GUL-3" }', output: '{ "precip_rate": "42mm/hr", "total_accumulation": "84mm" }' }
    },
    {
        id: 'trace-4',
        agent: 'Weather Correlation Agent',
        level: 'critical',
        timestamp: '10:02:06',
        message: 'High precipitation threshold crossed. Gulberg flood risk verified.',
        state: 'COMPLETED',
        type: 'METRIC_VERIFIED',
    },
    {
        id: 'trace-5',
        agent: 'Traffic Analysis Agent',
        level: 'info',
        timestamp: '10:02:08',
        message: 'Polling real-time traffic speeds along MM Alam Road and Kalma Chowk.',
        state: 'RUNNING',
        type: 'TELEMETRY_POLL',
        tool: { name: 'Google_Traffic_Telemetry', input: '{ "segment_id": "MM-ALAM-BLVD" }', output: '{ "avg_speed": "3km/h", "congestion_index": 0.96 }' }
    },
    {
        id: 'trace-6',
        agent: 'Traffic Analysis Agent',
        level: 'warning',
        timestamp: '10:02:10',
        message: 'Severe congestion spike detected near Liberty Roundabout. Gridlock risk critical.',
        state: 'COMPLETED',
        type: 'CONGESTION_ALERT',
    },
    {
        id: 'trace-7',
        agent: 'Response Planning Agent',
        level: 'info',
        timestamp: '10:02:12',
        message: 'Initializing alternate bypass routing for at-risk vehicles.',
        state: 'RUNNING',
        type: 'ALGORITHM_EXEC',
        tool: { name: 'Dijkstra_Bypass_Router', input: '{ "start": "Kalma Chowk", "end": "Jail Road", "blocked": "Liberty" }', output: '{ "bypass_route": "Walton-Bypass", "est_travel_time": "14mins" }' }
    },
    {
        id: 'trace-8',
        agent: 'Response Planning Agent',
        level: 'success',
        timestamp: '10:02:14',
        message: 'Alternative rerouting path generated. Broadcasting to municipal digital boards.',
        state: 'COMPLETED',
        type: 'ROUTING_SUCCESS',
    },
    {
        id: 'trace-9',
        agent: 'Emergency Dispatch Agent',
        level: 'info',
        timestamp: '10:02:16',
        message: 'Orchestrating responder dispatch signals to WASA and Rescue 1122.',
        state: 'RUNNING',
        type: 'API_DISPATCH',
        tool: { name: 'WASA_Emergency_Gateway', input: '{ "pumps": 4, "location": "Liberty Underpass" }', output: '{ "status": "DISPATCHED", "eta": "8mins" }' }
    },
    {
        id: 'trace-10',
        agent: 'Emergency Dispatch Agent',
        level: 'success',
        timestamp: '10:02:18',
        message: 'Response orchestration complete. WASA pump trucks deployed. Alternate routing confirmed.',
        state: 'SUCCESS',
        type: 'ORCHESTRATION_END',
    }
];

function LogEntry({ log }) {
    const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
    const agentColor = AGENT_COLORS[log.agent] || '#8E8E93';
    
    const [expanded, setExpanded] = useState(true);

    return (
        <View style={[styles.logCard, { borderLeftColor: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <View style={styles.logHeader}>
                <View style={styles.agentInfo}>
                    <Text style={[styles.agentText, { color: agentColor }]}>● {(log.agent || 'SYSTEM').toUpperCase()}</Text>
                </View>
                <Text style={styles.logTime}>{log.timestamp}</Text>
            </View>
            
            <Text style={styles.logMsg}>{log.message}</Text>
            
            {log.tool && (
                <View style={styles.toolCard}>
                    <TouchableOpacity 
                        style={styles.toolHeader} 
                        onPress={() => setExpanded(!expanded)}
                    >
                        <Text style={styles.toolTitle}>🛠️ TOOL INVOCATION: <Text style={styles.toolName}>{log.tool.name}</Text></Text>
                        <Text style={styles.toggleArrow}>{expanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {expanded && (
                        <View style={styles.toolBody}>
                            <Text style={styles.toolCode}><Text style={styles.codePrompt}>INPUT:  </Text>{log.tool.input}</Text>
                            <Text style={styles.toolCode}><Text style={styles.codePrompt}>RETURN: </Text>{log.tool.output}</Text>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.footerRow}>
                <View style={[styles.stateBadge, { borderColor: cfg.color + '44' }]}>
                    <Text style={[styles.stateText, { color: cfg.color }]}>{log.state || 'SUCCESS'}</Text>
                </View>
                {log.type && <Text style={styles.logType}>{log.type}</Text>}
            </View>
        </View>
    );
}

export default function LogsScreen() {
    const { logs: backendLogs, scenario, loading: backendLoading } = useCrisis();
    const [isStreamingSim, setIsStreamingSim] = useState(false);
    const [streamLogs, setStreamLogs] = useState([]);
    const [streamIndex, setStreamIndex] = useState(0);
    const [filter, setFilter] = useState('ALL');
    const scrollRef = useRef(null);

    // Dynamic agent states for our live telemetry panel
    const [agentStates, setAgentStates] = useState({
        detection: { status: 'IDLE', progress: 0, lastAction: 'Ready to scan complaint database' },
        analysis:  { status: 'IDLE', progress: 0, lastAction: 'Correlating sensory coordinates' },
        response:  { status: 'IDLE', progress: 0, lastAction: 'Standby for dispatch coordinates' }
    });

    const isLive = isStreamingSim || backendLoading;
    const activeLogs = (isStreamingSim ? streamLogs : backendLogs).filter(Boolean);

    // Filter implementation
    const FILTERS = ['ALL', 'critical', 'warning', 'success', 'info', 'system'];
    const filtered = filter === 'ALL' ? activeLogs : activeLogs.filter(l => l.level === filter);

    // Auto-polling simulated trace stream
    useEffect(() => {
        let interval;
        if (isStreamingSim) {
            interval = setInterval(() => {
                if (streamIndex < MOCK_ORCHESTRATION_STREAM.length) {
                    const nextLog = MOCK_ORCHESTRATION_STREAM[streamIndex];
                    setStreamLogs(prev => [...prev, nextLog]);
                    setStreamIndex(prev => prev + 1);

                    // Update live agent states based on active step
                    setAgentStates(prev => {
                        const next = { ...prev };
                        const agent = nextLog.agent;

                        if (agent === 'Signal Detection Agent') {
                            next.detection = {
                                status: 'ACTIVE',
                                progress: streamIndex === 0 ? 45 : 100,
                                lastAction: nextLog.message
                            };
                        } else if (agent === 'Weather Correlation Agent' || agent === 'Traffic Analysis Agent') {
                            next.detection.status = 'COMPLETED';
                            next.detection.progress = 100;
                            next.analysis = {
                                status: 'ACTIVE',
                                progress: agent === 'Weather Correlation Agent' ? 50 : 100,
                                lastAction: nextLog.message
                            };
                        } else {
                            next.detection.status = 'COMPLETED';
                            next.analysis.status = 'COMPLETED';
                            next.analysis.progress = 100;
                            next.response = {
                                status: 'ACTIVE',
                                progress: nextLog.type === 'API_DISPATCH' ? 70 : 100,
                                lastAction: nextLog.message
                            };
                        }
                        return next;
                    });
                } else {
                    setIsStreamingSim(false);
                    setAgentStates(prev => ({
                        detection: { ...prev.detection, status: 'COMPLETED' },
                        analysis:  { ...prev.analysis, status: 'COMPLETED' },
                        response:  { ...prev.response, status: 'COMPLETED' }
                    }));
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isStreamingSim, streamIndex]);

    // Triggers simulated live trace polling sequence
    const handleTriggerLiveSim = () => {
        setStreamLogs([]);
        setStreamIndex(0);
        setIsStreamingSim(true);
        setAgentStates({
            detection: { status: 'ACTIVE', progress: 10, lastAction: 'Initializing sensor scan...' },
            analysis:  { status: 'PENDING', progress: 0, lastAction: 'Waiting for confirmed signal' },
            response:  { status: 'PENDING', progress: 0, lastAction: 'Waiting for completed analysis' }
        });
    };

    // Auto Scroll to bottom when streaming new logs
    useEffect(() => {
        if (isLive && scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 80);
        }
    }, [activeLogs.length, isLive]);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" />

            {/* ── TERMINAL HEADER ── */}
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRow}>
                        <View style={[styles.terminalIndicator, { backgroundColor: isLive ? '#34C759' : '#8E8E93' }]} />
                        <Text style={styles.headerTitle}>CIRO Orchestration Telemetry</Text>
                    </View>
                    <Text style={styles.headerSub}>
                        🛰️ {activeLogs.length} nodes active · {scenario} Scenario
                    </Text>
                </View>
                {isLive ? (
                    <View style={styles.liveBadge}>
                        <PulsingBeacon color="#34C759" size={8} />
                        <Text style={[styles.liveText, { marginLeft: 6 }]}>LIVE POLLING</Text>
                    </View>
                ) : (
                    <View style={styles.idleBadge}>
                        <PulsingBeacon color="#8E8E93" size={6} interval={3500} />
                        <Text style={[styles.idleText, { marginLeft: 6 }]}>STANDBY</Text>
                    </View>
                )}
            </View>

            {/* ── THREE LIVE AGENT PANEL CARDS ── */}
            <View style={styles.agentPanelRow}>
                {/* 1. Detection Agent */}
                <AnimatedCard style={[styles.agentCard, agentStates.detection.status === 'ACTIVE' && styles.activeAgentBorder]}>
                    <View style={styles.agentCardHeader}>
                        <Text style={styles.agentCardName}>🔍 DETECTION</Text>
                        <PulsingBeacon 
                            color={agentStates.detection.status === 'ACTIVE' ? '#34C759' : agentStates.detection.status === 'COMPLETED' ? '#00D2FF' : '#444'} 
                            size={6} 
                        />
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${agentStates.detection.progress}%`, backgroundColor: '#34C759' }]} />
                    </View>
                    <Text numberOfLines={1} style={styles.agentActionText}>{agentStates.detection.lastAction}</Text>
                </AnimatedCard>

                {/* 2. Analysis Agent */}
                <AnimatedCard style={[styles.agentCard, agentStates.analysis.status === 'ACTIVE' && styles.activeAgentBorder]}>
                    <View style={styles.agentCardHeader}>
                        <Text style={styles.agentCardName}>🧠 ANALYSIS</Text>
                        <PulsingBeacon 
                            color={agentStates.analysis.status === 'ACTIVE' ? '#34C759' : agentStates.analysis.status === 'COMPLETED' ? '#00D2FF' : '#444'} 
                            size={6} 
                        />
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${agentStates.analysis.progress}%`, backgroundColor: '#00D2FF' }]} />
                    </View>
                    <Text numberOfLines={1} style={styles.agentActionText}>{agentStates.analysis.lastAction}</Text>
                </AnimatedCard>

                {/* 3. Response Agent */}
                <AnimatedCard style={[styles.agentCard, agentStates.response.status === 'ACTIVE' && styles.activeAgentBorder]}>
                    <View style={styles.agentCardHeader}>
                        <Text style={styles.agentCardName}>🚒 RESPONSE</Text>
                        <PulsingBeacon 
                            color={agentStates.response.status === 'ACTIVE' ? '#34C759' : agentStates.response.status === 'COMPLETED' ? '#00D2FF' : '#444'} 
                            size={6} 
                        />
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${agentStates.response.progress}%`, backgroundColor: '#FF2D55' }]} />
                    </View>
                    <Text numberOfLines={1} style={styles.agentActionText}>{agentStates.response.lastAction}</Text>
                </AnimatedCard>
            </View>

            {/* ── LIVE CONTROLLER PANEL ── */}
            <View style={styles.controlPanel}>
                <TouchableOpacity style={styles.triggerButton} onPress={handleTriggerLiveSim}>
                    <Text style={styles.triggerText}>⚡ RUN STAGE DEMO STREAM</Text>
                </TouchableOpacity>
                <Text style={styles.triggerTip}>Triggers 2s incremental swarm logging sequence</Text>
            </View>

            {/* ── FILTERING CONSOLE TABS ── */}
            <View style={{ maxHeight: 44 }}>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.filterScroll} 
                    contentContainerStyle={styles.filterRow}
                >
                    {FILTERS.map(f => {
                        const cfg = LEVEL_CONFIG[f] || { color: '#8E8E93' };
                        const active = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterTab, active && { backgroundColor: cfg.color + '22', borderColor: cfg.color }]}
                                onPress={() => setFilter(f)}
                            >
                                <Text style={[styles.filterText, active && { color: cfg.color }]}>
                                    {f === 'ALL' ? `ALL (${activeLogs.length})` : `${f.toUpperCase()} (${activeLogs.filter(l => l.level === f).length})`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── CONSOLE STREAMS FEED ── */}
            <ScrollView
                ref={scrollRef}
                style={styles.terminalScreen}
                contentContainerStyle={styles.content}
            >
                {filtered.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Console stream waiting. Press "⚡ RUN STAGE DEMO STREAM" above or run Swarm Coordination in Simulation.</Text>
                    </View>
                ) : (
                    filtered.map((log, i) => (
                        <AnimatedCard key={log.id || i} delay={30} style={{ marginBottom: 12 }}>
                            <LogEntry log={log} />
                        </AnimatedCard>
                    ))
                )}
                
                {isLive && (
                    <View style={styles.streamingIndicatorCard}>
                        <ActivityIndicator color="#34C759" size="small" />
                        <Text style={styles.streamingIndicatorText}>Swarm executing agent tools live...</Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#030508' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 16, paddingBottom: 10,
        borderBottomWidth: 0.5, borderBottomColor: '#111823',
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    terminalIndicator: { width: 8, height: 8, borderRadius: 4 },
    headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3, fontFamily: 'monospace' },
    headerSub: { fontSize: 11, color: '#4a5b70', marginTop: 3, fontFamily: 'monospace' },

    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C75915', borderRadius: 8, borderWidth: 0.5, borderColor: '#34C759', paddingHorizontal: 10, paddingVertical: 4 },
    liveText: { color: '#34C759', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    idleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111823', borderRadius: 8, borderWidth: 0.5, borderColor: '#222', paddingHorizontal: 10, paddingVertical: 4 },
    idleText: { color: '#8E8E93', fontSize: 9, fontWeight: '700' },

    // Agent panel styling
    agentPanelRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
        backgroundColor: '#030508',
        borderBottomWidth: 0.5,
        borderBottomColor: '#111823'
    },
    agentCard: {
        flex: 1,
        backgroundColor: '#070a0f',
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: '#111823',
        padding: 8,
        minHeight: 64,
        justifyContent: 'space-between'
    },
    activeAgentBorder: {
        borderColor: '#00d2ff',
        shadowColor: '#00d2ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    agentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    agentCardName: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8e9aa8',
        fontFamily: 'monospace'
    },
    progressBarBg: {
        height: 3.5,
        backgroundColor: '#111823',
        borderRadius: 2,
        overflow: 'hidden',
        marginVertical: 4
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2
    },
    agentActionText: {
        fontSize: 8.5,
        color: '#4a5b70',
        fontFamily: 'monospace',
        marginTop: 2
    },

    // Control panel styling
    controlPanel: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#06090e',
        borderBottomWidth: 0.5,
        borderBottomColor: '#111823'
    },
    triggerButton: {
        backgroundColor: '#A066FF',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 0.5,
        borderColor: '#b485ff'
    },
    triggerText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        fontFamily: 'monospace'
    },
    triggerTip: {
        color: '#4a5b70',
        fontSize: 9,
        fontFamily: 'monospace'
    },

    filterScroll: { maxHeight: 44, borderBottomWidth: 0.5, borderBottomColor: '#111823' },
    filterRow: { paddingHorizontal: 12, gap: 8, paddingVertical: 6 },
    filterTab: {
        borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5,
        borderWidth: 0.5, borderColor: '#111823', backgroundColor: '#070a0f',
    },
    filterText: { fontSize: 10, color: '#4a5b70', fontWeight: '700', fontFamily: 'monospace' },

    terminalScreen: { flex: 1, backgroundColor: '#020305' },
    content: { padding: 12, paddingBottom: 30 },

    logCard: {
        borderRadius: 10, borderLeftWidth: 3.5,
        padding: 14,
        borderWidth: 0.5,
    },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    agentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    agentText: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 0.3 },
    logTime: { fontSize: 10, color: '#4a5b70', fontFamily: 'monospace' },
    logMsg: { fontSize: 12, color: '#e2e8f0', lineHeight: 18, marginBottom: 8, fontFamily: 'monospace' },

    toolCard: {
        backgroundColor: '#030508', borderRadius: 8,
        borderWidth: 0.5, borderColor: '#111823',
        marginBottom: 8, padding: 8,
    },
    toolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toolTitle: { fontSize: 11, color: '#FFD60A', fontWeight: '700', fontFamily: 'monospace' },
    toolName: { color: '#00D2FF' },
    toggleArrow: { fontSize: 10, color: '#4a5b70' },
    toolBody: { marginTop: 6, gap: 4, borderTopWidth: 0.5, borderTopColor: '#111823', paddingTop: 6 },
    toolCode: { fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace', lineHeight: 14 },
    codePrompt: { color: '#FF375F' },

    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#111823', paddingTop: 8 },
    stateBadge: { borderRadius: 4, borderWidth: 0.5, paddingHorizontal: 6, paddingVertical: 2 },
    stateText: { fontSize: 8.5, fontWeight: '800', letterSpacing: 0.5 },
    logType: { fontSize: 9, color: '#4a5b70', letterSpacing: 0.5, fontFamily: 'monospace' },

    streamingIndicatorCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#34C75910', borderRadius: 8, borderWidth: 0.5, borderColor: '#34C75933', marginTop: 8 },
    streamingIndicatorText: { color: '#34C759', fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },

    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { color: '#4a5b70', fontSize: 12, textAlign: 'center', lineHeight: 18, fontFamily: 'monospace', paddingHorizontal: 30 },
});