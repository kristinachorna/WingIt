import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { colors, spacing, type, radius } from '../theme.js';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarEmoji}>🦋</Text>
      </View>
      <Text style={type.title}>{user?.display_name}</Text>
      <Text style={[type.caption, styles.username]}>@{user?.username}</Text>

      <Text style={styles.disclaimer}>
        Photos you send disappear after being viewed, but the recipient may still capture
        the screen with another device or their phone's built-in tools. Treat sent photos
        as private, not unrecoverable.
      </Text>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg, paddingTop: 80 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarEmoji: { fontSize: 32 },
  username: { marginBottom: spacing.lg },
  disclaimer: { color: colors.inkSoft, fontSize: 13, lineHeight: 18, marginBottom: spacing.xl },
  logoutButton: { backgroundColor: 'rgba(255,92,122,0.15)', padding: 14, borderRadius: radius.pill },
  logoutText: { color: colors.danger, textAlign: 'center', fontWeight: '700' },
});
