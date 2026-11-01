// src/components/AiComingSoonButton.tsx - Segnala dove arriverà l'AI e spiega cosa farà
import { Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AI_FEATURES, AiFeatureKey } from '../config/aiFeatures';
import {
  mechanicButton,
  mechanicButtonText,
  mechanicSpacing,
  useMechanicTheme,
} from '../screens/mechanic/mechanicTheme';
import { showAlert } from '../utils/platformHelpers';

interface AiComingSoonButtonProps {
  feature: AiFeatureKey;
  style?: StyleProp<ViewStyle>;
}

export const AiComingSoonButton: React.FC<AiComingSoonButtonProps> = ({ feature, style }) => {
  const theme = useMechanicTheme();
  const [isHovered, setIsHovered] = useState(false);
  const { label, title, description } = AI_FEATURES[feature];

  const explain = () =>
    showAlert(title, `${description}\n\nLa funzione non è ancora attiva: per ora puoi inserire i dati a mano.`, [
      { text: 'Ho capito' },
    ]);

  return (
    <View style={[styles.container, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Funzione in arrivo: mostra cosa farà"
        onPress={explain}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={({ pressed }) => [
          mechanicButton.secondary,
          {
            borderColor: theme.primary,
            backgroundColor: pressed || isHovered ? theme.primaryLight : 'transparent',
          },
        ]}
      >
        <Sparkles size={18} color={theme.primary} />
        <Text style={[mechanicButtonText.compact, { color: theme.primary }]}>{label}</Text>
      </Pressable>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>In arrivo: tocca per sapere di più.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: mechanicSpacing.xs,
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
  },
});

export default AiComingSoonButton;
