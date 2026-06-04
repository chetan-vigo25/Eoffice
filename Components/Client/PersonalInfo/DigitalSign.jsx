import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Animated, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import moment from "moment";

import { AntDesign, Feather, Entypo, MaterialIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function DigitalSign({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, personalInfoData, error } = useSelector((state) => state.client);
  const [image, setImage] = useState(null);
  const [imageName, setImageName] = useState(null);
  const [slideAnim] = useState(new Animated.Value(30));

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant permission to access media library");
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const { uri, type } = result.assets[0];
        const fileName = uri.split('/').pop();
        const fileInfo = await FileSystem.getInfoAsync(uri);
        setImage(uri);
        setImageName(fileName);
      } else {
        console.log("No image selected");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

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

  const signatureData = personalInfoData?.signatureData?.[0] || {};
  const hasSignature = signatureData?.name || signatureData?.createdAt;

  // Helper component for info rows
  const InfoRow = ({ icon: Icon, iconName, label, value, iconType = Feather, onPress, buttonIcon }) => (
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
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F9FAFB',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
          borderWidth: 1,
          borderColor: '#E5E7EB',
        }}
      >
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
        {buttonIcon && (
          <Feather name={buttonIcon} size={18} color="#9CA3AF" />
        )}
      </TouchableOpacity>
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
            Digital Signature
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
              Loading signature details...
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
                <MaterialIcons name="draw" size={36} color={Style.headerBgColor} />
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
                Digital Signature Information
              </Text>
            </View>

            {/* Signature Details Card */}
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
                  Signature Details
                </Text>
              </View>

              {hasSignature ? (
                <>
                  {/* Signature File */}
                  <InfoRow
                    icon={Feather}
                    iconName="file-text"
                    label="Signature Document"
                    value={imageName || signatureData?.name}
                    onPress={pickImage}
                    buttonIcon="upload"
                  />

                  {/* Upload Date */}
                  <InfoRow
                    icon={Feather}
                    iconName="calendar"
                    label="Upload Date"
                    value={moment(signatureData?.createdAt).format('DD MMM YYYY')}
                    buttonIcon={null}
                  />

                  {/* Signature Preview (if image selected) */}
                  {image && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={{
                        fontSize: 11,
                        fontFamily: 'Lato-SemiBold',
                        color: '#6B7280',
                        marginBottom: 8,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase'
                      }}>
                        Preview
                      </Text>
                      <View style={{
                        backgroundColor: '#F9FAFB',
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        alignItems: 'center'
                      }}>
                        <Image
                          source={{ uri: image }}
                          style={{
                            width: 200,
                            height: 100,
                            borderRadius: 8,
                            resizeMode: 'contain'
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setImage(null);
                            setImageName(null);
                          }}
                          style={{
                            marginTop: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: '#FEE2E2',
                            borderRadius: 8
                          }}
                        >
                          <Text style={{ color: '#DC2626', fontSize: 12 }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
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
                    <MaterialIcons name="draw" size={30} color="#9CA3AF" />
                  </View>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: 8
                  }}>
                    No Signature Found
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#6B7280',
                    textAlign: 'center',
                    lineHeight: 20
                  }}>
                    Please upload your digital signature{'\n'}
                    for document verification
                  </Text>
                </View>
              )}
            </View>

            {/* Info Card */}
            <View style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: '#DBEAFE',
              marginBottom: 20
            }}>
              <Feather name="info" size={24} color="#3B82F6" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1E40AF', marginBottom: 2 }}>
                  About Digital Signature
                </Text>
                <Text style={{ fontSize: 11, color: '#1E40AF' }}>
                  Your digital signature is used for secure document verification and authentication purposes.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: Style.headerBgColor,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  shadowColor: Style.headerBgColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                onPress={pickImage}
              >
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>
                  {hasSignature ? 'Update Signature' : 'Upload Signature'}
                </Text>
              </TouchableOpacity> */}

              {hasSignature && (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E5E7EB'
                  }}
                  onPress={() => {
                    Alert.alert('View Signature', 'Would you like to view the full signature document?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'View', onPress: () => console.log('View signature') }
                    ]);
                  }}
                >
                  <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>
                    View Signature
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}