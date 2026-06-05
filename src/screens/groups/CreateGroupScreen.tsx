import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { firestoreService } from '@services/supabase/database';
import { useAppSelector } from '@store/hooks';
import Avatar from '@components/common/Avatar';
import { User } from '@types';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'CreateGroup'>;

const MIN_MEMBERS = 2; // Minimum members other than the creator

const CreateGroupScreen = () => {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAppSelector(state => state.auth.user);

  // Set header title in Cyan
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Create Group',
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
    });
  }, [navigation]);

  // Load contacts from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = firestoreService.listenContacts(currentUser.uid, setContacts);
    return () => unsubscribe();
  }, [currentUser]);

  // Toggle member selection
  const toggleMember = (uid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  // Filtered contacts based on search
  const filteredContacts = contacts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.displayName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const canCreate = name.trim().length > 0 && selectedIds.size >= MIN_MEMBERS;

  const handleCreate = async () => {
    if (!currentUser || !canCreate) return;

    setLoading(true);
    try {
      const allMembers = [currentUser.uid, ...Array.from(selectedIds)];

      const unreadCount: Record<string, number> = {};
      const typing: Record<string, boolean> = {};
      allMembers.forEach(uid => {
        unreadCount[uid] = 0;
        typing[uid] = false;
      });

      const chatId = await firestoreService.createChat({
        type: 'group',
        name: name.trim(),
        description: '',
        members: allMembers,
        admins: { [currentUser.uid]: true },
        createdBy: currentUser.uid,
        unreadCount,
        typing,
      });

      navigation.replace('GroupChat', {
        chatId,
        groupName: name.trim(),
      });
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Could not create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic role mapper for mockups
  const getUserRole = (user: User) => {
    const displayName = (user.displayName || '').toLowerCase();
    if (displayName.includes('sarah') || displayName.includes('jenkins')) return 'Design';
    if (displayName.includes('david') || displayName.includes('kim')) return 'Engineering';
    if (displayName.includes('alex')) return 'Product Manager';
    if (displayName.includes('elena')) return 'Security Ops';
    return user.status || 'Engineering';
  };

  // Selected member chips (horizontal scroll)
  const renderSelectedChips = () => {
    if (selectedIds.size === 0) return null;
    const selected = contacts.filter(c => selectedIds.has(c.uid));
    return (
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {selected.map(user => (
            <TouchableOpacity
              key={user.uid}
              style={styles.chip}
              onPress={() => toggleMember(user.uid)}
              activeOpacity={0.7}
            >
              <Avatar uri={user.avatarUrl} name={user.displayName || user.email} size={24} />
              <Text style={styles.chipName} numberOfLines={1}>
                {(user.displayName || user.email || '').split(' ')[0]}
              </Text>
              <Icon name="close" size={14} color={colors.textPrimary} style={styles.chipCloseIcon} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderContact = ({ item }: { item: User }) => {
    const isSelected = selectedIds.has(item.uid);
    return (
      <TouchableOpacity
        style={[styles.contactCard, isSelected && styles.contactCardSelected]}
        onPress={() => toggleMember(item.uid)}
        activeOpacity={0.75}
      >
        <Avatar uri={item.avatarUrl} name={item.displayName || item.email} size={44} />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {item.displayName || item.email}
          </Text>
          <Text style={styles.contactRole} numberOfLines={1}>
            {getUserRole(item)}
          </Text>
        </View>
        <View style={[styles.addButton, isSelected && styles.addButtonSelected]}>
          <Icon 
            name={isSelected ? 'checkmark' : 'add'} 
            size={18} 
            color={isSelected ? '#080E1A' : colors.textPrimary} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Group Info Name Card */}
        <View style={styles.groupCard}>
          <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>
            <View style={styles.placeholderAvatar}>
              <Icon name="camera" size={24} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Text style={styles.groupCardLabel}>GROUP NAME</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="e.g. Project Alpha Team"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Team Members Selection Header */}
        <View style={styles.teamHeader}>
          <Text style={styles.teamTitle}>Team Members</Text>
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>
              {selectedIds.size} Selected
            </Text>
          </View>
        </View>

        {/* Search contacts */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Selected member chips list */}
        {renderSelectedChips()}

        {/* Contact list header */}
        <Text style={styles.contactsSectionTitle}>Contacts</Text>

        {/* Contacts */}
        <FlatList
          data={filteredContacts}
          scrollEnabled={false}
          keyExtractor={item => item.uid || item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="people-outline" size={36} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No contacts found</Text>
              <Text style={styles.emptyText}>
                Add contacts first from the new-chat screen to include them in a group.
              </Text>
            </View>
          }
        />
      </ScrollView>

      {/* Footer Buttons Section */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.createButton, !canCreate && styles.disabledCreateButton]} 
          onPress={handleCreate}
          disabled={!canCreate || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#080E1A" size="small" />
          ) : (
            <>
              <Text style={styles.createText}>CREATE GROUP</Text>
              <Icon name="checkmark" size={18} color="#080E1A" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  // ── Group Name card ──
  groupCard: {
    flexDirection: 'row',
    padding: spacing.l,
    marginHorizontal: spacing.l,
    marginTop: spacing.l,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  avatarContainer: {
    marginRight: spacing.l,
  },
  placeholderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4B5563',
    borderStyle: 'dashed',
  },
  inputContainer: {
    flex: 1,
  },
  groupCardLabel: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  nameInput: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  // ── Team Members Selection Header ──
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
    marginHorizontal: spacing.l,
  },
  teamTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  selectedBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
  },
  selectedBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    marginHorizontal: spacing.l,
    marginTop: spacing.l,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  searchIcon: {
    marginRight: spacing.s,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    paddingVertical: spacing.m,
  },
  // ── Selected chips ──
  chipsWrapper: {
    marginTop: spacing.m,
    maxHeight: 46,
  },
  chipsScroll: {
    paddingHorizontal: spacing.l,
    gap: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingRight: spacing.s,
    paddingLeft: spacing.xxs,
    paddingVertical: spacing.xxs,
    gap: spacing.xs,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: '#374151',
  },
  chipName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipCloseIcon: {
    marginLeft: 2,
    opacity: 0.6,
  },
  // ── Contacts ──
  contactsSectionTitle: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.l,
    marginTop: spacing.xl,
    marginBottom: spacing.s,
  },
  listContent: {
    paddingHorizontal: spacing.l,
    gap: spacing.s,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  contactCardSelected: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  contactInfo: {
    marginLeft: spacing.m,
    flex: 1,
  },
  contactName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  contactRole: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonSelected: {
    backgroundColor: '#00E5FF',
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.m,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: typography.fontSize.regular,
    marginTop: spacing.m,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: typography.lineHeight.small,
  },
  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primaryBackground,
    flexDirection: 'row',
    padding: spacing.l,
    justifyContent: 'space-between',
    gap: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createButton: {
    flex: 2,
    backgroundColor: '#00E5FF',
    borderRadius: 12,
    paddingVertical: spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledCreateButton: {
    backgroundColor: 'rgba(0, 229, 255, 0.3)',
  },
  createText: {
    color: '#080E1A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
}));

export default CreateGroupScreen;
