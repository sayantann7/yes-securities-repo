import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useEffect, useState } from 'react';
import UploadFileModal from '@/components/upload/UploadFileModal';
import { FileText, Clock, Star, Users, BarChart2, FilePlus } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>    
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.primary }]}>Hello, {user?.name}</Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {user?.role === 'admin' && (
              <TouchableOpacity
                onPress={() => setShowUploadModal(true)}
                style={{ marginRight: 16, padding: 8 }}
              >
                <FilePlus size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity>
              <Image 
                source={{ uri: user?.avatar || '/avatar.jpg' }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 8 }}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(66, 133, 244, 0.1)' }]}>
              <FileText size={20} color="#4285F4" />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>253</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Documents</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(251, 188, 5, 0.1)' }]}>
              <Star size={20} color="#FBBC05" />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>18</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Starred</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 168, 83, 0.1)' }]}>
              <Users size={20} color="#34A853" />
            </View>
            <Text style={[styles.statValue, { color: colors.primary }]}>7</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Shared</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Team Activity</Text>
          </View>
          <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
            <BarChart2 size={24} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.activityTitle, { color: colors.primary }]}>Weekly Document Access</Text>
            <Text style={[styles.activitySubtitle, { color: colors.textSecondary }]}>Your team viewed 125 documents this week</Text>
            <View style={styles.activityStatsRow}>
              <View style={styles.activityStat}>
                <Text style={[styles.activityStatValue, { color: colors.primary }]}>+12%</Text>
                <Text style={[styles.activityStatLabel, { color: colors.textSecondary }]}>vs last week</Text>
              </View>
              <View style={styles.activityStat}>
                <Text style={[styles.activityStatValue, { color: colors.primary }]}>48</Text>
                <Text style={[styles.activityStatLabel, { color: colors.textSecondary }]}>new uploads</Text>
              </View>
              <View style={styles.activityStat}>
                <Text style={[styles.activityStatValue, { color: colors.primary }]}>18</Text>
                <Text style={[styles.activityStatLabel, { color: colors.textSecondary }]}>comments</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.bottomPadding} />
        {user?.role === 'admin' && (
          <UploadFileModal visible={showUploadModal} onClose={() => setShowUploadModal(false)} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
  },
  subGreeting: {
    fontSize: 14,
    marginTop: 4,
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statCard: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '32%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginTop: 44,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 24,
    marginTop: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activitySubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  activityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityStat: {
    alignItems: 'center',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  activityStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomPadding: {
    height: 20,
  },
});