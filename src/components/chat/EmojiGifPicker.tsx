import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { EMOJI_CATEGORIES } from '@data/emojis';
import {
  searchGifs,
  trendingGifs,
  searchStickers,
  trendingStickers,
  TenorMedia,
} from '@services/tenorService';

// ── Types ────────────────────────────────────────────────────────────────────
type PickerTab = 'emoji' | 'gif' | 'sticker';

interface EmojiGifPickerProps {
  visible: boolean;
  startTab?: 'emoji' | 'sticker';
  onEmojiSelect: (emoji: string) => void;
  onGifSelect: (gif: TenorMedia) => void;
  onStickerSelect: (sticker: TenorMedia) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EMOJI_SIZE = 40;
const EMOJI_COLS = Math.floor((SCREEN_WIDTH - spacing.s * 2) / EMOJI_SIZE);
const GIF_COLS = 2;
const GIF_ITEM_WIDTH = (SCREEN_WIDTH - spacing.s * 3) / GIF_COLS;

// ── Bottom Tab Button ────────────────────────────────────────────────────────
const BottomTab = React.memo(({
  icon, active, onPress,
}: {
  icon: string; active: boolean; onPress: () => void;
}) => {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.bottomTab, active && styles.bottomTabActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={22} color={active ? colors.primaryAccent : colors.textSecondary} />
    </TouchableOpacity>
  );
});

// ── Emoji Category Tab ───────────────────────────────────────────────────────
const CategoryTab = React.memo(({
  icon, active, onPress,
}: {
  icon: string; active: boolean; onPress: () => void;
}) => {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.catTab, active && styles.catTabActive]}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
    >
      <Icon name={icon} size={18} color={active ? colors.primaryAccent : colors.textSecondary} />
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
const EmojiGifPicker: React.FC<EmojiGifPickerProps> = ({
  visible,
  startTab = 'emoji',
  onEmojiSelect,
  onGifSelect,
  onStickerSelect,
}) => {
  const colors = useThemeColors();
  const [tab, setTab] = useState<PickerTab>(startTab);

  // Sync tab when startTab changes (e.g., sticker shortcut icon tapped)
  useEffect(() => {
    if (visible) setTab(startTab);
  }, [startTab, visible]);
  const [emojiCatIdx, setEmojiCatIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<TenorMedia[]>([]);
  const [stickers, setStickers] = useState<TenorMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load trending on tab switch ────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    if (tab === 'gif' && gifs.length === 0 && !searchQuery) {
      loadTrendingGifs();
    }
    if (tab === 'sticker' && stickers.length === 0 && !searchQuery) {
      loadTrendingStickers();
    }
  }, [gifs.length, searchQuery, stickers.length, tab, visible]);

  const loadTrendingGifs = async () => {
    setLoading(true);
    try {
      const res = await trendingGifs(30);
      setGifs(res.results);
    } catch { /* silent */ }
    setLoading(false);
  };

  const loadTrendingStickers = async () => {
    setLoading(true);
    try {
      const res = await trendingStickers(30);
      setStickers(res.results);
    } catch { /* silent */ }
    setLoading(false);
  };

  // ── Search handler (debounced) ─────────────────────────────────────────────
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      if (tab === 'gif') loadTrendingGifs();
      if (tab === 'sticker') loadTrendingStickers();
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (tab === 'gif') {
          const res = await searchGifs(text, 30);
          setGifs(res.results);
        } else if (tab === 'sticker') {
          const res = await searchStickers(text, 30);
          setStickers(res.results);
        }
      } catch { /* silent */ }
      setLoading(false);
    }, 400);
  }, [tab]);

  const switchTab = useCallback((newTab: PickerTab) => {
    setTab(newTab);
    setSearchQuery('');
  }, []);

  // ── Render emoji grid ──────────────────────────────────────────────────────
  const currentEmojis = EMOJI_CATEGORIES[emojiCatIdx]?.emojis || [];

  const renderEmojiItem = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.emojiItem}
      onPress={() => onEmojiSelect(item)}
      activeOpacity={0.5}
    >
      <Text style={styles.emojiText}>{item}</Text>
    </TouchableOpacity>
  ), [onEmojiSelect]);

  // ── Render GIF/Sticker item ────────────────────────────────────────────────
  const renderMediaItem = useCallback(({ item }: { item: TenorMedia }) => (
    <TouchableOpacity
      style={styles.gifItem}
      onPress={() => tab === 'gif' ? onGifSelect(item) : onStickerSelect(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.previewUrl }}
        style={styles.gifImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  ), [tab, onGifSelect, onStickerSelect]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* ── Content area ─────────────────────────────────────────────── */}
      <View style={styles.contentArea}>
        {/* EMOJI TAB */}
        {tab === 'emoji' && (
          <>
            {/* Category bar */}
            <View style={styles.catBar}>
              {EMOJI_CATEGORIES.map((cat, idx) => (
                <CategoryTab
                  key={cat.name}
                  icon={cat.icon}
                  active={emojiCatIdx === idx}
                  onPress={() => setEmojiCatIdx(idx)}
                />
              ))}
            </View>

            <FlatList
              data={currentEmojis}
              renderItem={renderEmojiItem}
              keyExtractor={(item, i) => `${item}_${i}`}
              numColumns={EMOJI_COLS}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.emojiGrid}
            />
          </>
        )}

        {/* GIF TAB */}
        {tab === 'gif' && (
          <>
            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search GIFs..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Icon name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator style={styles.loader} color={colors.primaryAccent} />
            ) : (
              <FlatList
                data={gifs}
                renderItem={renderMediaItem}
                keyExtractor={item => item.id}
                numColumns={GIF_COLS}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gifGrid}
                columnWrapperStyle={styles.gifRow}
              />
            )}
          </>
        )}

        {/* STICKER TAB */}
        {tab === 'sticker' && (
          <>
            <View style={styles.searchBar}>
              <Icon name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stickers..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Icon name="close-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator style={styles.loader} color={colors.primaryAccent} />
            ) : (
              <FlatList
                data={stickers}
                renderItem={renderMediaItem}
                keyExtractor={item => item.id}
                numColumns={GIF_COLS}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.gifGrid}
                columnWrapperStyle={styles.gifRow}
              />
            )}
          </>
        )}
      </View>

      {/* ── Bottom tab bar (like WhatsApp) ─────────────────────────── */}
      <View style={styles.bottomBar}>
        <BottomTab
          icon="happy-outline"
          active={tab === 'emoji'}
          onPress={() => switchTab('emoji')}
        />
        <BottomTab
          icon="film-outline"
          active={tab === 'gif'}
          onPress={() => switchTab('gif')}
        />
        <BottomTab
          icon="sparkles-outline"
          active={tab === 'sticker'}
          onPress={() => switchTab('sticker')}
        />

        {/* Tenor attribution */}
        <View style={styles.tenorBadge}>
          <Text style={styles.tenorText}>Tenor</Text>
        </View>
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
const styles = createThemedStyles((colors) => ({
  container: {
    height: 300,
    backgroundColor: '#1A2836',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  contentArea: {
    flex: 1,
  },
  // ── Emoji ──
  catBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#1E2D3D',
  },
  catTab: {
    padding: 6,
    borderRadius: 6,
  },
  catTabActive: {
    backgroundColor: 'rgba(29,161,242,0.15)',
  },
  emojiGrid: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  emojiItem: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 26,
  },
  // ── GIF / Sticker search ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2D3D',
    marginHorizontal: spacing.s,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: 10,
    paddingHorizontal: spacing.s,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    paddingVertical: 6,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  gifGrid: {
    paddingHorizontal: spacing.xs,
  },
  gifRow: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  gifItem: {
    width: GIF_ITEM_WIDTH,
    height: GIF_ITEM_WIDTH * 0.75,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  // ── Bottom tab bar ──
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2D3D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 4,
    paddingHorizontal: spacing.xl,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottomTabActive: {
    backgroundColor: 'rgba(29,161,242,0.12)',
  },
  tenorBadge: {
    position: 'absolute',
    right: spacing.m,
    opacity: 0.4,
  },
  tenorText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
}));

export default React.memo(EmojiGifPicker);
