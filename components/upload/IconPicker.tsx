import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { X, Upload, Image as ImageIcon } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface IconPickerProps {
  visible: boolean;
  onClose: () => void;
  onIconSelected: (iconUri: string) => void;
  currentIcon?: string;
}

const API_URL = 'http://192.168.1.34:3000/api';

export default function IconPicker({ visible, onClose, onIconSelected, currentIcon }: IconPickerProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(currentIcon || null);
  const [uploading, setUploading] = useState(false);

  const handlePickIcon = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate image type
        if (!asset.mimeType?.startsWith('image/')) {
          Alert.alert('Error', 'Please select a valid image file.');
          return;
        }

        // Validate file size (max 2MB)
        if (asset.size && asset.size > 2 * 1024 * 1024) {
          Alert.alert('Error', 'Image size must be less than 2MB.');
          return;
        }

        setSelectedIcon(asset.uri);
      }
    } catch (error) {
      console.error('Error picking icon:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleSave = async () => {
    if (!selectedIcon) {
      onClose();
      return;
    }

    try {
      setUploading(true);
      onIconSelected(selectedIcon);
      onClose();
    } catch (error) {
      console.error('Error saving icon:', error);
      Alert.alert('Error', 'Failed to save icon.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveIcon = () => {
    setSelectedIcon(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: Colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>
              Select Icon
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconPreview}>
              {selectedIcon ? (
                <Image source={{ uri: selectedIcon }} style={styles.previewImage} />
              ) : (
                <View style={[styles.placeholder, { backgroundColor: Colors.surfaceVariant }]}>
                  <ImageIcon size={48} color={Colors.textSecondary} />
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.pickButton, { backgroundColor: Colors.primary }]}
                onPress={handlePickIcon}
                disabled={uploading}
              >
                <Upload size={20} color="white" />
                <Text style={[styles.buttonText, { color: 'white' }]}>
                  Pick Image
                </Text>
              </TouchableOpacity>

              {selectedIcon && (
                <TouchableOpacity
                  style={[styles.button, styles.removeButton]}
                  onPress={handleRemoveIcon}
                  disabled={uploading}
                >
                  <Text style={[styles.buttonText, { color: Colors.error }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.saveActions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={uploading}
              >
                <Text style={[styles.buttonText, { color: Colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton, { backgroundColor: Colors.primary }]}
                onPress={handleSave}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={[styles.buttonText, { color: 'white' }]}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  iconPreview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E1E1E1',
    borderStyle: 'dashed',
  },
  actions: {
    alignItems: 'center',
    marginBottom: 24,
  },
  saveActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickButton: {
    gap: 8,
  },
  removeButton: {
    backgroundColor: 'transparent',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    minWidth: 80,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
