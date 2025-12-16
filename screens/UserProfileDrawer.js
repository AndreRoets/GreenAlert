import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { loadFromStorage } from '../services/storage';

export default function UserProfileDrawer({ isVisible, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (isVisible) {
        setLoading(true);
        const session = await loadFromStorage('userSession');
        if (session && !session.isGuest) {
          // In a real app, you might fetch this from an API using session.userId
          // For now, we assume it was saved during profile setup.
          const profile = await loadFromStorage('currentUser');
          setUser(profile);
        } else {
          setUser({ firstName: 'Guest', lastName: 'User', email: 'No email' });
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isVisible]);

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#000000" />;
    }

    if (!user) {
      return <Text style={styles.infoText}>Could not load user profile.</Text>;
    }

    return (
      <>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.firstName?.[0] || 'G'}</Text>
          </View>
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        {/* You can add more profile items here, like "Settings", "Logout", etc. */}
      </>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.drawerContainer}>
          <SafeAreaView style={{ flex: 1 }}>
            {renderContent()}
          </SafeAreaView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContainer: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});