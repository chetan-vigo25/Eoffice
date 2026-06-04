import React, { useContext, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { IMAGE_FILEPATH_URL } from '../../../../Urls/DomainUrl';
import { UserContext } from '../../../../Context/UserProvider';

export default function EmployeHeader({ navigation, userData: propUserData }) {
  const { userData: contextUserData } = useContext(UserContext);
  const userData = propUserData || contextUserData;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const firstName = (userData?.fullName || 'User').split(' ')[0];

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.greetRow}>
          <Text style={styles.wave}>👋</Text>
          <Text style={styles.greeting}>{greeting},</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {firstName}
        </Text>
        {!!userData?.designation && (
          <Text style={styles.role} numberOfLines={1}>
            {userData.designation}
          </Text>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('EmployeProfile')}
        style={styles.avatarRing}
      >
        <View style={styles.avatarInner}>
          <Image
            key={userData?.profileImage}
            source={
              userData?.profileImage
                ? { uri: `${IMAGE_FILEPATH_URL}/${userData.profileImage}` }
                : require('../../../../assets/userIcon.jpeg')
            }
            style={styles.avatarImg}
          />
        </View>
        <View style={styles.statusDot} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  greetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wave: {
    fontSize: 14,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: '#9aa0b4',
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Lato-SemiBold',
    color: '#1f2440',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  role: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#658eff',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#f1f3fb',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
