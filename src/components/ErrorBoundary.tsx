// src/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';

export class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 20, marginBottom: 16 }}>
                        Qualcosa è andato storto 😕
                    </Text>
                    <Button
                        title="Ricarica"
                        onPress={() => this.setState({ hasError: false })}
                    />
                </View>
            );
        }
        return this.props.children;
    }
}