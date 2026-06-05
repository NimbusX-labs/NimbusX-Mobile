import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { ChatStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import Avatar from '@components/common/Avatar';
import { useAppSelector } from '@store/hooks';
import { firestoreService } from '@services/supabase/database';
import { storageService } from '@services/supabase/storage';
import { User } from '@types';

type GroupInfoRouteProp = RouteProp<ChatStackParamList, 'GroupInfo'>;

const MOCK_GRAPH_IMAGE = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80';
const MOCK_MEETING_IMAGE = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80';

const GroupInfoScreen = () => {
  const colors = useThemeColors();
  const route = useRoute<GroupInfoRouteProp>();
  const navigation = useNavigation<any>();
  const { chatId } = route.params;
  const chat = useAppSelector(state => state.chats.entities[chatId]);
  const currentUser = useAppSelector(state => state.auth.user);

  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isAdmin = !!(currentUser && chat?.admins?.[currentUser.uid]);

  // Load member profiles
  useEffect(() => {
    if (!chat?.members?.length) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingMembers(true);
      const profiles: User[] = [];
      for (const uid of chat.members) {
        try {
          const u = await firestoreService.getUser(uid);
          if (u && !cancelled) profiles.push(u);
        } catch { /* skip */ }
      }
      if (!cancelled) {
        setMembers(profiles);
        setLoadingMembers(false);
      }
    })();

    return () => { cancelled = true; };
  }, [chat?.members]);

  useEffect(() => {
    setNameValue(chat?.name || '');
    setDescValue(chat?.description || '');
  }, [chat?.name, chat?.description]);

  const handleSaveName = useCallback(async () => {
    if (!nameValue.trim()) return;
    setSaving(true);
    try {
      await firestoreService.updateGroupDetails(chatId, { name: nameValue.trim() });
    } catch {
      Alert.alert('Error', 'Could not update group name.');
    } finally {
      setEditingName(false);
      setSaving(false);
    }
  }, [chatId, nameValue]);

  const handleSaveDesc = useCallback(async () => {
    setSaving(true);
    try {
      await firestoreService.updateGroupDetails(chatId, { description: descValue.trim() });
    } catch {
      Alert.alert('Error', 'Could not update description.');
    } finally {
      setEditingDesc(false);
      setSaving(false);
    }
  }, [chatId, descValue]);

  const handleChangeAvatar = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 512,
        maxHeight: 512,
      });
      if (result.didCancel || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset.uri) return;

      setUploadingAvatar(true);
      const url = await storageService.uploadAvatar(chatId, asset.uri, asset.type || 'image/jpeg');
      await firestoreService.updateGroupDetails(chatId, { avatarUrl: url });
    } catch {
      Alert.alert('Error', 'Could not update group image.');
    } finally {
      setUploadingAvatar(false);
    }
  }, [chatId, isAdmin]);

  const handleRemoveMember = useCallback((uid: string, name: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${name} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.removeGroupMember(chatId, uid);
            } catch {
              Alert.alert('Error', 'Could not remove member.');
            }
          },
        },
      ]
    );
  }, [chatId]);

  const handleLeave = useCallback(() => {
    if (!currentUser) return;
    Alert.alert(
      'Exit Group',
      'Are you sure you want to leave this group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.leaveGroup(chatId, currentUser.uid);
              navigation.popToTop();
            } catch {
              Alert.alert('Error', 'Could not leave group.');
            }
          },
        },
      ]
    );
  }, [chatId, currentUser, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Group',
      'This will permanently delete the group and all messages for everyone. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteChatMediaFolder(chatId);
              await firestoreService.deleteGroup(chatId);
              navigation.popToTop();
            } catch {
              Alert.alert('Error', 'Could not delete group.');
            }
          },
        },
      ]
    );
  }, [chatId, navigation]);

  // Header Title & Options Options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Group Info',
      headerTitleStyle: {
        color: '#00E5FF',
        fontWeight: '700',
        fontSize: 18,
      },
      headerTintColor: colors.textPrimary,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
      },
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: spacing.m, padding: spacing.xs }}
          onPress={() => {
            Alert.alert('Group Options', undefined, [
              { text: 'Cancel', style: 'cancel' },
              ...(isAdmin ? [{ text: 'Delete Group', style: 'destructive' as const, onPress: handleDelete }] : []),
              { text: 'Leave Group', style: 'destructive' as const, onPress: handleLeave },
            ]);
          }}
        >
          <Icon name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isAdmin, handleDelete, handleLeave]);

  const getMemberName = (user: User) => {
    const isSelf = user.uid === currentUser?.uid;
    const name = user.displayName || user.email.split('@')[0];
    return name + (isSelf ? ' (You)' : '');
  };

  const getMemberRole = (user: User) => {
    const isGroupAdmin = !!chat?.admins?.[user.uid];
    return isGroupAdmin ? 'Admin' : 'Member';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Circular Avatar + Group Details */}
        <View style={styles.headerSection}>
          <TouchableOpacity onPress={isAdmin ? handleChangeAvatar : undefined} activeOpacity={isAdmin ? 0.75 : 1}>
            <View style={styles.avatarWrapper}>
              <Avatar uri={chat?.avatarUrl} name={chat?.name || 'Group'} size={96} />
              {isAdmin && (
                <View style={styles.cameraOverlay}>
                  {uploadingAvatar ? (
                    <ActivityIndicator size="small" color="#080E1A" />
                  ) : (
                    <Icon name="camera" size={14} color="#080E1A" />
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>

          {editingName ? (
            <View style={styles.editNameRow}>
              <TextInput
                style={styles.editNameInput}
                value={nameValue}
                onChangeText={setNameValue}
                autoFocus
                maxLength={50}
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity onPress={handleSaveName} disabled={saving} style={styles.editActionBtn}>
                <Icon name="checkmark" size={20} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingName(false); setNameValue(chat?.name || ''); }} style={styles.editActionBtn}>
                <Icon name="close" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameRow}
              onPress={isAdmin ? () => setEditingName(true) : undefined}
              activeOpacity={isAdmin ? 0.6 : 1}
            >
              <Text style={styles.groupName}>{chat?.name || 'Group'}</Text>
              {isAdmin && <Icon name="pencil-outline" size={14} color="#00E5FF" style={{ marginLeft: spacing.s }} />}
            </TouchableOpacity>
          )}

          <Text style={styles.groupMeta}>
            {chat?.members?.length || 0} Members • Created Oct 12
          </Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => setIsMuted(!isMuted)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconCircle, isMuted && styles.actionIconCircleActive]}>
              <Icon 
                name={isMuted ? 'volume-mute' : 'volume-mute-outline'} 
                size={22} 
                color={isMuted ? '#080E1A' : '#00E5FF'} 
              />
            </View>
            <Text style={styles.actionBtnText}>{isMuted ? 'Muted' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
            <View style={styles.actionIconCircle}>
              <Icon name="search-outline" size={22} color="#00E5FF" />
            </View>
            <Text style={styles.actionBtnText}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleLeave} activeOpacity={0.7}>
            <View style={styles.actionIconCircle}>
              <Icon name="log-out-outline" size={22} color="#ff4444" />
            </View>
            <Text style={styles.actionBtnText}>Leave</Text>
          </TouchableOpacity>
        </View>

        {/* Shared Media Section */}
        <View style={styles.mediaSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shared Media</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Styled Stacked Grid */}
          <View style={styles.mediaGrid}>
            {/* Top Large Item */}
            <View style={styles.largeMediaWrapper}>
              <Image source={{ uri: MOCK_GRAPH_IMAGE }} style={styles.largeMediaImage} resizeMode="cover" />
            </View>
            
            {/* Bottom Row */}
            <View style={styles.bottomMediaRow}>
              {/* Stacked File Cards */}
              <View style={styles.leftMediaCol}>
                <View style={styles.fileCard}>
                  <Icon name="document-text" size={20} color="#00E5FF" style={{ marginRight: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileCardName} numberOfLines={1}>Q3_Report.pdf</Text>
                    <Text style={styles.fileCardSize}>2.4 MB</Text>
                  </View>
                </View>
                <View style={styles.fileCard}>
                  <Icon name="folder" size={20} color="#00E5FF" style={{ marginRight: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileCardName} numberOfLines={1}>Assets.zip</Text>
                    <Text style={styles.fileCardSize}>14 MB</Text>
                  </View>
                </View>
              </View>
              
              {/* Right smaller image taking full height of stacked items */}
              <View style={styles.rightMediaCol}>
                <Image source={{ uri: MOCK_MEETING_IMAGE }} style={styles.smallMediaImage} resizeMode="cover" />
              </View>
            </View>
          </View>
        </View>

        {/* Group Description */}
        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailLabel}>Description</Text>
            {isAdmin && !editingDesc && (
              <TouchableOpacity onPress={() => setEditingDesc(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="pencil-outline" size={14} color="#00E5FF" />
              </TouchableOpacity>
            )}
          </View>
          {editingDesc ? (
            <View style={{ gap: spacing.s }}>
              <TextInput
                style={styles.descInput}
                value={descValue}
                onChangeText={setDescValue}
                multiline
                maxLength={500}
                placeholder="Add group description..."
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
              <View style={styles.descActions}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveDesc} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#080E1A" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setEditingDesc(false); setDescValue(chat?.description || ''); }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.descText}>
              {chat?.description || 'No description added.'}
            </Text>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.membersSection}>
          <Text style={styles.membersTitle}>Members</Text>
          
          {loadingMembers ? (
            <ActivityIndicator style={{ padding: spacing.xl }} color="#00E5FF" />
          ) : (
            <View style={styles.membersList}>
              {members.map(member => {
                const isMemberAdmin = !!chat?.admins?.[member.uid];
                const isSelf = member.uid === currentUser?.uid;
                
                return (
                  <View key={member.uid} style={styles.memberCard}>
                    <Avatar uri={member.avatarUrl} name={member.displayName || member.email} size={42} />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName} numberOfLines={1}>
                        {getMemberName(member)}
                      </Text>
                      <Text style={styles.memberRoleSub}>
                        {getMemberRole(member)}
                      </Text>
                    </View>
                    
                    {isMemberAdmin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>Admin</Text>
                      </View>
                    )}

                    {isSelf && (
                      <View style={styles.selfCheckmark}>
                        <Icon name="checkmark" size={14} color="#080E1A" />
                      </View>
                    )}

                    {isAdmin && !isSelf && (
                      <TouchableOpacity 
                        onPress={() => handleRemoveMember(member.uid, member.displayName || member.email)} 
                        style={styles.removeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="remove-circle-outline" size={20} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  // ── Header Section ──
  headerSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#00E5FF',
    padding: 3,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00E5FF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primaryBackground,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.l,
  },
  groupName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  groupMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.l,
    gap: spacing.s,
    width: '80%',
  },
  editNameInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  editActionBtn: {
    padding: spacing.xs,
  },
  // ── Action Buttons Row ──
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: spacing.l,
    marginHorizontal: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  actionBtn: {
    alignItems: 'center',
    width: 60,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionIconCircleActive: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  actionBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  // ── Shared Media Section ──
  mediaSection: {
    padding: spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  viewAllText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  mediaGrid: {
    gap: spacing.s,
  },
  largeMediaWrapper: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  largeMediaImage: {
    width: '100%',
    height: '100%',
  },
  bottomMediaRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  leftMediaCol: {
    flex: 1.1,
    gap: spacing.s,
  },
  rightMediaCol: {
    flex: 0.9,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  smallMediaImage: {
    width: '100%',
    height: '100%',
    minHeight: 112,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.s,
    borderWidth: 1,
    borderColor: '#374151',
    height: 52,
  },
  fileCardName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  fileCardSize: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  // ── Description Section ──
  detailSection: {
    padding: spacing.l,
    backgroundColor: '#1E293B',
    marginHorizontal: spacing.l,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: spacing.s,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  detailLabel: {
    color: '#00E5FF',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  descText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  descInput: {
    color: colors.textPrimary,
    fontSize: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 10,
    padding: spacing.m,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  descActions: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  saveBtn: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.s,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#080E1A',
    fontWeight: '700',
    fontSize: 13,
  },
  cancelBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.s,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  // ── Members Section ──
  membersSection: {
    padding: spacing.l,
  },
  membersTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.m,
  },
  membersList: {
    gap: spacing.s,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  memberInfo: {
    marginLeft: spacing.m,
    flex: 1,
  },
  memberName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  memberRoleSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderRadius: 6,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    marginRight: spacing.s,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  adminBadgeText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '700',
  },
  selfCheckmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    padding: spacing.xs,
  },
}));

export default GroupInfoScreen;
