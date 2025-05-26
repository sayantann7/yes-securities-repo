import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Search as SearchIcon, Filter, FileText, X } from 'lucide-react-native';
import { useDebounce } from '@/hooks/useDebounce';
import DocumentSearchItem from '@/components/document/DocumentSearchItem';
import { searchDocuments } from '@/services/documentService';
import { Document } from '@/types';
import FilterModal from '@/components/search/FilterModal';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    fileTypes: string[];
    dateRange: { start: Date | null; end: Date | null };
    authors: string[];
  }>({
    fileTypes: [],
    dateRange: { start: null, end: null },
    authors: [],
  });
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  useEffect(() => {
    if (debouncedSearchQuery.trim() === '') {
      setResults([]);
      return;
    }
    
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const searchResults = await searchDocuments(debouncedSearchQuery, activeFilters);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        // Handle error state
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [debouncedSearchQuery, activeFilters]);
  
  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };
  
  const applyFilters = (filters: any) => {
    setActiveFilters(filters);
    setShowFilterModal(false);
  };
  
  const removeFileTypeFilter = (fileType: string) => {
    setActiveFilters(prev => ({
      ...prev,
      fileTypes: prev.fileTypes.filter(type => type !== fileType)
    }));
  };
  
  const removeAuthorFilter = (author: string) => {
    setActiveFilters(prev => ({
      ...prev,
      authors: prev.authors.filter(a => a !== author)
    }));
  };
  
  const clearDateFilter = () => {
    setActiveFilters(prev => ({
      ...prev,
      dateRange: { start: null, end: null }
    }));
  };
  
  const clearAllFilters = () => {
    setActiveFilters({
      fileTypes: [],
      dateRange: { start: null, end: null },
      authors: [],
    });
  };
  
  const hasActiveFilters = () => {
    return (
      activeFilters.fileTypes.length > 0 || 
      activeFilters.authors.length > 0 || 
      activeFilters.dateRange.start !== null || 
      activeFilters.dateRange.end !== null
    );
  };
  
  const renderFilterChips = () => {
    if (!hasActiveFilters()) return null;
    
    return (
      <View style={styles.filterChipsContainer}>
        {activeFilters.fileTypes.map(fileType => (
          <TouchableOpacity 
            key={fileType} 
            style={styles.filterChip}
            onPress={() => removeFileTypeFilter(fileType)}
          >
            <Text style={styles.filterChipText}>Type: {fileType}</Text>
            <X size={14} color="#0C2340" />
          </TouchableOpacity>
        ))}
        
        {activeFilters.authors.map(author => (
          <TouchableOpacity 
            key={author} 
            style={styles.filterChip}
            onPress={() => removeAuthorFilter(author)}
          >
            <Text style={styles.filterChipText}>By: {author}</Text>
            <X size={14} color="#0C2340" />
          </TouchableOpacity>
        ))}
        
        {(activeFilters.dateRange.start || activeFilters.dateRange.end) && (
          <TouchableOpacity 
            style={styles.filterChip}
            onPress={clearDateFilter}
          >
            <Text style={styles.filterChipText}>
              Date: {activeFilters.dateRange.start?.toLocaleDateString() || 'Any'} - {activeFilters.dateRange.end?.toLocaleDateString() || 'Any'}
            </Text>
            <X size={14} color="#0C2340" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.clearAllButton}
          onPress={clearAllFilters}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon color="#7A869A" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents, folders, content..."
            placeholderTextColor="#7A869A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X color="#7A869A" size={18} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter color="#0C2340" size={20} />
        </TouchableOpacity>
      </View>
      
      {renderFilterChips()}
      
      <View style={styles.resultsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0C2340" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : results.length > 0 ? (
          <>
            <Text style={styles.resultsCount}>{results.length} results found</Text>
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DocumentSearchItem document={item} searchTerm={searchQuery} />
              )}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : searchQuery.trim() !== '' ? (
          <View style={styles.emptyResultsContainer}>
            <FileText size={48} color="#D1D5DB" />
            <Text style={styles.noResultsText}>No documents found</Text>
            <Text style={styles.noResultsSubtext}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          <View style={styles.startSearchContainer}>
            <SearchIcon size={48} color="#D1D5DB" />
            <Text style={styles.startSearchText}>Start searching</Text>
            <Text style={styles.startSearchSubtext}>Enter keywords to find documents, folders, or content</Text>
          </View>
        )}
      </View>
      
      <FilterModal 
        visible={showFilterModal} 
        onClose={() => setShowFilterModal(false)}
        onApply={applyFilters}
        initialFilters={activeFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C2340',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#7A869A',
    marginBottom: 12,
  },
  resultsList: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7A869A',
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C2340',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#7A869A',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  startSearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startSearchText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C2340',
    marginTop: 16,
  },
  startSearchSubtext: {
    fontSize: 14,
    color: '#7A869A',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 13,
    color: '#0C2340',
    marginRight: 6,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  clearAllText: {
    fontSize: 13,
    color: '#0C2340',
    fontWeight: '500',
  },
});