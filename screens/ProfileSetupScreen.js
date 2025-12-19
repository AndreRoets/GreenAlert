import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { saveToStorage, loadFromStorage } from '../services/storage';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';

export default function ProfileSetupScreen({ route, navigation }) {
  const { userId, email } = route.params; // Get user info passed from SignUpScreen
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSaveProfile = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please enter both your first and last name.');
      return;
    }

    try {
      // Save the user's profile information
      await saveToStorage('currentUser', {
        userId,
        email,
        firstName,
        lastName,
      });

      // Load the session to get the selected currency
      const session = await loadFromStorage('userSession');

      // Now that the profile is saved, proceed to the onboarding flow
      navigation.replace('Onboarding', { isGuest: false, currency: session.currency });
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.headerContainer}>
        <AppText style={styles.title}>Just a little more about you...</AppText>
        <AppText style={styles.subtitle}>Enter your name to personalize your experience.</AppText>
      </View>

      <View style={styles.inputContainer}>
        <AppInput
          placeholder="First Name"
          autoCapitalize="words"
          value={firstName}
          onChangeText={setFirstName}
        />
        <AppInput
          placeholder="Last Name"
          autoCapitalize="words"
          value={lastName}
          onChangeText={setLastName}
          style={{ marginTop: SIZES.base * 2 }}
        />
      </View>

      <AppButton title="Save Profile" onPress={handleSaveProfile} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  headerContainer: { alignItems: 'center', marginBottom: SIZES.padding * 2 },
  title: { ...FONTS.h2, textAlign: 'center', marginBottom: SIZES.base },
  subtitle: { ...FONTS.body3, textAlign: 'center' },
  inputContainer: { width: '100%', marginBottom: SIZES.padding },
});
