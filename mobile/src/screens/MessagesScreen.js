import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { messagesApi } from '../api/resources.js';
import { colors, spacing, type, radius } from '../theme.js';

export default function MessagesScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);

  useFocusEffect(
    useCallback(() => {
      messagesApi.conversations().then(setConversations).catch(() => {});
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={type.header}>Messages</Text>
      <FlatList
        data={conversations}
        keyExtractor={(c) => String(c.other_user_id)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('Thread', { userId: item.other_user_id, displayName: item.display_name })}
          >
            <Text style={type.body}>{item.display_name}</Text>
            {!item.viewed_at && <View style={styles.dot} />}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={[type.caption, styles.empty]}>No messages yet — send a friend a photo.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, padding: spacing.lg, paddingTop: 60 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.pink },
  empty: { marginTop: spacing.xl, textAlign: 'center' },
});
