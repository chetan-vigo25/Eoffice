import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Animated, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { AntDesign, Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function ContactDetail({ navigation }) {
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

  const contactInfo = personalInfoData?.clientProfile?.contactInfo || {};

  // Helper component for detail rows
  const DetailRow = ({ icon: Icon, iconName, label, value, iconType = Feather, multiline = false }) => (
    <View style={{ marginBottom: 20 }}>
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
        alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: multiline ? 14 : 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 48
      }}>
        <Icon name={iconName} size={18} color="#9CA3AF" style={{ marginRight: 12, marginTop: multiline ? 2 : 0 }} />
        <Text style={{
          color: '#374151',
          fontSize: 14,
          fontFamily: 'Lato-Medium',
          flex: 1,
          lineHeight: multiline ? 20 : undefined
        }}>
          {value || "Not provided"}
        </Text>
      </View>
    </View>
  );

  const PhoneNumberRow = ({ code, number }) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={{
        fontSize: 11,
        fontFamily: 'Lato-SemiBold',
        color: '#6B7280',
        marginBottom: 6,
        letterSpacing: 0.5,
        textTransform: 'uppercase'
      }}>
        Phone Number
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{
          flex: 1.5,
          backgroundColor: '#F9FAFB',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 12
        }}>
          <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>
            {code || "+XX"}
          </Text>
        </View>
        <View style={{
          flex: 8,
          backgroundColor: '#F9FAFB',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          justifyContent: 'center',
          paddingHorizontal: 14,
          paddingVertical: 12
        }}>
          <Text style={{ color: '#374151', fontSize: 14 }}>
            {number || "No number available"}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      {/* Header */}
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
            Contact Details
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Content */}
      <Animated.View style={{
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 24,
        transform: [{ translateY: slideAnim }]
      }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
            <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>
              Loading contact details...
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            {/* Profile Header */}
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
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Style.headerBgColor + '10',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <Feather name="user" size={40} color={Style.headerBgColor} />
              </View>
              <Text style={{
                fontSize: 20,
                color: Style.headerBgColor,
                fontFamily: 'Lato-Bold',
                marginBottom: 4
              }}>
                {personalInfoData?.fullName || "No name available"}
              </Text>
              <Text style={{
                color: '#6B7280',
                fontSize: 13,
                fontFamily: 'Lato-Medium'
              }}>
                Contact Information
              </Text>
            </View>

            {/* Contact Details Card */}
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              // shadowColor: '#000',
              // shadowOffset: { width: 0, height: 2 },
              // shadowOpacity: 0.06,
              // shadowRadius: 10,
              // elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: Style.headerBgColor,
                  borderRadius: 2
                }} />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Style.headerBgColor,
                  fontFamily: 'Lato-Bold'
                }}>
                  Contact Information
                </Text>
              </View>

              {/* Email */}
              <DetailRow
                icon={Feather}
                iconName="mail"
                label="Email Address"
                value={contactInfo?.email}
              />

              {/* Designation */}
              <DetailRow
                icon={MaterialIcons}
                iconName="work"
                label="Designation"
                value={contactInfo?.designation}
              />

              {/* Phone Number */}
              <PhoneNumberRow
                code={contactInfo?.code}
                number={contactInfo?.number}
              />
            </View>

            {/* Quick Actions */}
            {contactInfo?.email && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  marginBottom: 12
                }}
                onPress={() => {
                  // Add email action - e.g., open email app
                  Alert.alert('Send Email', `Send email to ${contactInfo.email}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Send', onPress: () => console.log('Send email to', contactInfo.email) }
                  ]);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Feather name="mail" size={20} color={Style.headerBgColor} />
                  <Text style={{ color: '#374151', fontSize: 14, fontFamily: 'Lato-Medium' }}>
                    Send Email
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {contactInfo?.number && (
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: '#E5E7EB'
                }}
                onPress={() => {
                  Alert.alert('Call', `Call ${contactInfo.number}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Call', onPress: () => console.log('Calling', contactInfo.number) }
                  ]);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Feather name="phone" size={20} color={Style.headerBgColor} />
                  <Text style={{ color: '#374151', fontSize: 14, fontFamily: 'Lato-Medium' }}>
                    Call Now
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}