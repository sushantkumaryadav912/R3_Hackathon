import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';
import NotificationService from '../services/notificationService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser.uid);
        
        // Register for push notifications
        try {
          const pushToken = await NotificationService.registerForPushNotifications();
          if (pushToken) {
            await updateUserPushToken(firebaseUser.uid, pushToken);
          }
        } catch (error) {
          console.log('Push notification registration failed:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing]);

  const loadUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      } else {
        // Create default profile if doesn't exist
        const defaultProfile = {
          id: userId,
          createdAt: new Date(),
          preferences: {
            notifications: {
              weatherAlerts: true,
              severityLevel: 'moderate',
              quietHours: {
                enabled: true,
                start: '22:00',
                end: '06:00',
              },
            },
          },
        };
        
        await setDoc(doc(db, 'users', userId), defaultProfile);
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const updateUserPushToken = async (userId, pushToken) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        pushToken,
        pushTokenUpdatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating push token:', error);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: getAuthErrorMessage(error.code) };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (userData.name) {
        await updateProfile(result.user, {
          displayName: userData.name,
        });
      }

      // Create user profile in Firestore
      const userProfile = {
        id: result.user.uid,
        email: result.user.email,
        name: userData.name || '',
        phone: userData.phone || '',
        createdAt: new Date(),
        preferences: {
          notifications: {
            weatherAlerts: true,
            severityLevel: 'moderate',
            quietHours: {
              enabled: true,
              start: '22:00',
              end: '06:00',
            },
          },
          units: {
            temperature: 'celsius',
            windSpeed: 'kmh',
            pressure: 'hPa',
          },
        },
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: getAuthErrorMessage(error.code) };
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      setLoading(true);
      NotificationService.cleanup();
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...updates,
        updatedAt: new Date(),
      });

      setUserProfile(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  const getAuthErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut: signOutUser,
    updateUserProfile,
    isAuthenticated: !!user,
  };

  if (initializing) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
