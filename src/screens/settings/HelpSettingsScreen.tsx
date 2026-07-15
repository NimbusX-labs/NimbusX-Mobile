import React from 'react';
import {
  View,
  Text,

  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ChatStackParamList } from '@navigation/types';
import { useThemeColors, createThemedStyles } from '@theme/colors';
import { spacing } from '@theme/spacing';

type NavigationProp = StackNavigationProp<ChatStackParamList, 'HelpSettings'>;

interface ItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

const SettingItem = ({ icon, title, subtitle, onPress }: ItemProps) => {
  const colors = useThemeColors();
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconBox}>
        <Icon name={icon} size={18} color={colors.primaryAccent} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
};

const HelpSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Support */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.card}>
          <SettingItem
            icon="help-buoy-outline"
            title="Help Center"
            subtitle="Browse FAQs and troubleshooting guides"
            onPress={() => navigation.navigate('HelpCenter')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="mail-outline"
            title="Contact Us"
            subtitle="Send a message to our support team"
            onPress={() => navigation.navigate('ContactUs')}
          />
        </View>

        {/* Legal */}
        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.card}>
          <SettingItem
            icon="document-text-outline"
            title="Terms & Privacy Policy"
            subtitle="Terms of Service and Privacy Policy"
            onPress={() => navigation.navigate('TermsPrivacy')}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <SettingItem
            icon="information-circle-outline"
            title="App Info"
            subtitle="Version, build info, server status"
            onPress={() => navigation.navigate('AppInfo')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.primaryBackground },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: spacing.s,
    marginTop: spacing.m,
  },
  card: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    marginBottom: spacing.s,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginLeft: 56,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(6,182,212,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  itemContent: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
}));

export default HelpSettingsScreen;
