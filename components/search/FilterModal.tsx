import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { X } from 'lucide-react-native';
import { useState, useEffect } from 'react';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters: {
    fileTypes: string[];
    dateRange: { start: Date | null; end: Date | null };
    authors: string[];
  };
}

export default function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
  const [fileTypes, setFileTypes] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  
  // Available file types and authors (in a real app, these would come from an API)
  const availableFileTypes = ['pdf', 'image', 'video', 'audio', 'document', 'spreadsheet', 'presentation'];
  const availableAuthors = ['John Doe', 'Jane Smith', 'Robert Johnson', 'Emily Davis', 'Michael Wilson'];
  
  useEffect(() => {
    if (visible) {
      // Initialize with the current filters
      setFileTypes(initialFilters.fileTypes);
      setAuthors(initialFilters.authors);
      setDateRange(initialFilters.dateRange);
    }
  }, [visible, initialFilters]);
  
  const handleToggleFileType = (fileType: string) => {
    setFileTypes(prev => {
      if (prev.includes(fileType)) {
        return prev.filter(type => type !== fileType);
      } else {
        return [...prev, fileType];
      }
    });
  };
  
  const handleToggleAuthor = (author: string) => {
    setAuthors(prev => {
      if (prev.includes(author)) {
        return prev.filter(a => a !== author);
      } else {
        return [...prev, author];
      }
    });
  };
  
  const handleApply = () => {
    onApply({
      fileTypes,
      dateRange,
      authors,
    });
  };
  
  const handleReset = () => {
    setFileTypes([]);
    setAuthors([]);
    setDateRange({ start: null, end: null });
  };
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Filter</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={20} color="#0C2340" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.content}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>File Type</Text>
                  <View style={styles.optionsContainer}>
                    {availableFileTypes.map(type => (
                      <TouchableOpacity 
                        key={type}
                        style={[
                          styles.optionButton,
                          fileTypes.includes(type) && styles.optionButtonSelected
                        ]}
                        onPress={() => handleToggleFileType(type)}
                      >
                        <Text 
                          style={[
                            styles.optionText,
                            fileTypes.includes(type) && styles.optionTextSelected
                          ]}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Author</Text>
                  <View style={styles.optionsContainer}>
                    {availableAuthors.map(author => (
                      <TouchableOpacity 
                        key={author}
                        style={[
                          styles.optionButton,
                          authors.includes(author) && styles.optionButtonSelected
                        ]}
                        onPress={() => handleToggleAuthor(author)}
                      >
                        <Text 
                          style={[
                            styles.optionText,
                            authors.includes(author) && styles.optionTextSelected
                          ]}
                        >
                          {author}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Date Range</Text>
                  <Text style={styles.datePickerNotice}>
                    Date picker functionality would be implemented here
                  </Text>
                </View>
              </ScrollView>
              
              <View style={styles.footer}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={handleReset}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={handleApply}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C2340',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C2340',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#0C2340',
  },
  optionText: {
    fontSize: 14,
    color: '#7A869A',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  datePickerNotice: {
    color: '#7A869A',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#0C2340',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#0C2340',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});