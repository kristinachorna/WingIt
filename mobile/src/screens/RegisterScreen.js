import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { colors, spacing, type, shared } from '../theme.js';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
  const [error, setError] = useState(null);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleRegister() {
    setError(null);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>🦋 WingIt</Text>
      <Text style={styles.title}>Create your account</Text>
      <TextInput style={shared.input} placeholder="Username" placeholderTextColor={colors.inkSoft} autoCapitalize="none" onChangeText={(v) => set('username', v)} />
      <TextInput style={shared.input} placeholder="Display name" placeholderTextColor={colors.inkSoft} onChangeText={(v) => set('display_name', v)} />
      <TextInput style={shared.input} placeholder="Email" placeholderTextColor={colors.inkSoft} autoCapitalize="none" keyboardType="email-address" onChangeText={(v) => set('email', v)} />
      <TextInput style={shared.input} placeholder="Password" placeholderTextColor={colors.inkSoft} secureTextEntry onChangeText={(v) => set('password', v)} />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={shared.primaryButton} onPress={handleRegister}>
        <Text style={shared.primaryButtonText}>Register</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
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
