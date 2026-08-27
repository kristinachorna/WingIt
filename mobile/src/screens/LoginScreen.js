import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { colors, spacing, type, shared } from '../theme.js';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  async function handleLogin() {
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>🦋 WingIt</Text>
      <Text style={styles.title}>Welcome back</Text>
      <TextInput
        style={shared.input}
        placeholder="Email"
        placeholderTextColor={colors.inkSoft}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={shared.input}
        placeholder="Password"
        placeholderTextColor={colors.inkSoft}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={shared.primaryButton} onPress={handleLogin}>
        <Text style={shared.primaryButtonText}>Log in</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Need an account? Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  brand: { fontSize: 22, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: spacing.md },
  title: { ...type.title, marginBottom: spacing.lg, textAlign: 'center' },
  link: { color: colors.purple, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
});
