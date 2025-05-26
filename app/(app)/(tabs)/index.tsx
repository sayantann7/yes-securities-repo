import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useEffect } from 'react';
import { FileText, Clock, Star, Users, BarChart2 } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { RecentDocumentItem } from '@/components/document/RecentDocumentItem';
import { useFetchDashboardData } from '@/hooks/useFetchDashboardData';

export default function HomeScreen() {
  const { user } = useAuth();
  const { recentDocuments, popularDocuments, isLoading } = useFetchDashboardData();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}</Text>
            <Text style={styles.subGreeting}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <TouchableOpacity>
            <Image 
              source={{ uri: user?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(66, 133, 244, 0.1)' }]}>
              <FileText size={20} color="#4285F4" />
            </View>
            <Text style={styles.statValue}>253</Text>
            <Text style={styles.statLabel}>Documents</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(234, 67, 53, 0.1)' }]}>
              <Clock size={20} color="#EA4335" />
            </View>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Recent</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(251, 188, 5, 0.1)' }]}>
              <Star size={20} color="#FBBC05" />
            </View>
            <Text style={styles.statValue}>18</Text>
            <Text style={styles.statLabel}>Starred</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(52, 168, 83, 0.1)' }]}>
              <Users size={20} color="#34A853" />
            </View>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Shared</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Documents</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllButton}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentDocumentsContainer}
          >
            {recentDocuments.map((doc) => (
              <RecentDocumentItem key={doc.id} document={doc} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Team Activity</Text>
          </View>
          <View style={styles.activityCard}>
            <BarChart2 size={24} color="#0C2340" style={{ marginBottom: 12 }} />
            <Text style={styles.activityTitle}>Weekly Document Access</Text>
            <Text style={styles.activitySubtitle}>Your team viewed 125 documents this week</Text>
            <View style={styles.activityStatsRow}>
              <View style={styles.activityStat}>
                <Text style={styles.activityStatValue}>+12%</Text>
                <Text style={styles.activityStatLabel}>vs last week</Text>
              </View>
              <View style={styles.activityStat}>
                <Text style={styles.activityStatValue}>48</Text>
                <Text style={styles.activityStatLabel}>new uploads</Text>
              </View>
              <View style={styles.activityStat}>
                <Text style={styles.activityStatValue}>18</Text>
                <Text style={styles.activityStatLabel}>comments</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#0C2340',
  },
  subGreeting: {
    fontSize: 14,
    color: '#7A869A',
    marginTop: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '23%',
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
    color: '#0C2340',
  },
  statLabel: {
    fontSize: 12,
    color: '#7A869A',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
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
    color: '#0C2340',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#0C2340',
    fontWeight: '500',
  },
  recentDocumentsContainer: {
    paddingRight: 20,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 24,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C2340',
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#7A869A',
    marginTop: 4,
    marginBottom: 16,
  },
  activityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityStat: {
    alignItems: 'center',
    flex: 1,
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C2340',
  },
  activityStatLabel: {
    fontSize: 12,
    color: '#7A869A',
    marginTop: 2,
  },
});