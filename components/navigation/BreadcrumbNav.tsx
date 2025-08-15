import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Home, ChevronRight } from 'lucide-react-native';

interface BreadcrumbNavProps {
  path: Array<{ id: string; name: string }>;
  onHomePress: () => void;
  onItemPress: (id: string) => void;
}

export default function BreadcrumbNav({ path, onHomePress, onItemPress }: BreadcrumbNavProps) {
  if (path.length === 0) return null;
  
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={onHomePress}
        >
          <Home size={16} color="#0C2340" />
        </TouchableOpacity>
        
        <ChevronRight size={16} color="#7A869A" style={styles.separator} />
        
        {path.map((item, index) => (
          <View key={item.id} style={styles.breadcrumbItem}>
            <TouchableOpacity 
              onPress={() => onItemPress(item.id)}
              style={styles.breadcrumbButton}
            >
              <Text 
                style={[
                  styles.breadcrumbText,
                  index === path.length - 1 && styles.currentBreadcrumb
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
            
            {index < path.length - 1 && (
              <ChevronRight size={16} color="#7A869A" style={styles.separator} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
    paddingVertical: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  homeButton: {
    padding: 8,
    backgroundColor: '#F0F4F8',
    borderRadius: 4,
  },
  separator: {
    marginHorizontal: 4,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbButton: {
    padding: 8,
    maxWidth: 160,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#7A869A',
  },
  currentBreadcrumb: {
    color: '#0C2340',
    fontWeight: '500',
  },
});