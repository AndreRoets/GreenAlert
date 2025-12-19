import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { saveToStorage } from '../services/storage'; // Assuming this service exists
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';

const defaultDisposableCategories = [
  'Food & Drinks', 'Transport', 'Personal & Lifestyle', 'Social & Gifts', 'Miscellaneous'
];

export default function OnboardingScreen({ navigation, route }) {
  const { isGuest, currency } = route.params;
  const handleChoice = async (choice) => {
    await saveToStorage('userBudgetPreference', choice);

    if (choice === 'disposable') {
      // For disposable income, go directly to setting the amount. Categories are handled later.
      navigation.navigate('DisposableSetup', { activeCategories: defaultDisposableCategories, isGuest, currency });
    } else {
      // For the entire budget, the user needs to select categories.
      navigation.navigate('CategorySetup', { budgetPreference: choice, isGuest, currency });
    }
  };

  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppText style={styles.header}>Welcome to GreenAlert</AppText>
      <AppText style={styles.subHeader}>Brutally honest, but motivating.</AppText>
      <AppText style={styles.body}>Let’s get real about your spending. How do you want to track your budget?</AppText>

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
  header: { ...FONTS.h2, textAlign: 'center', marginBottom: SIZES.base },
  subHeader: {
    ...FONTS.h4,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  body: { ...FONTS.body3, textAlign: 'center', marginBottom: SIZES.padding * 2 },
  buttonContainer: { width: '100%' },
});