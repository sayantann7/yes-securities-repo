import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { X, Edit2, Trash2, Bookmark, BookmarkCheck } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

interface FileActionModalProps {
  visible: boolean;
  onClose: () => void;
  itemName: string;
  itemType: 'folder' | 'file';
  itemId: string;
  isBookmarked?: boolean;
  onRename: (newName: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onBookmark: () => Promise<void>;
}

export default function FileActionModal({
  visible,
  onClose,
  itemName,
  itemType,
  itemId,
  isBookmarked = false,
  onRename,
  onDelete,
  onBookmark,
}: FileActionModalProps) {
  const { user } = useAuth();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(itemName);
  const [isLoading, setIsLoading] = useState(false);

  const handleRename = () => {
    setNewName(itemName);
    setIsRenaming(true);
  };

  const handleRenameConfirm = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (newName === itemName) {
      setIsRenaming(false);
      return;
    }

    try {
      setIsLoading(true);
      await onRename(newName.trim());
      setIsRenaming(false);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to rename. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      `Delete ${itemType}`,
      `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await onDelete();
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    if (isRenaming) {
      setIsRenaming(false);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: Colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>
              {isRenaming ? `Rename ${itemType}` : `${itemName}`}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isRenaming ? (
            <View style={styles.renameContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: Colors.surfaceVariant,
                    color: Colors.text,
                    borderColor: Colors.borderLight,
                  },
                ]}
                value={newName}
                onChangeText={setNewName}
                placeholder={`Enter ${itemType} name`}
                placeholderTextColor={Colors.textSecondary}
                autoFocus
                selectTextOnFocus
              />
              <View style={styles.renameActions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setIsRenaming(false)}
                  disabled={isLoading}
                >
                  <Text style={[styles.buttonText, { color: Colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton, { backgroundColor: Colors.primary }]}
                  onPress={handleRenameConfirm}
                  disabled={isLoading}
                >
                  <Text style={[styles.buttonText, { color: 'white' }]}>
                    {isLoading ? 'Renaming...' : 'Rename'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={onBookmark}
                disabled={isLoading}
              >
                {isBookmarked ? (
                  <BookmarkCheck size={20} color={Colors.primary} />
                ) : (
                  <Bookmark size={20} color={Colors.primary} />
                )}
                <Text style={[styles.actionText, { color: Colors.text }]}>
                  {isBookmarked ? 'Remove bookmark' : 'Bookmark'} {itemType}
                </Text>
              </TouchableOpacity>

              {user?.role === 'admin' && (
                <>
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={handleRename}
                    disabled={isLoading}
                  >
                    <Edit2 size={20} color={Colors.primary} />
                    <Text style={[styles.actionText, { color: Colors.text }]}>
                      Rename {itemType}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={handleDelete}
                    disabled={isLoading}
                  >
                    <Trash2 size={20} color="#FF6B6B" />
                    <Text style={[styles.actionText, { color: '#FF6B6B' }]}>
                      Delete {itemType}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: Math.min(width - 40, 400),
    borderRadius: 16,
    padding: 0,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  renameContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  confirmButton: {
    // backgroundColor will be set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
