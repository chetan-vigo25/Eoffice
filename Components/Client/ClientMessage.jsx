import React, { useState, useEffect } from 'react';
import {
  StyleSheet, SafeAreaView, View, Text, StatusBar,
  Linking, ScrollView, Image, TouchableOpacity, ToastAndroid,
  ActivityIndicator
} from "react-native";
import SelectDropdown from 'react-native-select-dropdown';
import AsyncStorage from "@react-native-async-storage/async-storage";

import BASE_URL from '../../Urls/DomainUrl';
import Style from '../../Style/Style';
import { Entypo, FontAwesome } from "@expo/vector-icons";

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function ClientMessage({ navigation }) {
  const [departmentData, setDepartmentData] = useState([]); // ✅ Always initialized as empty array
  const [listData, setListData] = useState([]);
  const [defaultListData, setDefaultListData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    defaultmsgToList();
  }, []);

  const initiateWhatsApp = (item) => {
    const phoneNumber = `${item?.userData?.mobile?.code}${item?.userData?.mobile?.number}`;
    const url = 'whatsapp://send?text=' + phoneNumber;
    Linking.openURL(url).catch(() => {
      alert('Make sure WhatsApp is installed on your device');
    });
  };

  const defaultmsgToList = async () => {
    setIsLoading(true);
    const token = await AsyncStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/client/department/support/list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "",
        sort: true,
        status: "",
        departmentId: "",
        isPagination: false
      })
    });

    const result = await response.json();

    if (result.statusCode === 200) {
      const docs = result?.data?.docs || [];
      setDefaultListData(docs);

      const uniqueDepartments = docs
        .filter((item) => item?.departmentData)
        .map((item) => item.departmentData);

      setDepartmentData(uniqueDepartments);
      msgToList('');
    } else {
      showToast(result.message || 'Failed to load data');
    }

    setIsLoading(false);
  };

  const msgToList = async (departmentId) => {
    setIsLoading(true);
    const token = await AsyncStorage.getItem("token");

    const response = await fetch(`${BASE_URL}/client/department/support/list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "",
        sort: true,
        status: "",
        departmentId: departmentId,
        isPagination: false
      })
    });

    const result = await response.json();

    if (result.statusCode === 200) {
      setListData(result?.data?.docs || []);
    } else {
      showToast(result.message || 'Error fetching department data');
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={'#6a8ff3'} barStyle='light-content' />
      <View style={{ width: '100%', padding: 20 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontFamily: 'Poppins-SemiBold' }}>Message</Text>
      </View>

      <View style={{ flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

          {/* Dropdown */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={defaultmsgToList}
              style={styles.allButton}
            >
              <Text style={styles.allButtonText}>ALL</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ flex: 1, height: 50 }}>
              <SelectDropdown
                data={departmentData && departmentData.length > 0
                  ? departmentData
                  : [{ name: 'No Departments...' }]}
                onSelect={(item) => {
                  if (item?._id) {
                    msgToList(item._id);
                    showToast(`Selected: ${item.name}`);
                  }
                }}
                disabled={departmentData.length === 0}
                renderButton={(selectedItem, isOpened) => (
                  <View style={styles.dropdownButtonStyle}>
                    <Text style={styles.dropdownButtonTxtStyle}>
                      {selectedItem?.name || 'Select Department'}
                    </Text>
                    <Entypo
                      name={isOpened ? 'chevron-up' : 'chevron-down'}
                      style={styles.dropdownButtonArrowStyle}
                    />
                  </View>
                )}
                renderItem={(item, index, isSelected) => (
                  <View style={{
                    ...styles.dropdownItemStyle,
                    ...(isSelected && { backgroundColor: '#D2D9DF' })
                  }}> 
                    <Text style={styles.dropdownItemTxtStyle}>{item.name}</Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                dropdownStyle={styles.dropdownMenuStyle}
              />
            </TouchableOpacity>
          </View>

          {/* List */}
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 30 }} />
          ) : (
            (listData.length > 0 ? listData : defaultListData).map((item, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={item?.userData?.profileImage ? { uri: item.userData.profileImage } : require('../../assets/userIcon.jpeg')}
                    style={styles.avatarImage}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item?.userData?.fullName}</Text>
                  <Text style={styles.departmentName}>{item?.departmentData?.name}</Text>
                </View>
                <TouchableOpacity onPress={() => initiateWhatsApp(item)} style={styles.whatsappButton}>
                  <FontAwesome name="whatsapp" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))
          )}

          {!isLoading && listData.length === 0 && defaultListData.length === 0 && (
            <Text style={styles.noDataText}>No Data Found</Text>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  allButton: {
    width: 110,
    paddingHorizontal: 10,
    height: 50,
    backgroundColor: '#658Eff10',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Style.headerBgColor
  },
  allButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Style.primaryTextColor
  },
  dropdownButtonStyle: {
    width: "100%",
    height: 50,
    backgroundColor: '#b6b6b610',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d6d6d6'
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Style.headerBgColor
  },
  dropdownButtonArrowStyle: {
    fontSize: 28
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8
  },
  dropdownItemStyle: {
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  dropdownItemTxtStyle: {
    fontSize: 18,
    fontWeight: '500',
    color: Style.placeHolderTextColor
  },
  listItem: {
    flexDirection: 'row',
    gap: 15,
    borderBottomWidth: 1,
    borderColor: '#d6d6d6',
    paddingVertical: 15
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 100,
    borderColor: Style.headerBgColor
  },
  avatarImage: {
    width: 45,
    height: 45,
    borderRadius: 100
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: Style.primaryTextColor
  },
  departmentName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: Style.secondryTextColor
  },
  whatsappButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: Style.headerBgColor
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: Style.secondryTextColor,
    textAlign: 'center',
    paddingVertical: 20
  }
});