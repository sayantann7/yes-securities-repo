import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView, Alert, Platform, Modal, TextInput } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { 
  User, LogOut, Settings, Bell, Moon, Key, Shield, Download, 
  HardDrive, Wifi, WifiOff
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const colors = Colors[theme];
  
  // Modal state and form
  const [modalVisible, setModalVisible] = useState(false);
  const [newFullname, setNewFullname] = useState(user?.name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');

  useEffect(() => {
    if (modalVisible && user) {
      setNewFullname(user.name);
      setNewEmail(user.email);
    }
  }, [modalVisible]);
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const openEditModal = () => {
    setModalVisible(true);
  };
  
  const handleSave = async () => {
    try {
      await updateProfile(newFullname, newEmail);
      setModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.primary }]}>Profile</Text>
      </View>
      
      <ScrollView>
        <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
          <Image 
            source={{ uri: user?.avatar || `https://avatar.iran.liara.run/username?username=${user?.name.split(' ')[0]}+${user?.name.split(' ')[1]}` }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.primary }]}>{user?.name || 'User Name'}</Text>
            <Text style={[styles.userRole, { color: colors.textSecondary }]}>{user?.role || 'Sales Team'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.surface }]}>  
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Account</Text>
          
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]} onPress={openEditModal}>  
            <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceVariant }]}>  
              <User size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.text }]}>Edit Profile</Text>
            <Text style={[styles.menuItemAction, { color: colors.textSecondary }]}>{'>'}</Text>
          </TouchableOpacity>
          {/* Edit Profile Modal */}
          <Modal visible={modalVisible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}> 
                <Text style={[styles.modalTitle, { color: colors.primary }]}>Edit Profile</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}  
                  placeholder="Full Name"
                  placeholderTextColor={colors.textSecondary}
                  value={newFullname}
                  onChangeText={setNewFullname}
                />
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}  
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  value={newEmail}
                  onChangeText={setNewEmail}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, { backgroundColor: colors.error }]} onPress={() => setModalVisible(false)}>
                    <Text style={[styles.buttonText]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave}>
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Preferences</Text>
          
          <View style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Moon size={20} color={colors.primary} />
            </View>
            <Text style={[styles.menuItemText, { color: colors.text }]}>Dark Mode</Text>
            <Switch 
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.borderLight}
              value={isDarkMode}
              onValueChange={toggleTheme}
            />
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.error }]} 
          onPress={confirmLogout}
        >
          <LogOut size={20} color={colors.error} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 70,
  },
  profileInfo: {
    marginLeft: 20,
  },
  userName: {
    fontSize: 25,
    fontWeight: '600',
  },
  userRole: {
    fontSize: 16,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
  },
  menuItemAction: {
    fontSize: 16,
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
  },
  storageBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  storageDetails: {
    fontSize: 14,
    marginTop: 8,
  },
  offlineAccess: {
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 16,
  },
  offlineDetails: {
    fontSize: 14,
    marginLeft: 48,
    marginBottom: 12,
  },
  manageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginLeft: 48,
  },
  manageButtonText: {
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});