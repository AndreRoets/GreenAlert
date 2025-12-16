import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { saveToStorage, loadFromStorage } from '../services/storage';

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.title}>Just a little more about you...</Text>
      <Text style={styles.subtitle}>Enter your name to personalize your experience.</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name"
        autoCapitalize="words"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        autoCapitalize="words"
        value={lastName}
        onChangeText={setLastName}
      />

      <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
        <Text style={styles.buttonText}>Save Profile</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#FFF',
  },
  button: {
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
