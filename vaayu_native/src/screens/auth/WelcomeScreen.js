import React, { useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, 
  Dimensions, Animated, StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Sequential animations
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const WeatherIcon = ({ name, size, color, style }) => (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Weather Icons Background */}
      <View style={styles.weatherIconsBackground}>
        <WeatherIcon name="partly-sunny" size={60} color="rgba(255,255,255,0.1)" style={styles.icon1} />
        <WeatherIcon name="rainy" size={40} color="rgba(255,255,255,0.1)" style={styles.icon2} />
        <WeatherIcon name="thunderstorm" size={50} color="rgba(255,255,255,0.1)" style={styles.icon3} />
        <WeatherIcon name="snow" size={35} color="rgba(255,255,255,0.1)" style={styles.icon4} />
        <WeatherIcon name="cloudy" size={45} color="rgba(255,255,255,0.1)" style={styles.icon5} />
        <WeatherIcon name="sunny" size={55} color="rgba(255,255,255,0.1)" style={styles.icon6} />
      </View>

      {/* Content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Animated.View 
            style={[
              styles.logoContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.logoBackground}
            >
              <Ionicons name="partly-sunny" size={80} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
          
          <Text style={styles.appName}>Vaayu</Text>
          <Text style={styles.tagline}>AI Weather & Safety Platform</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="location" size={24} color="#4A90E2" />
            </View>
            <Text style={styles.featureText}>Hyper-local forecasts</Text>
          </View>
          
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="warning" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.featureText}>AI-powered safety alerts</Text>
          </View>
          
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="analytics" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.featureText}>Smart weather predictions</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <BlurView intensity={20} style={styles.blurButton}>
              <Text style={styles.secondaryButtonText}>I have an account</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Protecting Maharashtra with intelligent weather insights
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  weatherIconsBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  icon1: {
    position: 'absolute',
    top: '15%',
    right: '10%',
  },
  icon2: {
    position: 'absolute',
    top: '25%',
    left: '15%',
  },
  icon3: {
    position: 'absolute',
    top: '45%',
    right: '20%',
  },
  icon4: {
    position: 'absolute',
    top: '60%',
    left: '10%',
  },
  icon5: {
    position: 'absolute',
    top: '35%',
    left: '75%',
  },
  icon6: {
    position: 'absolute',
    top: '70%',
    right: '15%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  featuresSection: {
    width: '100%',
    marginBottom: 50,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  buttonsSection: {
    width: '100%',
    marginBottom: 40,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  secondaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  blurButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default WelcomeScreen;
