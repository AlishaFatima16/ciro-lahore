import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DashboardScreen  from '../screens/DashboardScreen';
import MapScreen        from '../screens/MapScreen';
import LogsScreen       from '../screens/LogsScreen';
import SimulationScreen from '../screens/SimulationScreen';

const Tab = createBottomTabNavigator();

// ── Tab icon component (pure RN — no icon lib needed) ─────
function TabIcon({ label, focused }) {
    const icons = {
        Dashboard:  focused ? '🏠' : '⌂',
        Map:        focused ? '🗺️' : '🗺',
        Logs:       focused ? '📋' : '📄',
        Simulation: focused ? '⚡' : '◎',
    };
    return (
        <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>{icons[label] || '●'}</Text>
            {focused && <View style={styles.activeDot} />}
        </View>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon label={route.name} focused={focused} />
                    ),
                    tabBarLabel: ({ focused, color }) => (
                        <Text style={[styles.tabLabel, { color: focused ? '#1D9E75' : '#444' }]}>
                            {route.name}
                        </Text>
                    ),
                    tabBarStyle: {
                        backgroundColor: '#0d0d0d',
                        borderTopColor: '#1a1a1a',
                        borderTopWidth: 0.5,
                        height: 70,
                        paddingBottom: 10,
                        paddingTop: 6,
                    },
                    tabBarActiveTintColor: '#1D9E75',
                    tabBarInactiveTintColor: '#444',
                })}
            >
                <Tab.Screen name="Dashboard"  component={DashboardScreen}  />
                <Tab.Screen name="Map"         component={MapScreen}         />
                <Tab.Screen name="Logs"        component={LogsScreen}        />
                <Tab.Screen name="Simulation"  component={SimulationScreen}  />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    iconWrap: { alignItems: 'center', justifyContent: 'center', width: 32, height: 28 },
    iconEmoji: { fontSize: 20 },
    activeDot: {
        position: 'absolute', bottom: -4,
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: '#1D9E75',
    },
    tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.2 },
});