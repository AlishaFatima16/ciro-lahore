import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export default function PulsingBeacon({ color = '#FF3B30', size = 10, interval = 2000 }) {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: interval,
                useNativeDriver: true,
            })
        ).start();
    }, [pulseAnim, interval]);

    const scale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2.8],
    });

    const opacity = pulseAnim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [0.6, 0.3, 0],
    });

    return (
        <View style={[styles.container, { width: size * 3, height: size * 3 }]}>
            {/* Pulsating outer ring */}
            <Animated.View
                style={[
                    styles.ring,
                    {
                        backgroundColor: color,
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        transform: [{ scale }],
                        opacity,
                    }
                ]}
            />
            {/* Solid center dot */}
            <View
                style={[
                    styles.dot,
                    {
                        backgroundColor: color,
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                    }
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ring: {
        position: 'absolute',
    },
    dot: {
        position: 'absolute',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
});
