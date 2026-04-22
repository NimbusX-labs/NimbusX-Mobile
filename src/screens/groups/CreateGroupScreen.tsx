import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { firestoreService } from '@services/firebase/firestore';
import { useAppSelector } from '@store/hooks';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'CreateGroup'>;

const CreateGroupScreen = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const currentUser = useAppSelector(state => state.auth.user);

  const handleCreate = async () => {
    if (!currentUser || !name.trim()) return;
    
    setLoading(true);
    try {
      const chatId = await firestoreService.createChat({
        type: 'group',
        name: name.trim(),
        members: [currentUser.uid],
        admins: { [currentUser.uid]: true },
        unreadCount: { [currentUser.uid]: 0 },
        typing: { [currentUser.uid]: false },
      });

      navigation.replace('GroupChat', { 
        chatId, 
        groupName: name.trim() 
      });
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarContainer}>
          <View style={styles.placeholderAvatar}>
            <Icon name="camera" size={30} color={colors.white} />
          </View>
        </TouchableOpacity>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type group name here..."
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Text style={styles.hint}>Please provide a group name and optional group icon</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.fab, (!name.trim() || loading) && styles.disabled]}
        onPress={handleCreate}
        disabled={!name.trim() || loading}
      >
        {loading ? <ActivityIndicator color={colors.white} /> : <Icon name="checkmark" size={30} color={colors.white} />}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  header: {
    flexDirection: 'row',
    padding: spacing.xxl,
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
  },
  avatarContainer: {
    marginRight: spacing.xl,
  },
  placeholderAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryAccent,
    paddingBottom: spacing.xs,
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: spacing.s,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xxl,
    backgroundColor: colors.primaryAccent,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default CreateGroupScreen;
