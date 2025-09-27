import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text } from 'react-native';
import { useNotification } from '../context/NotificationContext';

// Weather Stack Screens
import WeatherHomeScreen from '../screens/weather/WeatherHomeScreen';
import AlertDetailsScreen from '../screens/weather/AlertDetailsScreen';
import WeatherMapScreen from '../screens/weather/WeatherMapScreen';

// Locations Stack Screens
import SavedLocationsScreen from '../screens/locations/SavedLocationsScreen';
import AddLocationScreen from '../screens/locations/AddLocationScreen';

// Alerts Stack Screens
import AlertHistoryScreen from '../screens/alerts/AlertHistoryScreen';
import AlertSettingsScreen from '../screens/alerts/AlertSettingsScreen';

// Profile Stack Screens
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigators
const WeatherStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#4A90E2',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="WeatherHome" 
      component={WeatherHomeScreen}
      options={{ title: 'Weather' }}
    />
    <Stack.Screen 
      name="AlertDetails" 
      component={AlertDetailsScreen}
      options={{ title: 'Alert Details' }}
    />
    <Stack.Screen 
      name="WeatherMap" 
      component={WeatherMapScreen}
      options={{ title: 'Weather Map' }}
    />
  </Stack.Navigator>
);

const LocationsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FF6B35',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="SavedLocations" 
      component={SavedLocationsScreen}
      options={{ title: 'My Locations' }}
    />
    <Stack.Screen 
      name="AddLocation" 
      component={AddLocationScreen}
      options={{ title: 'Add Location' }}
    />
  </Stack.Navigator>
);

const AlertsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FF4444',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="AlertHistory" 
      component={AlertHistoryScreen}
      options={{ title: 'Alerts' }}
    />
    <Stack.Screen 
      name="AlertSettings" 
      component={AlertSettingsScreen}
      options={{ title: 'Alert Settings' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#4CAF50',
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ProfileHome" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Stack.Navigator>
);

// Custom Tab Bar Badge Component
const TabBarBadge = ({ count }) => {
  if (!count || count === 0) return null;
  
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count.toString()}
      </Text>
    </View>
  );
};

const MainNavigator = () => {
  const { unreadCount } = useNotification();

  return (
    <Tab.Navigator
      initialRouteName="Weather"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Weather':
              iconName = focused ? 'partly-sunny' : 'partly-sunny-outline';
              break;
            case 'Locations':
              iconName = focused ? 'location' : 'location-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'warning' : 'warning-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return (
            <View style={styles.tabIconContainer}>
              <Ionicons name={iconName} size={size} color={color} />
              {route.name === 'Alerts' && <TabBarBadge count={unreadCount} />}
            </View>
          );
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Weather" 
        component={WeatherStack}
        options={{ title: 'Weather' }}
      />
      <Tab.Screen 
        name="Locations" 
        component={LocationsStack}
        options={{ title: 'Locations' }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsStack}
        options={{ title: 'Alerts' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default MainNavigator;
