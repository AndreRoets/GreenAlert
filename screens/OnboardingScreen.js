import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveToStorage } from '../services/storage';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';

const defaultDisposableCategories = [
  'Food & Drinks',
  'Transport',
  'Personal & Lifestyle',
  'Social & Gifts',
  'Miscellaneous',
];

export default function OnboardingScreen({ navigation, route }) {
  // ✅ SAFE PARAM HANDLING (fixes the crash)
  const { isGuest = false, currency = 'ZAR' } = route?.params || {};

  const handleChoice = async (choice) => {
    try {
      await saveToStorage('userBudgetPreference', choice);

      if (choice === 'disposable') {
        // Disposable income → skip category setup
        navigation.navigate('DisposableSetup', {
          activeCategories: defaultDisposableCategories,
          isGuest,
          currency,
        });
      } else {
        // Entire budget → user selects categories
        navigation.navigate('CategorySetup', {
          budgetPreference: choice,
          isGuest,
          currency,
        });
      }
    } catch (error) {
      console.error('Failed to save budget preference:', error);
    }
  };

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
      <AppText style={styles.header}>Welcome to GreenAlert</AppText>
      <AppText style={styles.subHeader}>
        Brutally honest, but motivating.
      </AppText>
      <AppText style={styles.body}>
        Let’s get real about your spending. How do you want to track your budget?
      </AppText>

      <View style={styles.buttonContainer}>
        <AppButton
          title="Track Entire Budget"
          onPress={() => handleChoice('entire')}
          variant="secondary"
        />

        <AppButton
          title="Track Disposable Income Only"
          onPress={() => handleChoice('disposable')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  header: {
    ...FONTS.h2,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  subHeader: {
    ...FONTS.h4,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  body: {
    ...FONTS.body3,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  buttonContainer: {
    width: '100%',
  },
});
