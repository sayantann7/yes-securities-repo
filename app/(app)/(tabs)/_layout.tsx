import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home as HomeIcon, Folder as FolderIcon, Search as SearchIcon, User as UserIcon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }],
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: [styles.tabBarLabel, { color: colors.text }],
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      {user?.role === 'admin' && (
        <Tabs.Screen
          name="documents"
          options={{
            title: 'Documents',
            tabBarIcon: ({ color, size }) => (
              <FolderIcon color={color} size={size} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <SearchIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserIcon color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    borderRadius: 20,
    height: 70,
    paddingBottom: 10,
    paddingTop: 4,
    marginHorizontal: 10,
    marginBottom: 6,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});