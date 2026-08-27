import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Image, StyleSheet, FlatList, Alert, TextInput, PanResponder } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Path } from 'react-native-svg';
import { friendsApi, messagesApi } from '../api/resources.js';
import { colors, spacing, radius, shared } from '../theme.js';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const cameraRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sending, setSending] = useState(false);

  // --- Caption + drawing overlay state ---
  // NOTE: these are kept as separate metadata (text + vector paths) rather
  // than burned into the photo's pixels. That's simpler than compositing a
  // new image file, and displays identically when viewed — but it means a
  // recipient viewing outside this app (in theory) wouldn't see them.
  const [editMode, setEditMode] = useState(null); // null | 'caption' | 'draw'
  const [caption, setCaption] = useState('');
  const [paths, setPaths] = useState([]); // array of 'M x y L x y ...' strings
  const currentPoints = useRef([]);
  const [currentPathD, setCurrentPathD] = useState('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => editMode === 'draw',
      onMoveShouldSetPanResponder: () => editMode === 'draw',
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentPoints.current = [{ x: locationX, y: locationY }];
        setCurrentPathD(`M${locationX},${locationY}`);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentPoints.current.push({ x: locationX, y: locationY });
        setCurrentPathD((d) => `${d} L${locationX},${locationY}`);
      },
      onPanResponderRelease: () => {
        setPaths((prev) => [...prev, currentPathD]);
        setCurrentPathD('');
        currentPoints.current = [];
      },
    })
  ).current;

  useEffect(() => {
    if (photo) friendsApi.list().then(setFriends).catch(() => {});
  }, [photo]);

  function resetEdits() {
    setCaption('');
    setPaths([]);
    setCurrentPathD('');
    setEditMode(null);
  }

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>Camera access is needed to take photos.</Text>
        <Pressable style={shared.primaryButton} onPress={requestPermission}>
          <Text style={shared.primaryButtonText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  async function takePhoto() {
    const result = await cameraRef.current.takePictureAsync({ quality: 0.7 });
    setPhoto(result);
  }

  async function send() {
    if (!selectedFriend) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('recipient_id', String(selectedFriend.id));
      formData.append('photo', { uri: photo.uri, name: 'photo.jpg', type: 'image/jpeg' });
      if (caption.trim()) formData.append('caption', caption.trim());
      if (paths.length > 0) formData.append('drawing_data', JSON.stringify(paths));

      const sentFriendName = selectedFriend.display_name;
      const response = await messagesApi.send(formData);
      setPhoto(null);
      setSelectedFriend(null);
      resetEdits();

      if (response.milestone === 'butterfly') {
        Alert.alert('You give me butterflies! 🦋', `You and ${sentFriendName} have talked 3 days in a row.`);
      } else if (response.milestone === 'social_butterfly') {
        Alert.alert(`You're a social butterfly! 🦋✨`, `You and ${sentFriendName} have kept it going for 2 weeks straight.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <View style={styles.imageWrapper} {...(editMode === 'draw' ? panResponder.panHandlers : {})}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          <Svg style={StyleSheet.absoluteFill}>
            {paths.map((d, i) => (
              <Path key={i} d={d} stroke={colors.coral} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {currentPathD ? (
              <Path d={currentPathD} stroke={colors.coral} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
          </Svg>
          {caption.trim() ? (
            <View style={styles.captionOverlay} pointerEvents="none">
              <Text style={styles.captionOverlayText}>{caption}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.previewControls}>
          <Pressable style={styles.iconButton} onPress={() => { setPhoto(null); resetEdits(); }}>
            <Text style={styles.iconButtonText}>Retake</Text>
          </Pressable>
          <Pressable
            style={[styles.iconButton, editMode === 'caption' && styles.iconButtonActive]}
            onPress={() => setEditMode(editMode === 'caption' ? null : 'caption')}
          >
            <Text style={styles.iconButtonText}>Text</Text>
          </Pressable>
          <Pressable
            style={[styles.iconButton, editMode === 'draw' && styles.iconButtonActive]}
            onPress={() => setEditMode(editMode === 'draw' ? null : 'draw')}
          >
            <Text style={styles.iconButtonText}>Draw</Text>
          </Pressable>
          {paths.length > 0 && (
            <Pressable style={styles.iconButton} onPress={() => setPaths((p) => p.slice(0, -1))}>
              <Text style={styles.iconButtonText}>Undo</Text>
            </Pressable>
          )}
        </View>

        {editMode === 'caption' && (
          <View style={styles.captionInputBar}>
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption…"
              placeholderTextColor={colors.inkSoft}
              value={caption}
              onChangeText={setCaption}
              autoFocus
              maxLength={80}
            />
          </View>
        )}

        <View style={styles.friendPicker}>
          <Text style={styles.pickerHint}>Send to</Text>
          <FlatList
            horizontal
            data={friends}
            keyExtractor={(f) => String(f.id)}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.friendChip, selectedFriend?.id === item.id && styles.friendChipSelected]}
                onPress={() => setSelectedFriend(item)}
              >
                <Text style={[styles.friendChipText, selectedFriend?.id === item.id && styles.friendChipTextSelected]}>
                  {item.display_name}
                </Text>
              </Pressable>
            )}
          />
          <Pressable
            style={[shared.primaryButton, (!selectedFriend || sending) && styles.buttonDisabled, { marginTop: spacing.sm }]}
            disabled={!selectedFriend || sending}
            onPress={send}
          >
            <Text style={shared.primaryButtonText}>{sending ? 'Sending…' : 'Send'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      <View style={styles.controls}>
        <Pressable style={styles.iconButton} onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}>
          <Text style={styles.iconButtonText}>Flip</Text>
        </Pressable>
        <Pressable style={styles.shutterRing} onPress={takePhoto}>
          <View style={styles.shutter} />
        </Pressable>
        <View style={{ width: 64 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.cream },
  camera: { flex: 1 },
  imageWrapper: { flex: 1 },
  preview: { flex: 1 },
  controls: {
    position: 'absolute', bottom: 44, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg,
  },
  previewControls: {
    position: 'absolute', top: 56, left: spacing.lg, right: spacing.lg,
    flexDirection: 'row', gap: 8, flexWrap: 'wrap',
  },
  shutterRing: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: colors.coral,
    alignItems: 'center', justifyContent: 'center',
  },
  shutter: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.coral },
  iconButton: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.pill },
  iconButtonActive: { backgroundColor: colors.coral },
  iconButtonText: { color: '#fff', fontWeight: '600' },
  buttonDisabled: { opacity: 0.4 },
  hint: { color: colors.ink, marginBottom: spacing.sm, textAlign: 'center' },
  captionOverlay: { position: 'absolute', bottom: 220, left: 0, right: 0, alignItems: 'center', paddingHorizontal: spacing.lg },
  captionOverlayText: {
    color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm,
  },
  captionInputBar: { position: 'absolute', bottom: 190, left: spacing.lg, right: spacing.lg },
  captionInput: {
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', padding: 12, borderRadius: radius.md, fontSize: 16, textAlign: 'center',
  },
  friendPicker: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.cream, padding: spacing.md, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  pickerHint: { color: colors.inkSoft, marginBottom: spacing.xs, fontWeight: '600' },
  friendChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.pill, marginRight: spacing.xs },
  friendChipSelected: { backgroundColor: colors.coral, borderColor: colors.coral },
  friendChipText: { color: colors.ink, fontWeight: '600' },
  friendChipTextSelected: { color: '#fff' },
});
