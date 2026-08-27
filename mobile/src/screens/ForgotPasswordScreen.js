import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { authApi } from '../api/resources.js';
import { colors, spacing, type, shared } from '../theme.js';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSending(true);
    try {
      const response = await authApi.forgotPassword(email);
      // response.dev_token only exists because there's no email service yet —
      // see the backend comment in authController.js. In production the user
      // would get an email instead and this screen would just show a confirmation.
      navigation.navigate('ResetPassword', { email, devToken: response.dev_token });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.hint}>Enter your account email and we'll help you reset it.</Text>
      <TextInput
        style={shared.input}
        placeholder="Email"
        placeholderTextColor={colors.inkSoft}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={shared.primaryButton} onPress={handleSubmit} disabled={sending}>
        <Text style={shared.primaryButtonText}>{sending ? 'Sending…' : 'Continue'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  title: { ...type.title, marginBottom: spacing.sm, textAlign: 'center' },
  hint: { ...type.caption, textAlign: 'center', marginBottom: spacing.lg },
  link: { color: colors.purple, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
});
