import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView, Alert, Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { 
  User, LogOut, Settings, Bell, Moon, Key, Shield, Download, 
  HardDrive, Wifi, WifiOff
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: handleLogout }
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#0C2340" />
        </TouchableOpacity>
      </View>
      
      <ScrollView>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: user?.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg' }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Sales Team'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <User size={20} color="#0C2340" />
            </View>
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <Text style={styles.menuItemAction}>></Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Key size={20} color="#0C2340" />
            </View>
            <Text style={styles.menuItemText}>Change Password</Text>
            <Text style={styles.menuItemAction}>></Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Shield size={20} color="#0C2340" />
            </View>
            <Text style={styles.menuItemText}>Security Settings</Text>
            <Text style={styles.menuItemAction}>></Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Bell size={20} color="#0C2340" />
            </View>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Switch 
              trackColor={{ false: '#D1D5DB', true: '#0C2340' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
              value={true}
            />
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Moon size={20} color="#0C2340" />
            </View>
            <Text style={styles.menuItemText}>Dark Mode</Text>
            <Switch 
              trackColor={{ false: '#D1D5DB', true: '#0C2340' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
              value={false}
            />
          </View>
          
          <View style={styles.menuItem}>
            <View style={styles.menuIconContainer}>
              <Download size={20} color="#0C2340" />
            </View>
            <Text style={styles.menuItemText}>Download over WiFi only</Text>
            <Switch 
              trackColor={{ false: '#D1D5DB', true: '#0C2340' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#D1D5DB"
              value={true}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          
          <View style={styles.storageInfo}>
            <View style={styles.storageHeader}>
              <View style={styles.menuIconContainer}>
                <HardDrive size={20} color="#0C2340" />
              </View>
              <Text style={styles.storageText}>Documents Storage</Text>
            </View>
            
            <View style={styles.storageBar}>
              <View style={[styles.storageBarFill, { width: '64%' }]} />
            </View>
            
            <Text style={styles.storageDetails}>3.2 GB used of 5 GB</Text>
          </View>
          
          <View style={styles.offlineAccess}>
            <View style={styles.offlineHeader}>
              <View style={styles.menuIconContainer}>
                {Platform.OS !== 'web' ? (
                  <WifiOff size={20} color="#0C2340" />
                ) : (
                  <Wifi size={20} color="#0C2340" />
                )}
              </View>
              <Text style={styles.offlineText}>Offline Access</Text>
            </View>
            
            <Text style={styles.offlineDetails}>
              {Platform.OS !== 'web' 
                ? '42 documents available offline'
                : 'Offline access not available on web'}
            </Text>
            
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.manageButton}>
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <LogOut size={20} color="#E53935" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
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
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C2340',
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    marginLeft: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0C2340',
  },
  userRole: {
    fontSize: 16,
    color: '#7A869A',
    marginTop: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#7A869A',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C2340',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  menuItemAction: {
    fontSize: 16,
    color: '#7A869A',
  },
  storageInfo: {
    paddingVertical: 12,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageText: {
    fontSize: 16,
    color: '#333333',
  },
  storageBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#0C2340',
    borderRadius: 4,
  },
  storageDetails: {
    fontSize: 14,
    color: '#7A869A',
    marginTop: 8,
  },
  offlineAccess: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 16,
    color: '#333333',
  },
  offlineDetails: {
    fontSize: 14,
    color: '#7A869A',
    marginLeft: 48,
    marginBottom: 12,
  },
  manageButton: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 48,
  },
  manageButtonText: {
    color: '#0C2340',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  logoutText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    color: '#7A869A',
    fontSize: 14,
    marginBottom: 24,
  },
});