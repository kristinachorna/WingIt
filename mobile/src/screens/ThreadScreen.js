import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { messagesApi } from '../api/resources.js';
import { useAuth } from '../context/AuthContext.js';
import { colors, spacing, type, radius } from '../theme.js';

export default function ThreadScreen({ route }) {
  const { userId, displayName } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [viewing, setViewing] = useState(null); // { messageId, url, secondsLeft, caption, paths }
  const timerRef = useRef(null);

  const load = useCallback(() => {
    messagesApi.thread(userId).then(setMessages).catch(() => {});
  }, [userId]);

  useFocusEffect(load);
  useEffect(() => () => clearInterval(timerRef.current), []);

  async function openPhoto(message) {
    if (message.expired) return;
    const { read_token, view_duration_seconds } = await messagesApi.open(message.id);
    const url = messagesApi.photoUrl(message.id, read_token);
    let paths = [];
    try {
      paths = message.drawing_data ? JSON.parse(message.drawing_data) : [];
    } catch {
      paths = [];
    }

    setViewing({ messageId: message.id, url, secondsLeft: view_duration_seconds, caption: message.caption, paths });
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setViewing((v) => {
        if (!v || v.secondsLeft <= 1) {
          clearInterval(timerRef.current);
          load();
          return null;
        }
        return { ...v, secondsLeft: v.secondsLeft - 1 };
      });
    }, 1000);
  }

  if (viewing) {
    return (
      <View style={styles.viewerContainer}>
        <View style={styles.viewerImageWrapper}>
          <Image source={{ uri: viewing.url }} style={styles.viewerImage} />
          <Svg style={StyleSheet.absoluteFill}>
            {viewing.paths.map((d, i) => (
              <Path key={i} d={d} stroke={colors.coral} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </Svg>
          {viewing.caption ? (
            <View style={styles.captionOverlay} pointerEvents="none">
              <Text style={styles.captionOverlayText}>{viewing.caption}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.timerPill}>
          <Text style={styles.timer}>{viewing.secondsLeft}s</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={type.header}>{displayName}</Text>
      <FlatList
        data={messages}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => {
          const isMine = item.sender_id === user.id;
          const status = item.expired ? 'Expired' : item.viewed_at ? 'Opened' : isMine ? 'Sent' : 'Tap to open';
          return (
            <Pressable
              style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}
              onPress={() => !isMine && openPhoto(item)}
              disabled={isMine || item.expired}
            >
              <Text style={isMine ? styles.statusMine : styles.statusTheirs}>{status}</Text>
              {item.caption && !item.expired ? (
                <Text style={isMine ? styles.captionMine : styles.captionTheirs} numberOfLines={1}>
                  "{item.caption}"
                </Text>
              ) : null}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg, paddingTop: 60 },
  bubble: { padding: 14, borderRadius: radius.md, marginBottom: spacing.sm, maxWidth: '70%' },
  bubbleMine: { backgroundColor: colors.purple, alignSelf: 'flex-end' },
  bubbleTheirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
  statusMine: { color: '#fff', fontWeight: '600' },
  statusTheirs: { color: colors.ink, fontWeight: '600' },
  captionMine: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  captionTheirs: { color: colors.inkSoft, fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  viewerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  viewerImageWrapper: { width: '100%', height: '80%' },
  viewerImage: { width: '100%', height: '100%' },
  captionOverlay: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center', paddingHorizontal: spacing.lg },
  captionOverlayText: {
    color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm,
  },
  timerPill: { marginTop: spacing.md, backgroundColor: colors.coral, paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.pill },
  timer: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
