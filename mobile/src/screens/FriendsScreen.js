import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { friendsApi } from '../api/resources.js';
import { colors, spacing, type, radius, shared, stageEmoji } from '../theme.js';

export default function FriendsScreen() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const load = useCallback(() => {
    friendsApi.list().then(setFriends).catch(() => {});
    friendsApi.requests().then(setRequests).catch(() => {});
  }, []);

  useFocusEffect(load);

  async function search(text) {
    setQuery(text);
    if (text.trim().length < 2) return setResults([]);
    setResults(await friendsApi.search(text));
  }

  async function addFriend(username) {
    await friendsApi.sendRequest(username);
    setQuery('');
    setResults([]);
  }

  async function respond(id, action) {
    await friendsApi.respond(id, action);
    load();
  }

  return (
    <View style={styles.container}>
      <Text style={type.header}>Friends</Text>

      <TextInput
        style={[shared.input, { marginTop: spacing.md }]}
        placeholder="Search by username"
        placeholderTextColor={colors.inkSoft}
        value={query}
        onChangeText={search}
        autoCapitalize="none"
      />
      {results.map((u) => (
        <Pressable key={u.id} style={styles.row} onPress={() => addFriend(u.username)}>
          <Text style={type.body}>{u.display_name} <Text style={type.caption}>@{u.username}</Text></Text>
          <Text style={styles.action}>Add</Text>
        </Pressable>
      ))}

      {requests.length > 0 && (
        <>
          <Text style={[type.subheader, styles.subheader]}>Requests</Text>
          {requests.map((r) => (
            <View key={r.id} style={styles.row}>
              <Text style={type.body}>{r.display_name} <Text style={type.caption}>@{r.username}</Text></Text>
              <View style={styles.requestActions}>
                <Pressable onPress={() => respond(r.id, 'accept')}><Text style={styles.action}>Accept</Text></Pressable>
                <Pressable onPress={() => respond(r.id, 'decline')}><Text style={styles.decline}>Decline</Text></Pressable>
              </View>
            </View>
          ))}
        </>
      )}

      <Text style={[type.subheader, styles.subheader]}>Your friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(f) => String(f.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={type.body}>
              {item.display_name} <Text style={styles.stageEmoji}>{stageEmoji[item.stage]}</Text>
            </Text>
            {item.has_unread && <View style={styles.dot} />}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg, paddingTop: 60 },
  subheader: { marginTop: spacing.md, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  action: { color: colors.purple, fontWeight: '700' },
  decline: { color: colors.danger, marginLeft: spacing.md, fontWeight: '700' },
  requestActions: { flexDirection: 'row' },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.pink },
  stageEmoji: { fontSize: 14 },
});
