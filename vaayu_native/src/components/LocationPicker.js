import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Modal, FlatList, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import LocationService from '../services/locationService';

const LocationPicker = ({ 
  visible, 
  onClose, 
  onLocationSelect, 
  title = 'Select Location',
  showCurrentLocation = true,
  showSavedLocations = true,
  allowSearch = true 
}) => {
  const { currentLocation, savedLocations, getCurrentLocation } = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('current');

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchLocations(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchLocations = async (query) => {
    setLoading(true);
    try {
      // This would integrate with a geocoding service
      // For demo purposes, returning mock data
      const mockResults = [
        {
          id: '1',
          name: 'Mumbai, Maharashtra',
          address: 'Mumbai, Maharashtra, India',
          latitude: 19.0760,
          longitude: 72.8777,
        },
        {
          id: '2',
          name: 'Pune, Maharashtra',
          address: 'Pune, Maharashtra, India',
          latitude: 18.5204,
          longitude: 73.8567,
        },
        {
          id: '3',
          name: 'Nagpur, Maharashtra',
          address: 'Nagpur, Maharashtra, India',
          latitude: 21.1458,
          longitude: 79.0882,
        },
      ].filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    onLocationSelect(location);
    onClose();
  };

  const handleCurrentLocation = async () => {
    try {
      setLoading(true);
      const location = await getCurrentLocation();
      
      if (location) {
        const formattedLocation = {
          id: 'current',
          name: 'Current Location',
          address: location.address?.formattedAddress || 'Current Location',
          latitude: location.latitude,
          longitude: location.longitude,
          isCurrent: true,
        };
        
        handleLocationSelect(formattedLocation);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentLocationTab = () => (
    <View style={styles.tabContent}>
      {showCurrentLocation && (
        <TouchableOpacity 
          style={styles.locationItem}
          onPress={handleCurrentLocation}
          disabled={loading}
        >
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={24} color="#4A90E2" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationName}>Use Current Location</Text>
            <Text style={styles.locationAddress}>
              {currentLocation?.address?.formattedAddress || 'Get your current location'}
            </Text>
          </View>
          <View style={styles.locationAction}>
            {loading ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSavedLocationsTab = () => (
    <View style={styles.tabContent}>
      {savedLocations.length > 0 ? (
        <FlatList
          data={savedLocations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.locationItem}
              onPress={() => handleLocationSelect(item)}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="bookmark" size={24} color="#FF6B35" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationAddress}>{item.address}</Text>
              </View>
              <View style={styles.locationAction}>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={48} color="#CCC" />
          <Text style={styles.emptyStateTitle}>No Saved Locations</Text>
          <Text style={styles.emptyStateSubtitle}>
            Save locations for quick access to weather information
          </Text>
        </View>
      )}
    </View>
  );

  const renderSearchTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a city or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="words"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.locationItem}
              onPress={() => handleLocationSelect(item)}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="location-outline" size={24} color="#4A90E2" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationAddress}>{item.address}</Text>
              </View>
              <View style={styles.locationAction}>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {searchQuery.length > 2 && searchResults.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#CCC" />
          <Text style={styles.emptyStateTitle}>No Results Found</Text>
          <Text style={styles.emptyStateSubtitle}>
            Try searching with a different location name
          </Text>
        </View>
      )}
    </View>
  );

  const tabs = [
    { id: 'current', label: 'Current', icon: 'location' },
    { id: 'saved', label: 'Saved', icon: 'bookmark' },
    { id: 'search', label: 'Search', icon: 'search' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && styles.activeTab
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={20} 
                color={selectedTab === tab.id ? '#4A90E2' : '#999'} 
              />
              <Text style={[
                styles.tabLabel,
                selectedTab === tab.id && styles.activeTabLabel
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {selectedTab === 'current' && renderCurrentLocationTab()}
          {selectedTab === 'saved' && renderSavedLocationsTab()}
          {selectedTab === 'search' && renderSearchTab()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4A90E2',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginLeft: 6,
  },
  activeTabLabel: {
    color: '#4A90E2',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationAction: {
    padding: 4,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default LocationPicker;
