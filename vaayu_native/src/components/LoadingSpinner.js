import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LoadingSpinner = ({ 
  visible = true,
  message = 'Loading...',
  type = 'default', // 'default', 'weather', 'location', 'sync'
  size = 'large',
  overlay = true,
  color = '#4A90E2'
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Continuous spin animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );

      // Pulse animation for weather type
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      spinAnimation.start();
      if (type === 'weather') {
        pulseAnimation.start();
      }

      return () => {
        spinAnimation.stop();
        pulseAnimation.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, type]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getSpinnerIcon = () => {
    switch (type) {
      case 'weather':
        return 'partly-sunny';
      case 'location':
        return 'location';
      case 'sync':
        return 'sync';
      default:
        return 'refresh';
    }
  };

  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 32;
      case 'large':
        return 48;
      case 'xlarge':
        return 64;
      default:
        return 48;
    }
  };

  const getContainerStyle = () => {
    if (overlay) {
      return [styles.overlayContainer, { opacity: fadeValue }];
    }
    return [styles.inlineContainer, { opacity: fadeValue }];
  };

  const getSpinnerComponent = () => {
    if (type === 'dots') {
      return <DotsSpinner color={color} />;
    }

    if (type === 'bars') {
      return <BarsSpinner color={color} />;
    }

    return (
      <Animated.View
        style={[
          styles.spinnerContainer,
          {
            transform: [
              { rotate: spin },
              { scale: type === 'weather' ? pulseValue : 1 },
            ],
          },
        ]}
      >
        <Ionicons
          name={getSpinnerIcon()}
          size={getSpinnerSize()}
          color={color}
        />
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <Animated.View style={getContainerStyle()}>
      {overlay && <View style={styles.backdrop} />}
      
      <View style={styles.contentContainer}>
        {type === 'gradient' ? (
          <LinearGradient
            colors={['#4A90E2', '#357ABD', '#1E5F8B']}
            style={styles.gradientSpinner}
          >
            {getSpinnerComponent()}
          </LinearGradient>
        ) : (
          getSpinnerComponent()
        )}
        
        {message && (
          <Text style={[styles.message, { color }]}>
            {message}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

// Dots Loading Animation Component
const DotsSpinner = ({ color }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      const createDotAnimation = (dot, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.delay(200),
          ])
        );
      };

      Animated.parallel([
        createDotAnimation(dot1, 0),
        createDotAnimation(dot2, 200),
        createDotAnimation(dot3, 400),
      ]).start();
    };

    animateDots();
  }, []);

  const getDotStyle = (animatedValue) => ({
    opacity: animatedValue,
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { backgroundColor: color }, getDotStyle(dot1)]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, getDotStyle(dot2)]} />
      <Animated.View style={[styles.dot, { backgroundColor: color }, getDotStyle(dot3)]} />
    </View>
  );
};

// Bars Loading Animation Component
const BarsSpinner = ({ color }) => {
  const bars = useRef(Array.from({ length: 5 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const animateBars = () => {
      const barAnimations = bars.map((bar, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.timing(bar, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        );
      });

      Animated.parallel(barAnimations).start();
    };

    animateBars();
  }, []);

  return (
    <View style={styles.barsContainer}>
      {bars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            { backgroundColor: color },
            {
              transform: [
                {
                  scaleY: bar.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 24,
    minWidth: 120,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spinnerContainer: {
    marginBottom: 16,
  },
  gradientSpinner: {
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Dots Spinner Styles
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  // Bars Spinner Styles
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'end',
    justifyContent: 'center',
    height: 40,
    marginBottom: 16,
  },
  bar: {
    width: 4,
    height: 40,
    marginHorizontal: 2,
    borderRadius: 2,
  },
});

// Enhanced Loading Spinner with custom animations
export const WeatherLoadingSpinner = ({ visible, message }) => (
  <LoadingSpinner
    visible={visible}
    message={message || 'Getting weather data...'}
    type="weather"
    color="#4A90E2"
  />
);

export const LocationLoadingSpinner = ({ visible, message }) => (
  <LoadingSpinner
    visible={visible}
    message={message || 'Getting your location...'}
    type="location"
    color="#FF6B35"
  />
);

export const SyncLoadingSpinner = ({ visible, message }) => (
  <LoadingSpinner
    visible={visible}
    message={message || 'Syncing data...'}
    type="sync"
    color="#4CAF50"
  />
);

export const DotsLoadingSpinner = ({ visible, message, color }) => (
  <LoadingSpinner
    visible={visible}
    message={message}
    type="dots"
    color={color || '#4A90E2'}
    overlay={false}
  />
);

export const BarsLoadingSpinner = ({ visible, message, color }) => (
  <LoadingSpinner
    visible={visible}
    message={message}
    type="bars"
    color={color || '#4A90E2'}
    overlay={false}
  />
);

export default LoadingSpinner;
