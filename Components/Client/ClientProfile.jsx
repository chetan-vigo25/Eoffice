import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Alert, RefreshControl, Image, TextInput, TouchableWithoutFeedback, Keyboard, Modal, ToastAndroid, ActivityIndicator, Animated, Dimensions } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { io } from 'socket.io-client';
import { useFocusEffect } from '@react-navigation/native';

import BASE_URL from '../../Urls/DomainUrl';
import Style from "../../Style/Style";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function ClientProfile({ navigation, route }) {

    const dispatch = useDispatch();
    const { isLoading, personalInfoData, error } = useSelector((state) => state.client);
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState(null);
    const socketRef = useRef(null);

    // Animations
    const headerAnim = useRef(new Animated.Value(0)).current;
    const cardAnim = useRef(new Animated.Value(40)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cardAnim, {
          toValue: 0,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const pickImages = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        setImages(result.assets[0]);
        uploadFile(result.assets[0]);
      }
    };

    const logoutFun = async () => {
      setLoading(true)
        let token = await AsyncStorage.getItem("token");
        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");

       const requestOptions = {
         method: "POST",
         headers: myHeaders,
         redirect: "follow"
       };

       fetch(`${BASE_URL}/client/auth/logout`, requestOptions)
        .then((response) => response.json())
         .then(async(result) => {
            if(result.statusCode === 200){
                showToast(result.message);
                AsyncStorage.removeItem("token");
                await AsyncStorage.clear();
                navigation.navigate('Splash')
                dispatch(logout());
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Splash' }],
                  });
                setLoading(false);
            } else if(result.statusCode === 401){
                showToast("Session expired. Please log in again.");
                await AsyncStorage.removeItem("token");
                dispatch(logout());
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Splash' }],
                });
                setLoading(false);
                return;
            }else{
                showToast(result.message);
                setLoading(false);
            }
         })
         .catch((error) => console.error(error))
         .finally(() => setLoading(false));
    }

    const uploadFile = async (image) => {
      if (!image) {
        showToast("Please select an image.");
        return;
      }

      try {
        let token = await AsyncStorage.getItem("token");
        const formData = new FormData();
        formData.append("filePath", {
          uri: image.uri,
          name: "profile.jpg",
          type: "image/jpeg",
        });

        formData.append("fileLocation", "/clientImage");
        formData.append("isMultiple", "false");
        formData.append("isVideo", "false");

        const requestOptions = {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        };

        const response = await fetch(`${BASE_URL}/client/auth/fileUpload`, requestOptions);
        const result = await response.json();

        if (result.statusCode === 200) {
          showToast(result.message);
          uploadImage(result.data[0]);
        } else {
          showToast(result.message || "Upload failed.");
        }
      } catch (error) {
        console.error("Upload error:", error);
        showToast("Something went wrong.");
      }
    };

    const uploadImage = async (data) => {
      setLoading(true)
      let token = await AsyncStorage.getItem("token");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        "profileImage": data
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      fetch(`${BASE_URL}/client/auth/update`, requestOptions)
       .then((response) => response.json())
        .then((result) => {
          if(result.statusCode === 200){
            dispatch(personalInfo());
            setLoading(false);
          }else{
            showToast(result.message);
            setLoading(false);
          }
        })
        .catch((error) => console.error(error))
        .finally(()=> setLoading(false));
    };

   useEffect(() => {
     const checkTokenAndFetchData = async () => {
       try {
         const token = await AsyncStorage.getItem('token');
         if (!token) {
           Alert.alert(
           "Error",
           "Session expired. Please log in again.",
           [
             {
               text: "OK",
               onPress: async () => {
                 dispatch(logout());
                 await AsyncStorage.clear();
                 navigation.replace("Autologin");
               }
             }
           ],
       { cancelable: false }
     );
         } else {
           dispatch(personalInfo());
         }
       } catch (error) {
         console.log('Error checking token:', error);
         Alert.alert('Error', 'An error occurred while checking the token.');
       }
     };
     checkTokenAndFetchData();
   }, [dispatch]);

    const { city, country, pinCode, state, street } = personalInfoData?.addresses?.primary || {};
    const fullAddress = `${street || "Street not available"}, ${city || "City not available"}, ${state || "State not available"} ${pinCode || "PinCode not available"}, ${country || "Country not available"}`;

  const handleLogout = async() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      dispatch(logout());
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Splash' }],
      });
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar barStyle="light-content" style="auto" backgroundColor={Style.headerBgColor} />
        <View style={{ flex: 1 }}>
          {/* Header with back button */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Profile Avatar Section */}
          <Animated.View style={[styles.avatarSection, { opacity: headerAnim, transform: [{ scale: headerAnim }] }]}>
            <View style={styles.avatarOuter}>
              <Image
                source={personalInfoData?.profileImage ? { uri: personalInfoData.profileImage } : require('../../assets/userIcon.jpeg')}
                style={styles.avatarImage}
              />
              <TouchableOpacity onPress={pickImages} style={styles.editBadge}>
                <Feather name="camera" size={13} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.profileName}>{personalInfoData?.fullName || "Unknown"}</Text>
            <Text style={styles.profileUsername}>Code: {personalInfoData?.userName || "No username available"}</Text>
          </Animated.View>

          {/* Card Content */}
          <Animated.View style={[styles.cardContainer, { opacity: cardOpacity, transform: [{ translateY: cardAnim }] }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

              {/* Info Fields */}
              <ProfileField icon="user" label="Full Name" value={personalInfoData?.fullName || "No name available"} />

              <View style={styles.phoneRow}>
                <View style={styles.phoneCode}>
                  <Text style={styles.phoneCodeText}>{personalInfoData?.mobile?.code || "-"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <ProfileField icon="phone" label="Phone Number" value={personalInfoData?.mobile?.number || "No number available"} />
                </View>
              </View>

              <ProfileField icon="mail" label="Email Address" value={personalInfoData?.email || "No email available"} />
              <ProfileField icon="map-pin" label="Address" value={fullAddress || "No address available"} />

              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <ProfileField
                    icon="calendar"
                    label="Joining Date"
                    value={moment(personalInfoData?.clientProfile?.dateOfJoining).format('DD/MM/YYYY') || "N/A"}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <ProfileField
                    icon="gift"
                    label="Date of Birth"
                    value={moment(personalInfoData?.generalInfo?.dateOfBirth).format('DD/MM/YYYY') || "N/A"}
                  />
                </View>
              </View>

              {/* Links */}
              <TouchableOpacity onPress={() => navigation.navigate('Privacy')} style={styles.linkButton}>
                <View style={styles.linkIconWrap}>
                  <Feather name="shield" size={16} color={Style.headerBgColor} />
                </View>
                <Text style={styles.linkText}>Privacy Policy</Text>
                <Feather name="chevron-right" size={18} color="#b0b0b0" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('TermCondition')} style={styles.linkButton}>
                <View style={styles.linkIconWrap}>
                  <Feather name="file-text" size={16} color={Style.headerBgColor} />
                </View>
                <Text style={styles.linkText}>Terms & Conditions</Text>
                <Feather name="chevron-right" size={18} color="#b0b0b0" />
              </TouchableOpacity>

            </ScrollView>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(null, "Please confirm to logout!", [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Confirm",
                    onPress: () => {
                      logoutFun();
                      handleLogout();
                    },
                  },
                ]);
              }}
              style={styles.logoutBtn}
              activeOpacity={0.7}
            >
              <Feather name="log-out" size={18} color="#DD3231" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
    </SafeAreaView>
  );
}

// Reusable field component
const ProfileField = ({ icon, label, value }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldBox}>
      <View style={styles.fieldIconWrap}>
        <Feather name={icon} size={15} color={Style.headerBgColor} />
      </View>
      <Text style={styles.fieldValue} numberOfLines={2}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    color: '#fff',
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: 25,
    paddingTop: 5,
  },
  avatarOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatarImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Style.headerBgColor,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Lato-SemiBold',
    marginTop: 12,
    textTransform: 'capitalize',
  },
  profileUsername: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    marginTop: 2,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    color: Style.secondryTextColor,
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fieldIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldValue: {
    flex: 1,
    fontFamily: 'Lato-Medium',
    fontSize: 13,
    color: '#333',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  phoneCode: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  phoneCodeText: {
    fontFamily: 'Lato-SemiBold',
    fontSize: 13,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 10,
    // elevation: 1,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 3,
  },
  linkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontFamily: 'Lato-Medium',
    fontSize: 13,
    color: '#333',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
    elevation: 1,
    // borderWidth: 1,
    // borderColor: '#ffecec',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 0.5,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
    color: '#DD3231',
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});
