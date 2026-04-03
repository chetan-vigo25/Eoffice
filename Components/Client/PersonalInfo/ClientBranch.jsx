import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, SafeAreaView, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";

import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

export default function ClientBranch({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, personalInfoData } = useSelector((state) => state.client);
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
          dispatch(logout());
          await AsyncStorage.clear();
          navigation.replace("Autologin");
        } else {
          dispatch(personalInfo());
        }
      } catch (error) {
        console.log('Error checking token:', error);
      }
    };
    checkTokenAndFetchData();
  }, [dispatch]);

  const branchData = personalInfoData?.branchData || [];

  const InfoRow = ({ icon, label, value }) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 }}>
      <Feather name={icon} size={14} color={Style.secondryTextColor} style={{ marginRight: 10, marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{label}</Text>
        <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginTop: 2 }}>{value || '-'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
      <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold', flex: 1 }}>Client Branches</Text>
      </View>

      <Animated.View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopStartRadius: 20, borderTopEndRadius: 20, paddingTop: 16, paddingHorizontal: 16, transform: [{ translateY: slideAnim }] }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
          </View>
        ) : branchData.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {branchData.map((branch, index) => (
              <View
                key={branch._id || index}
                style={{
                  backgroundColor: Style.basicbgColor,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                }}
              >
                {/* Branch Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee' }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: `${Style.headerBgColor}15`,
                    justifyContent: 'center', alignItems: 'center', marginRight: 12,
                  }}>
                    <MaterialCommunityIcons name="office-building-outline" size={20} color={Style.headerBgColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>{branch.fullName || branch.name || 'Branch'}</Text>
                    {branch.branchCode ? (
                      <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 2 }}>Code: {branch.branchCode}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Branch Details */}
                {branch.email ? <InfoRow icon="mail" label="Email" value={branch.email} /> : null}
                {branch.mobile?.number ? (
                  <InfoRow icon="phone" label="Phone" value={`${branch.mobile?.code || ''} ${branch.mobile?.number}`} />
                ) : null}
                {branch.addresses?.primary ? (
                  <InfoRow
                    icon="map-pin"
                    label="Address"
                    value={[
                      branch.addresses.primary.street,
                      branch.addresses.primary.city,
                      branch.addresses.primary.state,
                      branch.addresses.primary.pinCode,
                      branch.addresses.primary.country,
                    ].filter(Boolean).join(', ')}
                  />
                ) : null}
                {branch.GSTNumber ? <InfoRow icon="file-text" label="GST Number" value={branch.GSTNumber} /> : null}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="office-building-outline" size={50} color="#ccc" />
            <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginTop: 12 }}>No Branches Found</Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
