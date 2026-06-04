import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Alert, Animated, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";
import { AntDesign, Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function PersonalDetail({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, personalInfoData, error } = useSelector((state) => state.client);
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

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

  // Helper component for detail rows
  const DetailRow = ({ icon: Icon, iconName, label, value, iconType = Feather }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ 
        fontSize: 11, 
        fontFamily: 'Lato-SemiBold', 
        color: '#6B7280', 
        marginBottom: 6,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
      }}>
        {label}
      </Text>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
      }}>
        <Icon name={iconName} size={18} color="#9CA3AF" style={{ marginRight: 10 }} />
        <Text style={{ 
          color: '#374151', 
          fontSize: 14, 
          fontFamily: 'Lato-Medium',
          flex: 1
        }}>
          {value || "Not provided"}
        </Text>
      </View>
    </View>
  );

  const InfoCard = ({ title, children }) => (
    <View style={{ 
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      // shadowColor: '#000',
      // shadowOffset: { width: 0, height: 2 },
      // shadowOpacity: 0.05,
      // shadowRadius: 8,
      // elevation: 2,
    }}>
      <Text style={{ 
        fontSize: 16, 
        fontWeight: '600', 
        color: Style.headerBgColor,
        marginBottom: 16,
        fontFamily: 'Lato-Bold'
      }}>
        {title}
      </Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      {/* Header Section */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ 
              width: 44, 
              height: 44, 
              justifyContent: 'center', 
              alignItems: 'center',
              borderRadius: 22,
              backgroundColor: 'rgba(255,255,255,0.15)'
            }}
          >
            <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ 
            color: '#fff', 
            fontSize: 18, 
            fontWeight: '600', 
            flex: 1, 
            textAlign: 'center',
            fontFamily: 'Lato-Bold'
          }}>
            Personal Details
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Content Section */}
      <Animated.View style={{ 
        flex: 1, 
        backgroundColor: Style.primaryBgColor || '#F3F4F6',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 24,
        transform: [{ translateY: slideAnim }]
      }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
            <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>Loading details...</Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* Profile Header Card */}
            <View style={{ 
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              alignItems: 'center',
              // shadowColor: '#000',
              // shadowOffset: { width: 0, height: 2 },
              // shadowOpacity: 0.08,
              // shadowRadius: 12,
              // elevation: 3,
            }}>
              <View style={{ 
                width: 100, 
                height: 100, 
                borderRadius: 50, 
                borderWidth: 3, 
                borderColor: Style.headerBgColor,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
                overflow: 'hidden'
              }}>
                <Image 
                  source={personalInfoData?.profileImage ? { uri: personalInfoData.profileImage } : require('../../../assets/userIcon.jpeg')} 
                  resizeMode="cover" 
                  style={{ width: 94, height: 94 }} 
                />
              </View>
              <Text style={{ 
                fontSize: 20, 
                color: Style.headerBgColor, 
                fontFamily: 'Lato-Bold',
                marginBottom: 4
              }}>
                {personalInfoData?.fullName || "Unknown"}
              </Text>
              <Text style={{ 
                color: '#6B7280', 
                fontSize: 14, 
                fontFamily: 'Lato-Medium' 
              }}>
                Code: {personalInfoData?.userName || "username"}
                {/* @code: {personalInfoData?.userName || "username"} */}
              </Text>
            </View>

            {/* Personal Details Section */}
            <InfoCard title="Personal Information">
              <DetailRow 
                icon={Feather} 
                iconName="phone" 
                label="Phone Number" 
                value={`${personalInfoData?.mobile?.code || ""} ${personalInfoData?.mobile?.number || "No number available"}`}
              />
              <DetailRow 
                icon={Feather} 
                iconName="mail" 
                label="Email Address" 
                value={personalInfoData?.email || "No email available"}
              />
              <DetailRow 
                icon={Feather} 
                iconName="map-pin" 
                label="Address" 
                value={fullAddress}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <DetailRow 
                    icon={Feather} 
                    iconName="calendar" 
                    label="Joining Date" 
                    value={moment(personalInfoData?.clientProfile?.dateOfJoining).format('DD MMM YYYY') || "Not available"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DetailRow 
                    icon={Feather} 
                    iconName="calendar" 
                    label="Date of Birth" 
                    value={moment(personalInfoData?.generalInfo?.dateOfBirth).format('DD MMM YYYY') || "Not available"}
                  />
                </View>
              </View>
            </InfoCard>

            {/* Business Details Section */}
            <InfoCard title="Business Information">
              <DetailRow 
                icon={MaterialIcons} 
                iconName="business" 
                label="Organization Type" 
                value={personalInfoData?.organizationName || "Not provided"}
              />
              <DetailRow 
                icon={MaterialIcons} 
                iconName="factory" 
                label="Industry Type" 
                value={personalInfoData?.industryName || "Not provided"}
              />
            </InfoCard>

            {/* Tax & ID Details Section */}
            <InfoCard title="Tax & Identification">
              <DetailRow 
                icon={Ionicons} 
                iconName="document-text" 
                label="GST Number" 
                value={personalInfoData?.clientProfile?.GSTNumber || "Not provided"}
              />
              <DetailRow 
                icon={Ionicons} 
                iconName="card" 
                label="PAN Card Number" 
                value={personalInfoData?.clientProfile?.penNumber || "Not provided"}
              />
              <DetailRow 
                icon={Ionicons} 
                iconName="id-card" 
                label="Aadhar Card Number" 
                value={personalInfoData?.clientProfile?.adharNumber || "Not provided"}
              />
            </InfoCard>
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}