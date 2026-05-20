import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

// Import local JSON datasets as local fallbacks
import floodPayload from '../actual-mock-data/ingest_payload_flood.json';
import smogPayload from '../actual-mock-data/ingest_payload_smog.json';
import floodSocial from '../actual-mock-data/social_signals_flood.json';
import smogSocial from '../actual-mock-data/social_signals_smog.json';
import floodTraffic from '../actual-mock-data/traffic_flood.json';
import smogTraffic from '../actual-mock-data/traffic_smog.json';
import floodWeather from '../actual-mock-data/weather_flood.json';
import smogWeather from '../actual-mock-data/weather_smog.json';

// Import central FastAPI Axios clients
import {
    ingestSignals,
    getCrisis,
    getLogs,
    getSimulation,
    getMap,
    getOutcomeState
} from '../services/api';

const CrisisContext = createContext(null);

export const CrisisProvider = ({ children }) => {
    const [scenario, setScenario] = useState('FLOOD');
    const [loading, setLoading] = useState(false);
    const [customSignal, setCustomSignal] = useState('');
    const [apiError, setApiError] = useState(null); // Displays soft badge if API is offline
    const activeIntervalRef = useRef(null);
    
    const [toggles, setToggles] = useState({
        floodRisk: true,
        smokeDetected: false,
        powerOutage: false,
    });
    
    // Complete offline log database (used as dynamic stream and API fallback)
    const ALL_TRACES = {
        FLOOD: [
            { id: 1, timestamp: '10:02:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_START', message: '🚀 Antigravity Orchestrator initialized for FLOOD_RESPONSE in Lahore.', state: 'SUCCESS' },
            { id: 2, timestamp: '10:02:10', agent: 'Signal Detection Agent', level: 'info', type: 'SIGNAL_NORMALIZATION', message: '🔍 Initializing social and sensory signal ingestion scan...', state: 'RUNNING' },
            { id: 3, timestamp: '10:02:25', agent: 'Signal Detection Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: GrepSearch({ query: ["water", "flood", "underpass", "canal"] })', tool: { name: 'GrepSearch', input: 'query: ["water", "flood", "underpass", "canal"]', output: 'Found 13 matches in Gulberg Social Feed' }, state: 'RUNNING' },
            { id: 4, timestamp: '10:02:40', agent: 'Signal Detection Agent', level: 'success', type: 'SIGNAL_MATCH', message: '📝 Tool returned 13 social signals. Flood-related Roman Urdu keywords detected in Gulberg sector.', state: 'SUCCESS' },
            { id: 5, timestamp: '10:03:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_TRANSITION', message: '🔀 Signal normalized. Orchestrator transitioning control to Weather Correlation Agent.', state: 'SUCCESS' },
            { id: 6, timestamp: '10:03:15', agent: 'Weather Correlation Agent', level: 'info', type: 'SENSOR_INQUIRY', message: '🌧️ Retrieving PMD precipitation readings & WASA drain telemetry...', state: 'RUNNING' },
            { id: 7, timestamp: '10:03:30', agent: 'Weather Correlation Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: ReadSensorData({ sensor_id: "LHR-PMD-04" })', tool: { name: 'ReadSensorData', input: 'sensor_id: "LHR-PMD-04" (Gulberg Station)', output: 'Precipitation: 94mm, Drain Capacity: 55%' }, state: 'RUNNING' },
            { id: 8, timestamp: '10:03:45', agent: 'Weather Correlation Agent', level: 'critical', type: 'THRESHOLD_BREACH', message: '🚨 Heavy rainfall confirmed. PMD reports 94mm cloudburst. WASA drainage absorption threshold exceeded.', state: 'CRITICAL' },
            { id: 9, timestamp: '10:04:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_TRANSITION', message: '🔀 Severity verified. Orchestrator transitioning control to Traffic Analysis Agent.', state: 'SUCCESS' },
            { id: 10, timestamp: '10:04:15', agent: 'Traffic Analysis Agent', level: 'info', type: 'CONGESTION_SCAN', message: '🚗 Scanning Lahore Traffic Engineering Bureau sensor nodes...', state: 'RUNNING' },
            { id: 11, timestamp: '10:04:30', agent: 'Traffic Analysis Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: FetchCongestionMetrics({ sector: "Gulberg / Liberty" })', tool: { name: 'FetchCongestionMetrics', input: 'sector: "Gulberg / Liberty"', output: 'Congestion Index: 0.94, Avg Speed: 3km/h, Stalled Vehicles: 12' }, state: 'RUNNING' },
            { id: 12, timestamp: '10:04:45', agent: 'Traffic Analysis Agent', level: 'critical', type: 'ANOMALY_CONFIRM', message: '🚨 Congestion spike detected near Mall Road & Liberty Underpass. Gridlock active. 12 vehicles stalled in water.', state: 'CRITICAL' },
            { id: 13, timestamp: '10:05:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_TRANSITION', message: '🔀 Crisis parameters verified. Orchestrator transitioning control to Response Planning Agent.', state: 'SUCCESS' },
            { id: 14, timestamp: '10:05:15', agent: 'Response Planning Agent', level: 'info', type: 'ROUTE_GENERATION', message: '🔀 Generating alternate bypass paths and signal priority vectors...', state: 'RUNNING' },
            { id: 15, timestamp: '10:05:30', agent: 'Response Planning Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: GenerateAlternateRoutes({ origin: "Gulberg", destination: "Jail Road" })', tool: { name: 'GenerateAlternateRoutes', input: 'origin: "Gulberg", destination: "Jail Road"', output: 'Bypass: Jail Road → Kalma Chowk, Travel Time: 12m' }, state: 'RUNNING' },
            { id: 16, timestamp: '10:05:45', agent: 'Response Planning Agent', level: 'success', type: 'ROUTE_CONFIRM', message: '✅ Alternate routing generated: Redirect Jail Road bypass to Kalma Chowk. Projections estimate 56% congestion drop.', state: 'SUCCESS' },
            { id: 17, timestamp: '10:06:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_TRANSITION', message: '🔀 Route finalized. Orchestrator transitioning control to Emergency Dispatch Agent.', state: 'SUCCESS' },
            { id: 18, timestamp: '10:06:15', agent: 'Emergency Dispatch Agent', level: 'info', type: 'DISPATCH_COORDINATION', message: '📢 Establishing emergency sockets with public response agencies...', state: 'RUNNING' },
            { id: 19, timestamp: '10:06:30', agent: 'Emergency Dispatch Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: SendDispatchNotification({ agencies: ["WASA", "Rescue 1122"], urgency: "P1" })', tool: { name: 'SendDispatchNotification', input: 'agencies: ["WASA", "Rescue 1122"], urgency: "P1"', output: 'WASA Pump Units: 4, Ambulances: 3, Status: Dispatched' }, state: 'RUNNING' },
            { id: 20, timestamp: '10:06:45', agent: 'Emergency Dispatch Agent', level: 'success', type: 'DISPATCH_COMPLETE', message: '🚨 WASA and Rescue 1122 notified. 4 WASA pumps & 3 ambulances deployed on-site.', state: 'SUCCESS' },
            { id: 21, timestamp: '10:07:00', agent: 'ORCHESTRATOR', level: 'success', type: 'WORKFLOW_COMPLETE', message: '✅ Swarm orchestration concluded successfully. 5 agents executed 5 tools. Lahore Crisis state managed.', state: 'SUCCESS' }
        ],
        SMOG: [
            { id: 1, timestamp: '07:00:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_START', message: '🚀 Antigravity Orchestrator initialized for SMOG_EMERGENCY in Lahore.', state: 'SUCCESS' },
            { id: 2, timestamp: '07:00:10', agent: 'Signal Detection Agent', level: 'info', type: 'SIGNAL_NORMALIZATION', message: '🔍 Initializing social complaint and environmental sensor scan...', state: 'RUNNING' },
            { id: 3, timestamp: '07:00:25', agent: 'Signal Detection Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: GrepSearch({ query: ["smog", "visibility", "breathing", "cough"] })', tool: { name: 'GrepSearch', input: 'query: ["smog", "visibility", "breathing", "cough"]', output: 'Found 12 matches in DHA Social Feed' }, state: 'RUNNING' },
            { id: 4, timestamp: '07:00:40', agent: 'Signal Detection Agent', level: 'success', type: 'SIGNAL_MATCH', message: '📝 Tool returned 12 social reports. Smog-related health complaints and low visibility confirmed in DHA sector.', state: 'SUCCESS' },
            { id: 5, timestamp: '07:01:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_TRANSITION', message: '🔀 Signal verified. Orchestrator transitioning control to Weather Correlation Agent.', state: 'SUCCESS' },
            { id: 6, timestamp: '07:01:15', agent: 'Weather Correlation Agent', level: 'info', type: 'SENSOR_INQUIRY', message: '🌫️ Retrieving environmental particulate indexes & MET visibility arrays...', state: 'RUNNING' },
            { id: 7, timestamp: '07:01:30', agent: 'Weather Correlation Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: ReadSensorData({ sensor_id: "LHR-EPA-DHA" })', tool: { name: 'ReadSensorData', input: 'sensor_id: "LHR-EPA-DHA" (DHA Phase 4)', output: 'AQI: 387, PM2.5: 312ug, Visibility: 0.3km' }, state: 'RUNNING' },
            { id: 8, timestamp: '07:01:45', agent: 'Weather Correlation Agent', level: 'critical', type: 'THRESHOLD_BREACH', message: '🚨 Heavy smog confirmed. AQI 387 (HAZARDOUS). PM2.5 is 20x WHO safe limit.', state: 'CRITICAL' },
            { id: 9, timestamp: '07:02:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_TRANSITION', message: '🔀 Environmental hazard verified. Orchestrator transitioning control to Traffic Analysis Agent.', state: 'SUCCESS' },
            { id: 10, timestamp: '07:02:15', agent: 'Traffic Analysis Agent', level: 'info', type: 'CONGESTION_SCAN', message: '🚗 Scanning Ferozpur Road & DHA Main Blvd speed telemetry...', state: 'RUNNING' },
            { id: 11, timestamp: '07:02:30', agent: 'Traffic Analysis Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: FetchCongestionMetrics({ sector: "Ferozpur / Cantt" })', tool: { name: 'FetchCongestionMetrics', input: 'sector: "Ferozpur / Cantt"', output: 'Congestion Index: 0.84, Avg Speed: 12km/h, Collisions: 1' }, state: 'RUNNING' },
            { id: 12, timestamp: '07:02:45', agent: 'Traffic Analysis Agent', level: 'critical', type: 'ANOMALY_CONFIRM', message: '🚨 Multi-vehicle collision pile-up detected near toll plaza due to zero visibility (0.3km). Ferozpur road partially blocked.', state: 'CRITICAL' },
            { id: 13, timestamp: '07:03:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_TRANSITION', message: '🔀 Crisis parameters verified. Orchestrator transitioning control to Response Planning Agent.', state: 'SUCCESS' },
            { id: 14, timestamp: '07:03:15', agent: 'Response Planning Agent', level: 'info', type: 'ROUTE_GENERATION', message: '🔀 Generating smart diversion corridors and speed lock protocols...', state: 'RUNNING' },
            { id: 15, timestamp: '07:03:30', agent: 'Response Planning Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: GenerateAlternateRoutes({ target_sector: "DHA Corridor" })', tool: { name: 'GenerateAlternateRoutes', input: 'target_sector: "DHA Corridor"', output: 'Diverted Route: Ring Road bypass, Speed lock: 30km/h max' }, state: 'RUNNING' },
            { id: 16, timestamp: '07:03:45', agent: 'Response Planning Agent', level: 'success', type: 'ROUTE_CONFIRM', message: '✅ Alternate routing and restrictions activated. Diverted traffic to Ring Road. Speed advisories (max 30 km/h) active.', state: 'SUCCESS' },
            { id: 17, timestamp: '07:04:00', agent: 'ORCHESTRATOR', level: 'info', type: 'WORKFLOW_TRANSITION', message: '🔀 Directives confirmed. Orchestrator transitioning control to Emergency Dispatch Agent.', state: 'SUCCESS' },
            { id: 18, timestamp: '07:04:15', agent: 'Emergency Dispatch Agent', level: 'info', type: 'DISPATCH_COORDINATION', message: '📢 Coordinating with EPA response crew and medical command units...', state: 'RUNNING' },
            { id: 19, timestamp: '07:04:30', agent: 'Emergency Dispatch Agent', level: 'system', type: 'TOOL_INVOKE', message: '⚙️ Invoking Tool: SendDispatchNotification({ agencies: ["Rescue 1122", "EPA_Scrubbers"], urgency: "P1" })', tool: { name: 'SendDispatchNotification', input: 'agencies: ["Rescue 1122", "EPA_Scrubbers"], urgency: "P1"', output: 'EPA Air Scrubbers: 2, Rescue units: 2, Status: Deployed' }, state: 'RUNNING' },
            { id: 20, timestamp: '07:04:45', agent: 'Emergency Dispatch Agent', level: 'success', type: 'DISPATCH_COMPLETE', message: '🚨 EPA and Rescue 1122 notified. 2 EPA Air scrubber trucks & Rescue teams dispatched on-site.', state: 'SUCCESS' },
            { id: 21, timestamp: '07:05:00', agent: 'ORCHESTRATOR', level: 'success', type: 'WORKFLOW_COMPLETE', message: '✅ Swarm orchestration concluded successfully. 5 agents executed 5 tools. Lahore air emergency state controlled.', state: 'SUCCESS' }
        ]
    };

    const [logs, setLogs] = useState(ALL_TRACES.FLOOD);
    const [simulationState, setSimulationState] = useState(getInitialSimulation('FLOOD'));

    const MOCK_OUTCOMES = {
        FLOOD: {
            wasa: {
                title: 'WASA Pump Dispatch Unit',
                status: 'DISPATCHED',
                units: 4,
                flowRate: '4,200 Litres/Min',
                eta: '8 mins',
                station: 'Gulberg Sewerage Command'
            },
            rescue: {
                title: 'Rescue 1122 Medical Swarm',
                status: 'EN ROUTE',
                ambulances: 3,
                paramedics: 8,
                eta: '6 mins',
                priority: 'CRITICAL (P1)'
            },
            sms: {
                title: 'Broadcast Emergency Alert',
                sender: 'PROV_ALERT',
                text: '⚠️ EMERGENCY ADVISORY: Liberty Chowk Gulberg flooded. Red diversion routes active. Avoid travel. Emergency WASA/EMS squads deployed on-site.',
                deliveryRate: '98.4%'
            },
            timeline: [
                { time: '10:02:00', title: 'Signal Normalization', desc: 'Complaints processed by detection agents' },
                { time: '10:03:15', title: 'Rain Telemetry Verified', desc: 'Gulberg sensor reports 94mm precipitation' },
                { time: '10:04:30', title: 'Gridlock Anomaly Flagged', desc: 'Average velocity drops to 3km/h' },
                { time: '10:05:45', title: 'Walton Bypass Broadcasted', desc: 'Rerouting map uploaded to nav boards' },
                { time: '10:06:45', title: 'Municipal Units Dispatched', desc: 'WASA and Rescue 1122 mobilised' }
            ]
        },
        SMOG: {
            wasa: {
                title: 'EPA Air Scrubbing Fleet',
                status: 'ACTIVE',
                units: 2,
                flowRate: '12,500 m³/hr',
                eta: '10 mins',
                station: 'Cantt EPA Depot'
            },
            rescue: {
                title: 'Rescue 1122 Smog Response',
                status: 'EN ROUTE',
                ambulances: 2,
                paramedics: 4,
                eta: '9 mins',
                priority: 'HIGH (P2)'
            },
            sms: {
                title: 'Asthma Advisory Broadcast',
                sender: 'EPA_ALERT',
                text: '⚠️ SMOG HAZARD: AQI 387. Ferozpur Road collision. Speed limit restricted to 30km/h max. Use N95 masks. High risk groups remain indoors.',
                deliveryRate: '97.8%'
            },
            timeline: [
                { time: '07:00:10', title: 'Complaints Ingested', desc: 'Social feeds flagged extreme DHA smog' },
                { time: '07:01:30', title: 'AQI Level Verified', desc: 'DHA EPA station reports 387 hazardous PM2.5' },
                { time: '07:02:30', title: 'Toll Plaza Collision Flagged', desc: 'Visibility drops below 300m, gridlock active' },
                { time: '07:03:45', title: 'Speed Advisories Active', desc: '30km/h speed limit pushed to digital signs' },
                { time: '07:04:45', title: 'EPA Patrol Mobilised', desc: 'Scrubber trucks dispatched to DHA Main Boulevard' }
            ]
        }
    };

    const [outcomeState, setOutcomeState] = useState(MOCK_OUTCOMES.FLOOD);

    function getInitialSimulation(type) {
        if (type === 'FLOOD') {
            return {
                executed: true,
                before: { congestion: '94%', avgSpeed: '3 km/h', alertsSent: 0, vehiclesStranded: 12, systemStatus: 'CRISIS_UNMANAGED' },
                after: { congestion: '38%', avgSpeed: '18 km/h', alertsSent: 3, vehiclesStranded: 0, systemStatus: 'CRISIS_MANAGED' },
                summary: { congestionReduced: '56%', vehiclesCleared: 12, alertsSent: 3, ticketsGenerated: 6, actionsExecuted: 8, estimatedLivesProtected: 120 },
                actions: [
                    { type: 'ROAD_CLOSURE', status: 'EXECUTED', detail: 'Canal Road (Submerged)' },
                    { type: 'ROAD_CLOSURE', status: 'EXECUTED', detail: 'Liberty Underpass (Stranded Cars)' },
                    { type: 'ROUTE_ACTIVATE', status: 'EXECUTED', detail: 'Jail Road → Kalma Chowk Diversion' },
                    { type: 'EMERGENCY_DISPATCH', status: 'DISPATCHED', detail: '4 WASA Drainage Pump Units' },
                    { type: 'EMERGENCY_DISPATCH', status: 'DISPATCHED', detail: '3 Rescue 1122 Ambulances' },
                    { type: 'ALERT_SENT', status: 'SENT', detail: 'SMS Flood Alert to Gulberg Residents' },
                    { type: 'ALERT_SENT', status: 'SENT', detail: 'Waze/Google Maps traffic hazard marker' },
                    { type: 'SIGNAL_OVERRIDE', status: 'EXECUTED', detail: 'Gulberg Main Blvd emergency signal green extension' }
                ],
                tickets: [
                    { id: 'RC-FL001', type: 'ROAD_CLOSURE', priority: 'P1', status: 'RESOLVED' },
                    { id: 'ED-FL002', type: 'DRAINAGE_PUMP', priority: 'P1', status: 'ACTIVE' },
                    { id: 'ED-FL003', type: 'RESCUE_1122', priority: 'P1', status: 'ACTIVE' },
                    { id: 'AL-FL004', type: 'SMS_BROADCAST', priority: 'P2', status: 'SENT' },
                    { id: 'AL-FL005', type: 'NAV_ALERT', priority: 'P3', status: 'SENT' },
                    { id: 'SO-FL006', type: 'TRAFFIC_SIGNAL', priority: 'P2', status: 'ACTIVE' }
                ]
            };
        } else {
            return {
                executed: true,
                before: { congestion: '84%', avgSpeed: '12 km/h', alertsSent: 0, vehiclesStranded: 5, systemStatus: 'CRISIS_UNMANAGED' },
                after: { congestion: '45%', avgSpeed: '28 km/h', alertsSent: 4, vehiclesStranded: 1, systemStatus: 'CRISIS_MANAGED' },
                summary: { congestionReduced: '39%', vehiclesCleared: 4, alertsSent: 4, ticketsGenerated: 5, actionsExecuted: 6, estimatedLivesProtected: 450 },
                actions: [
                    { type: 'ROUTE_ACTIVATE', status: 'EXECUTED', detail: 'Reduced Speed advisory (max 30km/h) DHA Main Boulevard' },
                    { type: 'ROAD_CLOSURE', status: 'EXECUTED', detail: 'Ferozpur Toll Plaza Section (Partially Blocked by collision)' },
                    { type: 'EMERGENCY_DISPATCH', status: 'DISPATCHED', detail: 'Rescue 1122 Smog Response Units' },
                    { type: 'EMERGENCY_DISPATCH', status: 'DISPATCHED', detail: 'EPA Air Scrubbing Trucks to DHA' },
                    { type: 'ALERT_SENT', status: 'SENT', detail: 'Asthma/Health Emergency Warning Broadcast' },
                    { type: 'ALERT_SENT', status: 'SENT', detail: 'Visibility Advisory to Motorway Police' }
                ],
                tickets: [
                    { id: 'ED-SM001', type: 'RESCUE_1122', priority: 'P1', status: 'ACTIVE' },
                    { id: 'ED-SM002', type: 'AIR_SCRUBBER', priority: 'P2', status: 'ACTIVE' },
                    { id: 'AL-SM003', type: 'PUBLIC_ADVISORY', priority: 'P1', status: 'SENT' },
                    { id: 'AL-SM004', type: 'NAV_ALERT', priority: 'P2', status: 'SENT' },
                    { id: 'RC-SM005', type: 'TRAFFIC_DIV', priority: 'P2', status: 'ACTIVE' }
                ]
            };
        }
    }

    const runSimulatedAnalysis = async (text, customToggles) => {
        if (activeIntervalRef.current) {
            clearInterval(activeIntervalRef.current);
            activeIntervalRef.current = null;
        }
        setLoading(true);
        setCustomSignal(text);
        setToggles(customToggles);
        setApiError(null);

        // Determine matching fallback scenario
        const lowercaseText = text.toLowerCase();
        const matchesSmog = 
            lowercaseText.includes('smog') || 
            lowercaseText.includes('visibility') || 
            lowercaseText.includes('aqi') || 
            lowercaseText.includes('accident') || 
            lowercaseText.includes('dha') || 
            lowercaseText.includes('ferozpur') ||
            customToggles.smokeDetected;

        const matchedScenario = matchesSmog ? 'SMOG' : 'FLOOD';
        const fallbackTraces = ALL_TRACES[matchedScenario];

        try {
            console.log("[CIRO API] Ingesting signal to FastAPI...");
            const ingestRes = await ingestSignals({
                signal: text || 'Manual generic alert signal.',
                floodRisk: customToggles.floodRisk,
                smokeDetected: customToggles.smokeDetected,
                powerOutage: customToggles.powerOutage
            });

            let backendScenario = ingestRes.data?.matched_scenario || matchedScenario;
            if (backendScenario !== 'FLOOD' && backendScenario !== 'SMOG') {
                backendScenario = 'FLOOD';
            }
            
            const [logsRes, simRes, outcomeRes] = await Promise.all([
                getLogs().catch(e => { console.warn("getLogs API failed:", e); return null; }),
                getSimulation().catch(e => { console.warn("getSimulation API failed:", e); return null; }),
                getOutcomeState().catch(e => { console.warn("getOutcomeState API failed:", e); return null; })
            ]);

            const remoteLogs = logsRes?.data?.logs || fallbackTraces;
            
            // Stream the traces fetched from the backend live!
            setLogs([]);
            let index = 0;
            activeIntervalRef.current = setInterval(() => {
                if (index < remoteLogs.length) {
                    setLogs(prev => [...prev, remoteLogs[index]]);
                    index++;
                } else {
                    if (activeIntervalRef.current) {
                        clearInterval(activeIntervalRef.current);
                        activeIntervalRef.current = null;
                    }
                    setScenario(backendScenario);
                    
                    const remoteOutcome = outcomeRes?.data;
                    if (remoteOutcome && remoteOutcome.wasa && remoteOutcome.rescue && remoteOutcome.sms) {
                        setOutcomeState(remoteOutcome);
                    } else {
                        setOutcomeState(MOCK_OUTCOMES[backendScenario]);
                    }
                    
                    if (simRes?.data) {
                        setSimulationState(simRes.data);
                    } else {
                        setSimulationState(getInitialSimulation(backendScenario));
                    }
                    setLoading(false);
                }
            }, 180);

        } catch (error) {
            console.warn("[CIRO API WARNING] FastAPI is offline. Gracefully falling back to local JSON engine.", error.message);
            setApiError("FastAPI Backend Offline. Running simulated fallback engine.");

            // Beautiful Fallback Stream
            setLogs([]);
            let index = 0;
            activeIntervalRef.current = setInterval(() => {
                if (index < fallbackTraces.length) {
                    setLogs(prev => [...prev, fallbackTraces[index]]);
                    index++;
                } else {
                    if (activeIntervalRef.current) {
                        clearInterval(activeIntervalRef.current);
                        activeIntervalRef.current = null;
                    }
                    setScenario(matchedScenario);
                    setOutcomeState(MOCK_OUTCOMES[matchedScenario]);
                    setSimulationState(getInitialSimulation(matchedScenario));
                    setLoading(false);
                }
            }, 180);
        }
    };

    useEffect(() => {
        return () => {
            if (activeIntervalRef.current) {
                clearInterval(activeIntervalRef.current);
            }
        };
    }, []);

    const getIngestPayload = () => scenario === 'FLOOD' ? floodPayload : smogPayload;
    const getSocialSignals = () => scenario === 'FLOOD' ? floodSocial : smogSocial;
    const getTrafficData = () => scenario === 'FLOOD' ? floodTraffic : smogTraffic;
    const getWeatherData = () => scenario === 'FLOOD' ? floodWeather : smogWeather;

    return (
        <CrisisContext.Provider value={{
            scenario,
            setScenario,
            loading,
            customSignal,
            toggles,
            logs,
            simulationState,
            outcomeState,
            apiError,
            getIngestPayload,
            getSocialSignals,
            getTrafficData,
            getWeatherData,
            runSimulatedAnalysis
        }}>
            {children}
        </CrisisContext.Provider>
    );
};

export const useCrisis = () => useContext(CrisisContext);
