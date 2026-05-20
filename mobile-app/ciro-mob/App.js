import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { CrisisProvider } from './src/context/CrisisContext';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" />
          <Text style={styles.emoji}>🚨</Text>
          <Text style={styles.title}>System Intercepted an Anomaly</Text>
          <Text style={styles.subtitle}>
            An unexpected client exception has been isolated. You can reload the swarm interface below.
          </Text>
          {this.state.error && (
            <Text style={styles.errorMessage}>
              {this.state.error.toString()}
            </Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>🔄 Reload Swarm Interface</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <CrisisProvider>
        <AppNavigator />
      </CrisisProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030508',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF2D55',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  errorMessage: {
    fontSize: 11,
    color: '#FF453A',
    backgroundColor: '#FF453A15',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    width: '100%',
    marginBottom: 24,
    textAlign: 'center',
    borderWidth: 0.5,
    borderColor: '#FF453A33',
  },
  button: {
    backgroundColor: '#1D9E75',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
