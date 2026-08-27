import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { authApi } from '../api/resources.js';
import { colors, spacing, type, shared } from '../theme.js';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email, devToken } = route.params || {};
  // Pre-filling the token is a DEV-ONLY convenience since there's no email
  // service yet. In production the user would tap a link from their email
  // that deep-links here with the token already attached, not type it in.
  const [token, setToken] = useState(devToken || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Password updated</Text>
        <Text style={styles.hint}>You can now log in with your new password.</Text>
        <Pressable style={shared.primaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={shared.primaryButtonText}>Back to login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset password</Text>
      {devToken ? (
        <Text style={styles.hint}>
          Dev mode: no email service is set up yet, so the reset token has been filled in automatically. Check the backend terminal log for the same token.
        </Text>
      ) : (
        <Text style={styles.hint}>Enter the reset code from your email for {email}.</Text>
      )}
      <TextInput
        style={shared.input}
        placeholder="Reset code"
        placeholderTextColor={colors.inkSoft}
        autoCapitalize="none"
        value={token}
        onChangeText={setToken}
      />
      <TextInput
        style={shared.input}
        placeholder="New password"
        placeholderTextColor={colors.inkSoft}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={shared.primaryButton} onPress={handleSubmit}>
        <Text style={shared.primaryButtonText}>Update password</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  title: { ...type.title, marginBottom: spacing.sm, textAlign: 'center' },
  hint: { ...type.caption, textAlign: 'center', marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.sm, textAlign: 'center' },
});
