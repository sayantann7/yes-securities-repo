import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback 
} from 'react-native';
import { Check } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
  currentSort: string;
}

export default function SortModal({ visible, onClose, onSelect, currentSort }: SortModalProps) {
  const sortOptions = [
    { id: 'nameAsc', label: 'Name (A-Z)' },
    { id: 'nameDesc', label: 'Name (Z-A)' },
    { id: 'dateAsc', label: 'Date (Oldest first)' },
    { id: 'dateDesc', label: 'Date (Newest first)' },
    { id: 'typeAsc', label: 'Type (A-Z)' },
    { id: 'typeDesc', label: 'Type (Z-A)' },
  ];
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>        <View style={[styles.modalContainer, { backgroundColor: Colors.surface }]}>
          <Text style={[styles.title, { color: Colors.primary }]}>Sort By</Text>
            
            {sortOptions.map(option => (
              <TouchableOpacity 
                key={option.id}
                style={styles.option}
                onPress={() => onSelect(option.id)}
              >
                <Text style={[styles.optionText, { color: Colors.text }]}>{option.label}</Text>
                {currentSort === option.id && <Check size={20} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionText: {
    fontSize: 16,
  },
});