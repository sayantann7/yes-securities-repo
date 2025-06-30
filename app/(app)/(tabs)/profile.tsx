import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, ScrollView, Alert, Platform, Modal, TextInput } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { 
  User, LogOut, Settings, Bell, Moon, Key, Shield, Download, 
  HardDrive, Wifi, WifiOff
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const colors = Colors[theme];
  
  // Modal state and form
  const [modalVisible, setModalVisible] = useState(false);
  const [newFullname, setNewFullname] = useState(user?.name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');

  // Admin Excel import state
  const [selectedAction, setSelectedAction] = useState<'joiners' | 'leavers'>('joiners');
  const [excelFile, setExcelFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

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
  
  // Pick Excel file
  const handlePickExcel = async () => {
    try {
      const result = await (Platform.OS === 'web'
        ? new Promise<any>((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx';
            input.onchange = (e: any) => {
              const file = e.target.files[0];
              resolve({ name: file.name, fileObj: file });
            };
            input.click();
          })
        : DocumentPicker.getDocumentAsync({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      );
      if (result && (result.fileObj || (result.assets && result.assets[0]))) {
        setExcelFile(result.fileObj || result.assets[0]);
        setUploadResult(null);
      }
    } catch (err: unknown) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  // Upload Excel file
  const handleUploadExcel = async () => {
    if (!excelFile) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        formData.append('file', excelFile, excelFile.name);
      } else {
        formData.append('file', {
          uri: excelFile.uri,
          name: excelFile.name,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        } as any);
      }
      formData.append('actionType', selectedAction);
      const response = await fetch('http://192.168.1.35:3000/api/users/import', {
        method: 'POST',
        body: formData,
        headers: Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' },
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadResult({ error: data.error || 'Upload failed', errors: [] });
      } else {
        setUploadResult(data);
        setExcelFile(null);
      }
    } catch (err: any) {
      setUploadResult({ error: err.message || 'Upload failed', errors: [] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.primary }]}>Profile</Text>
      </View>
      
      <ScrollView>
        <View style={[styles.profileSection, { backgroundColor: colors.surface, borderRadius: 12, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
          <Image 
            source={{ uri: user?.avatar || `https://avatar.iran.liara.run/username?username=${user?.name.split(' ')[0]}+${user?.name.split(' ')[1]}` }}
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.primary }]}>{user?.name || 'User Name'}</Text>
            <Text style={[styles.userRole, { color: colors.textSecondary }]}>{user?.role || 'Sales Team'}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || 'user@example.com'}</Text>
          </View>
          <TouchableOpacity onPress={openEditModal} style={styles.editButton}>
            <Text style={{color: colors.primary}}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {/* Admin-only Excel Import Section */}
        {user?.role === 'admin' && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>  
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>Bulk User Import</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Upload an Excel file (.xlsx) with columns <Text style={{ fontWeight: 'bold' }}>fullname</Text> and <Text style={{ fontWeight: 'bold' }}>email</Text>.
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.actionButton, selectedAction === 'joiners' && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedAction('joiners')}
              >
                <Text style={{ color: selectedAction === 'joiners' ? '#fff' : colors.primary, fontWeight: '600' }}>New Joiners</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, selectedAction === 'leavers' && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedAction('leavers')}
              >
                <Text style={{ color: selectedAction === 'leavers' ? '#fff' : colors.primary, fontWeight: '600' }}>Terminations</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.primary, marginBottom: 8 }]}
              onPress={handlePickExcel}
              disabled={uploading}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>{excelFile ? excelFile.name : 'Select Excel File'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.primary }]} 
              onPress={handleUploadExcel}
              disabled={!excelFile || uploading}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>{uploading ? 'Uploading...' : 'Upload'}</Text>
            </TouchableOpacity>
            {uploadResult && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: uploadResult.success ? (colors.success || '#34A853') : colors.error, fontWeight: '600' }}>
                  {uploadResult.success ? `Success: ${uploadResult.success}, Failed: ${uploadResult.failed}` : uploadResult.error}
                </Text>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    {uploadResult.errors.map((err: string, idx: number) => (
                      <Text key={idx} style={{ color: colors.error, fontSize: 12 }}>{err}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        
        {/* <View style={[styles.section, { backgroundColor: colors.surface }]}>
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
        </View> */}
        
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  userRole: {
    fontSize: 16,
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  section: {
    marginTop: 20,
    padding: 20,
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
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4285F4',
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  uploadBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
});