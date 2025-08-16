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
import { Document, Folder } from '@/types';
import { searchAll, SearchItem } from '@/services/searchService';
import FilterModal from '@/components/search/FilterModal';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function SearchScreen() {
  const colors = Colors;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Array<SearchItem>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | 'files' | 'folders'>('all');
  const [activeFilters, setActiveFilters] = useState<{ fileTypes: string[] }>({
    fileTypes: [],
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
  const filtersPayload: any = { fileTypes: activeFilters.fileTypes };
        const searchResults = await searchAll(debouncedSearchQuery, typeFilter, filtersPayload, 150);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [debouncedSearchQuery, activeFilters, typeFilter]);
  
  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };
  
  const applyFilters = (filters: { fileTypes: string[] }) => {
    setActiveFilters(filters);
    setShowFilterModal(false);
  };
  
  const removeFileTypeFilter = (fileType: string) => {
    setActiveFilters(prev => ({
      ...prev,
      fileTypes: prev.fileTypes.filter(type => type !== fileType)
    }));
  };
  
  const clearAllFilters = () => {
  setActiveFilters({ fileTypes: [] });
  };
  
  const hasActiveFilters = () => activeFilters.fileTypes.length > 0;
  
  const renderFilterChips = () => {
    if (!hasActiveFilters()) return null;
    
    return (
      <View style={[styles.filterChipsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {activeFilters.fileTypes.map(fileType => (
          <TouchableOpacity 
            key={fileType} 
            style={[styles.filterChip, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => removeFileTypeFilter(fileType)}
          >
            <Text style={[styles.filterChipText, { color: colors.primary }]}>Type: {fileType}</Text>
            <X size={14} color={colors.primary} />
          </TouchableOpacity>
        ))}
        
  {/* date and author filters removed */}
        
        <TouchableOpacity 
          style={styles.clearAllButton}
          onPress={clearAllFilters}
        >
          <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.primary }]}>Search</Text>
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderRadius: 12, margin: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
          <SearchIcon color={colors.textSecondary} size={20} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search documents, folders, content..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X color={colors.textSecondary} size={18} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: colors.background }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>
      
      {renderFilterChips()}
      
  <View style={styles.resultsContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching...</Text>
          </View>
        ) : results.length > 0 ? (
          <>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>{results.length} results found</Text>
            <FlatList
              data={results}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const last = item.key.replace(/^\/+/, '').replace(/\/+$/, '').split('/').pop() || item.key;
                if (item.type === 'folder') {
                  return (
                    <TouchableOpacity
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
                      onPress={() => router.push(`/folder/${encodeURIComponent(item.key)}`)}
                    >
                      <Text style={{ color: colors.text, fontWeight: '600' }}>{last}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Folder</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <DocumentSearchItem
                    document={{ id: item.key, name: last, type: 'file', size: 'Unknown', url: '', createdAt: item.lastModified || new Date().toISOString(), author: 'Unknown', folderId: null }}
                    searchTerm={searchQuery}
                    onPress={() => router.push(`/document/${encodeURIComponent(item.key)}`)}
                  />
                );
              }}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : searchQuery.trim() !== '' ? (
          <View style={styles.emptyResultsContainer}>
            <FileText size={48} color={colors.textSecondary} />
            <Text style={[styles.noResultsText, { color: colors.primary }]}>No results found</Text>
            <Text style={[styles.noResultsSubtext, { color: colors.textSecondary }]}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          <View style={styles.startSearchContainer}>
            <SearchIcon size={48} color={colors.textSecondary} />
            <Text style={[styles.startSearchText, { color: colors.primary }]}>Start searching</Text>
            <Text style={[styles.startSearchSubtext, { color: colors.textSecondary }]}>Enter keywords to find documents or folders</Text>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 8,
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
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
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
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
    marginTop: 16,
  },
  startSearchSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 13,
    marginRight: 6,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
});