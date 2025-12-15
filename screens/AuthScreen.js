import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { saveToStorage } from '../services/storage';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Sign Up Failed', 'Please enter both email and password.');
      return;
    }
    // In a real app, you would have more robust validation and an API call here.
    // For now, we'll simulate a successful sign-up.
    const userSession = {
      isGuest: false,
      email: email,
      // In a real app, you'd get a token from your backend
      token: `fake-token-for-${email}`,
    };
    await saveToStorage('userSession', userSession);
    navigation.replace('Onboarding');
  };

  const handleGuest = async () => {
    const userSession = { isGuest: true };
    // We don't save the guest session to storage, so it's forgotten on app close.
    navigation.replace('Onboarding', { isGuest: true });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.header}>GreenAlert</Text>
      <Text style={styles.subHeader}>Welcome!</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.guestButton]} onPress={handleGuest}>
        <Text style={[styles.buttonText, styles.guestButtonText]}>Continue as Guest</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20 },
  header: { fontSize: 48, fontWeight: 'bold', color: '#000000', marginBottom: 10 },
  subHeader: { fontSize: 24, color: '#555555', marginBottom: 50 },
  inputGroup: { width: '100%', marginBottom: 20 },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    fontSize: 18,
    paddingVertical: 15,
    marginBottom: 20,
    width: '100%',
  },
  button: { backgroundColor: '#000000', paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  guestButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000' },
  guestButtonText: { color: '#000000' },
});