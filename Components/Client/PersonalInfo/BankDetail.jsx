import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Animated, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { AntDesign, Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function BankDetail({ navigation }) {
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

  const bankData = personalInfoData?.bankData?.[0] || {};
  const hasBankDetails = bankData?.accountNumber || bankData?.bankName || bankData?.ifscCode;

  // Helper component for detail rows
  const DetailRow = ({ icon: Icon, iconName, label, value, iconType = Feather, isCopyable = false }) => (
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
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Icon name={iconName} size={18} color="#9CA3AF" style={{ marginRight: 12 }} />
          <Text style={{
            color: '#374151',
            fontSize: 14,
            fontFamily: 'Lato-Medium',
            flex: 1,
          }}>
            {value || "Not provided"}
          </Text>
        </View>
        {isCopyable && value && (
          <TouchableOpacity
            onPress={() => {
              // Add copy functionality here
              Alert.alert('Copy', `${label} copied to clipboard`);
            }}
            style={{ padding: 4 }}
          >
            <Feather name="copy" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
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
            Bank Details
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
              Loading bank details...
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
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
                <FontAwesome5 name="university" size={36} color={Style.headerBgColor} />
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
                Banking Information
              </Text>
            </View>

            {/* Bank Details Card */}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 }}>
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
                  Account Information
                </Text>
              </View>

              {hasBankDetails ? (
                <>
                  {/* Account Number */}
                  <DetailRow
                    icon={FontAwesome5}
                    iconName="credit-card"
                    label="Account Number"
                    value={bankData?.accountNumber}
                    isCopyable={true}
                  />

                  {/* Bank Name */}
                  <DetailRow
                    icon={FontAwesome5}
                    iconName="university"
                    label="Bank Name"
                    value={bankData?.bankName}
                  />

                  {/* IFSC Code */}
                  <DetailRow
                    icon={MaterialIcons}
                    iconName="code"
                    label="IFSC Code"
                    value={bankData?.ifscCode?.toUpperCase()}
                    isCopyable={true}
                  />

                  {/* Branch Name */}
                  <DetailRow
                    icon={Feather}
                    iconName="map-pin"
                    label="Branch Name"
                    value={bankData?.branchName}
                  />
                </>
              ) : (
                <View style={{
                  alignItems: 'center',
                  paddingVertical: 40,
                  paddingHorizontal: 20,
                }}>
                  <View style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: '#F3F4F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16
                  }}>
                    <FontAwesome5 name="university" size={30} color="#9CA3AF" />
                  </View>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: 8
                  }}>
                    No Bank Details Found
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#6B7280',
                    textAlign: 'center',
                    lineHeight: 20
                  }}>
                    Please add your bank account information{'\n'}
                    for seamless transactions
                  </Text>
                </View>
              )}
            </View>

            {/* Additional Info Card (if bank details exist) */}
            {hasBankDetails && bankData?.ifscCode && (
              <View style={{
                backgroundColor: '#F0FDF4',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderWidth: 1,
                borderColor: '#D1FAE5'
              }}>
                <Feather name="shield" size={24} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#065F46', marginBottom: 2 }}>
                    Verified Account
                  </Text>
                  <Text style={{ fontSize: 11, color: '#047857' }}>
                    Your bank account is verified and active
                  </Text>
                </View>
              </View>
            )}

          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}