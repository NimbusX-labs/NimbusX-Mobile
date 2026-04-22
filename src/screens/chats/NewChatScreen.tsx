import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';
import { firestoreService } from '@services/firebase/firestore';
import { useAppSelector } from '@store/hooks';
import { chatSelectors } from '@store/slices/chatSlice';
import { User, Chat } from '@types';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'NewChat'>;

// Simple email validity check — user must type a plausible address before we query
const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

type SearchState = 'idle' | 'searching' | 'found' | 'already_contact' | 'not_found' | 'error';

const NewChatScreen = () => {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAppSelector(state => state.auth.user);
  const chats = useAppSelector(chatSelectors.selectAll);

  // ── Load existing contacts live ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = firestoreService.listenContacts(currentUser.uid, setContacts);
    return () => unsubscribe();
  }, [currentUser]);

  // ── Debounced email search ───────────────────────────────────────────────
  const runSearch = useCallback(async (email: string) => {
    if (!currentUser) return;
    setSearchState('searching');
    setSearchResult(null);
    try {
      const result = await firestoreService.searchUserByEmail(email);
      if (!result) {
        setSearchState('not_found');
      } else if (result.uid === currentUser.uid) {
        setSearchState('not_found'); // That's yourself
      } else if (contacts.some(c => c.uid === result.uid)) {
        // User exists but already a contact — show them in "found" state with different action
        setSearchResult(result);
        setSearchState('already_contact');
      } else {
        setSearchResult(result);
        setSearchState('found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchState('error');
    }
  }, [currentUser, contacts]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    setSearchResult(null);

    // Clear pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setSearchState('idle');
      return;
    }

    if (!isValidEmail(text)) {
      setSearchState('idle');
      return;
    }

    // Fire search 500ms after the user stops typing
    setSearchState('searching');
    debounceRef.current = setTimeout(() => runSearch(text), 500);
  }, [runSearch]);

  // ── Add contact ──────────────────────────────────────────────────────────
  const handleAddContact = useCallback(async (user: User) => {
    if (!currentUser) return;
    try {
      await firestoreService.addContact(currentUser.uid, user);
      setQuery('');
      setSearchResult(null);
      setSearchState('idle');
    } catch (err) {
      Alert.alert('Error', 'Could not add contact. Please try again.');
      console.error('Add contact error:', err);
    }
  }, [currentUser]);

  // ── Start chat ───────────────────────────────────────────────────────────
  const startChat = useCallback(async (otherUser: User) => {
    if (!currentUser) return;
    try {
      // Check if a 1-to-1 chat already exists
      const existingChat = chats.find(c => 
        c.type === 'one-to-one' && 
        c.members?.includes(currentUser.uid) && 
        c.members?.includes(otherUser.uid)
      );

      if (existingChat) {
        navigation.replace('Chat', { chatId: existingChat.id });
        return;
      }

      const chatId = await firestoreService.createChat({
        type: 'one-to-one',
        members: [currentUser.uid, otherUser.uid],
        unreadCount: { [currentUser.uid]: 0, [otherUser.uid]: 0 },
        typing: { [currentUser.uid]: false, [otherUser.uid]: false },
      });
      navigation.replace('Chat', { chatId });
    } catch (error) {
      Alert.alert('Error', 'Could not start chat. Please try again.');
      console.error('Failed to start chat:', error);
    }
  }, [currentUser, navigation, chats]);

  // ── Search area UI ───────────────────────────────────────────────────────
  const renderSearchArea = () => {
    if (!query.trim()) return null;

    if (!isValidEmail(query)) {
      return (
        <View style={styles.hint}>
          <Icon name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.hintText}>Enter a full email address to search</Text>
        </View>
      );
    }

    if (searchState === 'searching') {
      return (
        <View style={styles.hint}>
          <ActivityIndicator size="small" color={colors.primaryAccent} />
          <Text style={styles.hintText}>Searching for user...</Text>
        </View>
      );
    }

    if (searchState === 'not_found') {
      return (
        <View style={styles.hint}>
          <Icon name="person-remove-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.hintText}>No user found with that email</Text>
        </View>
      );
    }

    if (searchState === 'error') {
      return (
        <View style={styles.hint}>
          <Icon name="warning-outline" size={18} color={colors.error} />
          <Text style={[styles.hintText, { color: colors.error }]}>Search failed — check your connection</Text>
        </View>
      );
    }

    if ((searchState === 'found' || searchState === 'already_contact') && searchResult) {
      const isAlreadyContact = searchState === 'already_contact';
      return (
        <View style={styles.resultCard}>
          <Avatar uri={searchResult.avatarUrl} name={searchResult.displayName || searchResult.email} size={48} />
          <View style={styles.resultInfo}>
            <Text style={styles.resultName}>{searchResult.displayName || '—'}</Text>
            <Text style={styles.resultEmail}>{searchResult.email}</Text>
          </View>
          {isAlreadyContact ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.chatBtn]}
              onPress={() => startChat(searchResult)}
            >
              <Icon name="chatbubble-outline" size={16} color={colors.white} />
              <Text style={styles.actionBtnText}>Chat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.addBtn]}
              onPress={() => handleAddContact(searchResult)}
            >
              <Icon name="person-add-outline" size={16} color={colors.white} />
              <Text style={styles.actionBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  // ── Contact list item ─────────────────────────────────────────────────────
  const renderContact = useCallback(({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => startChat(item)}>
      <Avatar uri={item.avatarUrl} name={item.displayName || item.email} size={45} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || item.email}</Text>
        <Text style={styles.userStatus}>{item.status || 'Hey there! I am using NimbusX'}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.divider} />
    </TouchableOpacity>
  ), [startChat]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search by email address..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleQueryChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleQueryChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search result area */}
      {renderSearchArea()}

      {/* New Group button */}
      <TouchableOpacity
        style={styles.groupButton}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <View style={styles.iconCircle}>
          <Icon name="people" size={24} color={colors.white} />
        </View>
        <Text style={styles.groupText}>New Group</Text>
      </TouchableOpacity>

      {/* Contacts section header */}
      {contacts.length > 0 && (
        <Text style={styles.sectionHeader}>CONTACTS — {contacts.length}</Text>
      )}

      {/* Contacts list */}
      <FlatList
        data={contacts}
        keyExtractor={item => item.uid || item.id}
        renderItem={renderContact}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="people-outline" size={40} color={colors.divider} />
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptyText}>Search by email above to add your first contact.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    margin: spacing.l,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  searchIcon: {
    marginRight: spacing.s,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.regular,
    paddingVertical: spacing.m,
  },
  // ── Hint / status row ──
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  hintText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    marginLeft: spacing.s,
  },
  // ── Search result card ──
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.primaryAccent,
  },
  resultInfo: {
    flex: 1,
    marginLeft: spacing.m,
  },
  resultName: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.medium,
  },
  resultEmail: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 10,
    gap: spacing.xs,
  },
  addBtn: {
    backgroundColor: colors.primaryAccent,
  },
  chatBtn: {
    backgroundColor: colors.success,
  },
  actionBtnText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: typography.fontSize.small,
    marginLeft: spacing.xs,
  },
  // ── Group button ──
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconCircle: {
    backgroundColor: colors.primaryAccent,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    fontWeight: 'bold',
    marginLeft: spacing.m,
  },
  // ── Section header ──
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginHorizontal: spacing.l,
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  // ── Contact item ──
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  userInfo: {
    marginLeft: spacing.m,
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    fontWeight: 'bold',
  },
  userStatus: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    marginTop: 2,
  },
  // ── Empty state ──
  empty: {
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontWeight: 'bold',
    fontSize: typography.fontSize.medium,
    marginTop: spacing.l,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.small,
    textAlign: 'center',
    marginTop: spacing.s,
    lineHeight: 20,
  },
});

export default NewChatScreen;
