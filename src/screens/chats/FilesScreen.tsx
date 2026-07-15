import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useAppSelector } from '@store/hooks';
import { messagesSelectors } from '@store/slices/messageSlice';

// ── Types ───────────────────────────────────────────────────────────────────

type FileCategory = 'recent' | 'media' | 'docs' | 'downloads';

interface FileItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'file';
  size?: number;
  url?: string;
  chatId: string;
  chatName?: string;
  date: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const formatDate = (ts: number) => {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const FILE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  image: { icon: 'image', color: '#06B6D4' },
  video: { icon: 'videocam', color: '#8B5CF6' },
  audio: { icon: 'musical-notes', color: '#F59E0B' },
  file:  { icon: 'document-text', color: '#10B981' },
};

// ── Category Tabs ───────────────────────────────────────────────────────────

const CATEGORIES: { key: FileCategory; label: string; icon: string }[] = [
  { key: 'recent',    label: 'Recent',    icon: 'time-outline' },
  { key: 'media',     label: 'Media',     icon: 'image-outline' },
  { key: 'docs',      label: 'Docs',      icon: 'document-text-outline' },
  { key: 'downloads', label: 'Downloads', icon: 'download-outline' },
];

// ── File Row Component ──────────────────────────────────────────────────────

const FileRow = React.memo(({ item }: { item: FileItem }) => {
  const typeInfo = FILE_TYPE_ICONS[item.type] || FILE_TYPE_ICONS.file;

  return (
    <TouchableOpacity style={styles.fileRow} activeOpacity={0.7}>
      {/* Thumbnail or icon */}
      {item.type === 'image' && item.url ? (
        <Image source={{ uri: item.url }} style={styles.fileThumbnail} />
      ) : (
        <View style={[styles.fileIconBox, { backgroundColor: `${typeInfo.color}15` }]}>
          <Icon name={typeInfo.icon} size={22} color={typeInfo.color} />
        </View>
      )}

      {/* Info */}
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.fileMeta}>
          {item.size ? (
            <Text style={styles.fileMetaText}>{formatFileSize(item.size)}</Text>
          ) : null}
          {item.size ? <Text style={styles.fileMetaDot}>·</Text> : null}
          <Text style={styles.fileMetaText}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── Main Screen ─────────────────────────────────────────────────────────────

const FilesScreen = () => {
  const colors = useThemeColors();
  const [activeCategory, setActiveCategory] = useState<FileCategory>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const storageMode = useAppSelector((state) => state.auth.storageMode);

  // Get all messages that have media
  const allMessages = useAppSelector(messagesSelectors.selectAll);
  const mediaMessages = allMessages.filter(m => m.mediaUrl && m.mediaType);

  // Convert messages to file items
  const fileItems: FileItem[] = mediaMessages.map(m => {
    let name = 'File';
    if (m.mediaPath) {
      const parts = m.mediaPath.split('/');
      name = parts[parts.length - 1];
    } else if (m.mediaUrl) {
      try {
        const decoded = decodeURIComponent(m.mediaUrl);
        const parts = decoded.split('?')[0].split('/');
        name = parts[parts.length - 1];
      } catch { /* ignore */ }
    }

    return {
      id: m.id,
      name,
      type: m.mediaType as FileItem['type'],
      size: m.mediaSize,
      url: m.mediaUrl,
      chatId: m.chatId,
      date: m.createdAt,
    };
  });

  // Filter by category
  const filteredItems = fileItems.filter(item => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q)) return false;
    }

    switch (activeCategory) {
      case 'recent':
        return true; // Show all, sorted by date
      case 'media':
        return item.type === 'image' || item.type === 'video';
      case 'docs':
        return item.type === 'file';
      case 'downloads':
        return true; // In a real implementation, filter by locally cached files
      default:
        return true;
    }
  }).sort((a, b) => b.date - a.date);

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Icon
        name={activeCategory === 'media' ? 'image-outline' : activeCategory === 'docs' ? 'document-text-outline' : 'folder-open-outline'}
        size={48}
        color={colors.textTertiary}
      />
      <Text style={styles.emptyTitle}>No files yet</Text>
      <Text style={styles.emptyText}>
        Files shared in your conversations will appear here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color={colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search files..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Storage mode indicator — very subtle */}
      <View style={styles.modeRow}>
        <Icon
          name={storageMode === 'cloud' ? 'cloud' : 'phone-portrait'}
          size={12}
          color={colors.textTertiary}
        />
        <Text style={styles.modeText}>
          {storageMode === 'cloud' ? 'Cloud Sync' : 'Local Only'}
        </Text>
      </View>

      {/* Category tabs */}
      <View style={styles.tabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.tab,
              activeCategory === cat.key && styles.tabActive,
            ]}
            onPress={() => setActiveCategory(cat.key)}
            activeOpacity={0.7}
          >
            <Icon
              name={cat.icon}
              size={16}
              color={activeCategory === cat.key ? colors.primaryAccent : colors.textTertiary}
            />
            <Text style={[
              styles.tabLabel,
              activeCategory === cat.key && styles.tabLabelActive,
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* File list */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FileRow item={item} />}
        contentContainerStyle={filteredItems.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = createThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  // ── Search ──
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: 10,
    marginHorizontal: spacing.l,
    marginTop: spacing.m,
    paddingHorizontal: spacing.m,
    height: 40,
    gap: spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.regular,
    color: colors.textPrimary,
    padding: 0,
  },
  // ── Mode indicator ──
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.s,
    gap: 4,
  },
  modeText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  // ── Tabs ──
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.l,
    marginTop: spacing.m,
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    backgroundColor: colors.secondaryBackground,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.accentMuted,
  },
  tabLabel: {
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primaryAccent,
  },
  // ── File list ──
  listContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.s,
    paddingBottom: spacing.huge,
  },
  emptyContainer: {
    flex: 1,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  fileThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
  },
  fileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: spacing.m,
  },
  fileName: {
    fontSize: typography.fontSize.regular,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  fileMetaText: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  fileMetaDot: {
    fontSize: 12,
    color: colors.textTertiary,
    marginHorizontal: 4,
  },
  // ── Empty ──
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    marginTop: spacing.l,
    fontSize: typography.fontSize.medium,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyText: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.small,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
}));

export default FilesScreen;
