import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import Avatar from '@components/common/Avatar';
import { firestoreService } from '@services/supabase/database';
import { useAppSelector } from '@store/hooks';
import { chatSelectors } from '@store/slices/chatSlice';
import { useIdentity } from '@hooks/useIdentity';
import { SearchResult, User } from '@types';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'NewChat'>;

type SearchState = 'idle' | 'searching' | 'found' | 'already_contact' | 'not_found' | 'error';

const NewChatScreen = () => {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAppSelector(state => state.auth.user);
  const chats = useAppSelector(chatSelectors.selectAll);
  const { searchUsers } = useIdentity();

  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = firestoreService.listenContacts(currentUser.uid, setContacts);
    return () => unsubscribe();
  }, [currentUser]);

  const runSearch = useCallback(async (q: string) => {
    if (!currentUser) return;
    setSearchState('searching');
    setSearchResult(null);
    try {
      const results = await searchUsers(q, currentUser.uid);
      if (results.length === 0) {
        setSearchState('not_found');
      } else {
        const result = results[0];
        if (contacts.some(c => c.uid === result.uid)) {
          setSearchResult(result);
          setSearchState('already_contact');
        } else {
          setSearchResult(result);
          setSearchState('found');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchState('error');
    }
  }, [currentUser, contacts, searchUsers]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    setSearchResult(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setSearchState('idle');
      return;
    }
    setSearchState('searching');
    debounceRef.current = setTimeout(() => runSearch(text), 400);
  }, [runSearch]);

  const handleAddContact = useCallback(async (user: SearchResult) => {
    if (!currentUser) return;
    try {
      await firestoreService.addContact(currentUser.uid, {
        uid: user.uid, id: user.uid, email: '', displayName: user.displayName,
        avatarUrl: user.avatarUrl, username: user.username, shareCode: user.shareCode,
      } as User);
      setQuery('');
      setSearchResult(null);
      setSearchState('idle');
    } catch (err) {
      Alert.alert('Error', 'Could not add contact.');
      console.error('Add contact error:', err);
    }
  }, [currentUser]);

  const startChat = useCallback(async (otherUser: User | SearchResult) => {
    if (!currentUser) return;
    try {
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
      Alert.alert('Error', 'Could not start chat.');
      console.error('Failed to start chat:', error);
    }
  }, [currentUser, navigation, chats]);

  const renderSearchArea = () => {
    if (!query.trim()) return null;

    if (searchState === 'searching') {
      return (
        <View style={styles.hint}>
          <ActivityIndicator size="small" color={colors.primaryAccent} />
          <Text style={styles.hintText}>Searching...</Text>
        </View>
      );
    }

    if (searchState === 'not_found') {
      return (
        <View style={styles.hint}>
          <Icon name="person-remove-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.hintText}>No user found</Text>
        </View>
      );
    }

    if (searchState === 'error') {
      return (
        <View style={styles.hint}>
          <Icon name="warning-outline" size={18} color={colors.error} />
          <Text style={[styles.hintText, { color: colors.error }]}>Search failed</Text>
        </View>
      );
    }

    if ((searchState === 'found' || searchState === 'already_contact') && searchResult) {
      const isAlreadyContact = searchState === 'already_contact';
      return (
        <View style={styles.resultCard}>
          <Avatar uri={searchResult.avatarUrl} name={searchResult.displayName} size={48} />
          <View style={styles.resultInfo}>
            <Text style={styles.resultName}>{searchResult.displayName}</Text>
            <Text style={styles.resultEmail}>
              {searchResult.username ? `@${searchResult.username}` : searchResult.shareCode || ''}
            </Text>
          </View>
          {isAlreadyContact ? (
            <TouchableOpacity style={[styles.actionBtn, styles.chatBtn]} onPress={() => startChat(searchResult)}>
              <Icon name="chatbubble-outline" size={16} color={colors.white} />
              <Text style={styles.actionBtnText}>Chat</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, styles.addBtn]} onPress={() => handleAddContact(searchResult)}>
              <Icon name="person-add-outline" size={16} color={colors.white} />
              <Text style={styles.actionBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  const renderContact = useCallback(({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => startChat(item)}>
      <Avatar uri={item.avatarUrl} name={item.displayName || item.email} size={45} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || item.email}</Text>
        <Text style={styles.userStatus}>{item.status || 'Hey there! I am using NimbusX'}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.divider} />
    </TouchableOpacity>
  ), [startChat, colors.divider]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search by username, code, or name..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleQueryChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleQueryChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {renderSearchArea()}

      <TouchableOpacity
        style={styles.actionRow}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <View style={styles.actionIcon}>
          <Icon name="people" size={22} color={colors.white} />
        </View>
        <Text style={styles.actionText}>New Group</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionRow}
        onPress={() => navigation.navigate('ContactSync')}
      >
        <View style={[styles.actionIcon, styles.actionIconGreen]}>
          <Icon name="phone-portrait-outline" size={22} color={colors.white} />
        </View>
        <Text style={styles.actionText}>Find Contacts</Text>
      </TouchableOpacity>

      {contacts.length > 0 && (
        <Text style={styles.sectionHeader}>CONTACTS — {contacts.length}</Text>
      )}

      <FlatList
        data={contacts}
        keyExtractor={item => item.uid || item.id}
        renderItem={renderContact}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="people-outline" size={40} color={colors.divider} />
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptyText}>Search above or sync your phone contacts to find friends.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.secondaryBackground, margin: spacing.l,
    borderRadius: 12, paddingHorizontal: spacing.m,
    borderWidth: 1, borderColor: colors.divider,
  },
  searchIcon: { marginRight: spacing.s },
  input: {
    flex: 1, color: colors.textPrimary, fontSize: typography.fontSize.regular,
    paddingVertical: spacing.m,
  },
  hint: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.l, marginBottom: spacing.m, gap: spacing.s,
  },
  hintText: { color: colors.textSecondary, fontSize: typography.fontSize.small },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.l,
    marginBottom: spacing.m, backgroundColor: colors.secondaryBackground,
    borderRadius: 14, padding: spacing.l, borderWidth: 1, borderColor: colors.primaryAccent,
  },
  resultInfo: { flex: 1, marginLeft: spacing.m },
  resultName: { color: colors.textPrimary, fontWeight: 'bold', fontSize: typography.fontSize.medium },
  resultEmail: { color: colors.textSecondary, fontSize: typography.fontSize.small, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.m,
    paddingVertical: spacing.s, borderRadius: 10, gap: spacing.xs,
  },
  addBtn: { backgroundColor: colors.primaryAccent },
  chatBtn: { backgroundColor: colors.success },
  actionBtnText: { color: colors.white, fontWeight: 'bold', fontSize: typography.fontSize.small },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.l,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  actionIcon: {
    width: 45, height: 45, borderRadius: 22.5,
    backgroundColor: colors.primaryAccent,
    justifyContent: 'center', alignItems: 'center',
  },
  actionIconGreen: {
    backgroundColor: '#22c55e',
  },
  actionText: {
    color: colors.textPrimary, fontSize: typography.fontSize.medium,
    fontWeight: '600', marginLeft: spacing.m,
  },
  sectionHeader: {
    color: colors.textSecondary, fontSize: 11, fontWeight: 'bold',
    letterSpacing: 0.8, marginHorizontal: spacing.l,
    marginTop: spacing.l, marginBottom: spacing.s,
  },
  userItem: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.l,
    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
  },
  userInfo: { marginLeft: spacing.m, flex: 1 },
  userName: { color: colors.textPrimary, fontSize: typography.fontSize.medium, fontWeight: '600' },
  userStatus: { color: colors.textSecondary, fontSize: typography.fontSize.small, marginTop: 2 },
  empty: { padding: spacing.xxl, alignItems: 'center', marginTop: spacing.xxl },
  emptyTitle: { color: colors.textPrimary, fontWeight: 'bold', fontSize: typography.fontSize.medium, marginTop: spacing.l },
  emptyText: { color: colors.textSecondary, fontSize: typography.fontSize.small, textAlign: 'center', marginTop: spacing.s },
}));

export default NewChatScreen;
