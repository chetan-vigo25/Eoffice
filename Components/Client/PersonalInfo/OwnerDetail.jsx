import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";

import { AntDesign, Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function OwnerDetail({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
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

  const ownerDataArray = Array.isArray(personalInfoData?.ownerData)
    ? personalInfoData.ownerData
    : [];

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

  const OwnerCard = ({ owner, index, isLast }) => (
    <View style={{
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      marginBottom: isLast ? 0 : 20,
      overflow: 'hidden',
      // shadowColor: '#000',
      // shadowOffset: { width: 0, height: 2 },
      // shadowOpacity: 0.06,
      // shadowRadius: 12,
      // elevation: 3,
    }}>
      {/* Card Header */}
      <View style={{
        backgroundColor: Style.headerBgColor,
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
      }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.2)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: 'bold' }}>
            {owner?.fullName?.charAt(0) || `O${index + 1}`}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{
            color: '#FFF',
            fontSize: 16,
            fontFamily: 'Lato-Bold'
          }}>
            {owner?.fullName || `Owner ${index + 1}`}
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 12,
            fontFamily: 'Lato-Medium'
          }}>
            Owner #{index + 1}
          </Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={{ padding: 16 }}>
        {/* Email */}
        <DetailRow
          icon={Feather}
          iconName="mail"
          label="Email Address"
          value={owner?.email}
        />

        {/* Date of Birth */}
        <DetailRow
          icon={Feather}
          iconName="calendar"
          label="Date of Birth"
          value={owner?.generalInfo?.dateOfBirth ? moment(owner.generalInfo.dateOfBirth).format('DD MMM YYYY') : null}
        />

        {/* Phone Number with Country Code */}
        <View style={{ marginBottom: 16 }}>
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
          <View style={{
            flexDirection: 'row',
            gap: 10,
          }}>
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
                {owner?.mobile?.code || "+XX"}
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
                {owner?.mobile?.number || "No number available"}
              </Text>
            </View>
          </View>
        </View>

        {/* Address */}
        <View>
          <Text style={{
            fontSize: 11,
            fontFamily: 'Lato-SemiBold',
            color: '#6B7280',
            marginBottom: 6,
            letterSpacing: 0.5,
            textTransform: 'uppercase'
          }}>
            Address
          </Text>
          <View style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            padding: 14,
            flexDirection: 'row',
            gap: 10
          }}>
            <Feather name="map-pin" size={18} color="#9CA3AF" />
            <Text style={{
              color: '#374151',
              fontSize: 13,
              fontFamily: 'Lato-Medium',
              flex: 1,
              lineHeight: 20
            }}>
              {`${owner?.addresses?.primary?.street || "Street not available"}, ${owner?.addresses?.primary?.city || "City not available"}, ${owner?.addresses?.primary?.state || "State not available"} ${owner?.addresses?.primary?.pinCode || "PinCode not available"}, ${owner?.addresses?.primary?.country || "Country not available"}`}
            </Text>
          </View>
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
            Owner's Details
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Content */}
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
            <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 14 }}>
              Loading owner details...
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
          >
            {ownerDataArray.length > 0 ? (
              <>
                {/* Header Stats */}
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  justifyContent: 'space-around',
                  // shadowColor: '#000',
                  // shadowOffset: { width: 0, height: 2 },
                  // shadowOpacity: 0.05,
                  // shadowRadius: 8,
                  // elevation: 2,
                }}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: Style.headerBgColor }}>
                      {ownerDataArray.length}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Total Owners</Text>
                  </View>
                  <View style={{ width: 1, backgroundColor: '#E5E7EB' }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: Style.headerBgColor }}>
                      {ownerDataArray.filter(o => o?.email).length}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>With Email</Text>
                  </View>
                </View>

                {/* Owner Cards */}
                {ownerDataArray.map((owner, index) => (
                  <OwnerCard
                    key={index}
                    owner={owner}
                    index={index}
                    isLast={index === ownerDataArray.length - 1}
                  />
                ))}
              </>
            ) : (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: 60
              }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#F3F4F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <Feather name="users" size={40} color="#9CA3AF" />
                </View>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Style.headerBgColor,
                  marginBottom: 8
                }}>
                  No Owner Details Available
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#6B7280',
                  textAlign: 'center'
                }}>
                  Owner information will appear here{'\n'}once added to the system
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}