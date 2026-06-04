import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, ScrollView, ActivityIndicator, Modal, FlatList } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";
import BASE_URL from "../../../Urls/DomainUrl";

export default function ClientBranch({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, personalInfoData } = useSelector((state) => state.client);
  const [slideAnim] = useState(new Animated.Value(30));
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

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
    fetchStates();
  }, [dispatch]);

  const fetchStates = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/master/others/state/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPagination: false, text: "", countryName: "India", sort: true, status: true }),
      });
      const result = await response.json();
      if (result.statusCode === 200) {
        setStates(result.data?.docs || []);
      }
    } catch (error) {
      console.log('Error fetching states:', error);
    }
  };

  const branchData = personalInfoData?.branchData || [];

  const filteredBranches = selectedState
    ? branchData.filter(branch => branch.addresses?.primary?.state === selectedState)
    : branchData;

  const InfoRow = ({ icon, label, value }) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 }}>
      <View style={{
        width: 30, height: 30, borderRadius: 8,
        backgroundColor: `${Style.headerBgColor}12`,
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
      }}>
        <Feather name={icon} size={13} color={Style.headerBgColor} />
      </View>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{label}</Text>
        <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginTop: 1 }}>{value || '-'}</Text>
      </View>
    </View>
  );

  const listItems = [
    { _id: '__all__', name: 'All States', count: branchData.length },
    ...states.map(s => ({
      _id: s._id,
      name: s.name,
      count: branchData.filter(b => b.addresses?.primary?.state === s.name).length,
    })),
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />

      {/* Header */}
      <View style={{ flexDirection: 'row', width: '100%', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}
        >
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold' }}>Client Branches</Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Lato-Medium', marginTop: 2 }}>
            {filteredBranches.length} {filteredBranches.length === 1 ? 'Branch' : 'Branches'}
            {selectedState ? ` in ${selectedState}` : ' Total'}
          </Text>
        </View>
        {/* Total badge */}
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 6,
          alignItems: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold', lineHeight: 20 }}>{branchData.length}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, fontFamily: 'Lato-Medium' }}>Total</Text>
        </View>
      </View>

      <Animated.View style={{
        flex: 1,
        backgroundColor: Style.primaryBgColor,
        borderTopStartRadius: 20,
        borderTopEndRadius: 20,
        paddingTop: 16,
        transform: [{ translateY: slideAnim }],
      }}>

        {/* State Dropdown */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setDropdownVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Style.basicbgColor,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: selectedState ? Style.headerBgColor : '#e0e0e0',
              paddingHorizontal: 14,
              paddingVertical: 11,
            }}
          >
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={18}
              color={selectedState ? Style.headerBgColor : Style.secondryTextColor}
              style={{ marginRight: 8 }}
            />
            <Text style={{
              flex: 1,
              fontSize: 14,
              fontFamily: 'Lato-SemiBold',
              color: selectedState ? Style.primaryTextColor : Style.secondryTextColor,
            }}>
              {selectedState || 'All States'}
            </Text>
            {selectedState && (
              <TouchableOpacity
                onPress={() => setSelectedState(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginRight: 6 }}
              >
                <AntDesign name="closecircle" size={15} color={Style.secondryTextColor} />
              </TouchableOpacity>
            )}
            <AntDesign name="down" size={13} color={Style.secondryTextColor} />
          </TouchableOpacity>
        </View>

        {/* State List Modal */}
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity activeOpacity={1}>
                <View style={{
                  backgroundColor: Style.basicbgColor,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 12,
                  maxHeight: 460,
                }}>
                  {/* Modal Handle */}
                  <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 14 }} />

                  {/* Modal Title */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                  }}>
                    <MaterialCommunityIcons name="map-marker-multiple-outline" size={18} color={Style.headerBgColor} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, flex: 1 }}>
                      Filter by State
                    </Text>
                    <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                      <AntDesign name="close" size={18} color={Style.secondryTextColor} />
                    </TouchableOpacity>
                  </View>

                  {/* List Items */}
                  <FlatList
                    data={listItems}
                    keyExtractor={item => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 8 }}
                    renderItem={({ item }) => {
                      const isSelected = item._id === '__all__' ? selectedState === null : selectedState === item.name;
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedState(item._id === '__all__' ? null : item.name);
                            setDropdownVisible(false);
                          }}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 13,
                            backgroundColor: isSelected ? `${Style.headerBgColor}08` : 'transparent',
                          }}
                        >
                          <View style={{
                            width: 34, height: 34, borderRadius: 10,
                            backgroundColor: isSelected ? `${Style.headerBgColor}18` : '#f5f5f5',
                            justifyContent: 'center', alignItems: 'center', marginRight: 12,
                          }}>
                            <MaterialCommunityIcons
                              name={item._id === '__all__' ? 'earth' : 'map-marker-outline'}
                              size={17}
                              color={isSelected ? Style.headerBgColor : Style.secondryTextColor}
                            />
                          </View>
                          <Text style={{
                            flex: 1,
                            fontSize: 14,
                            fontFamily: isSelected ? 'Lato-SemiBold' : 'Lato-Medium',
                            color: isSelected ? Style.primaryTextColor : Style.basicTextColor,
                          }}>
                            {item.name}
                          </Text>
                          <View style={{
                            backgroundColor: isSelected ? `${Style.headerBgColor}18` : '#f0f0f0',
                            borderRadius: 10,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            marginRight: 10,
                          }}>
                            <Text style={{
                              fontSize: 12,
                              fontFamily: 'Lato-SemiBold',
                              color: isSelected ? Style.headerBgColor : Style.secondryTextColor,
                            }}>
                              {item.count}
                            </Text>
                          </View>
                          {isSelected && (
                            <MaterialCommunityIcons name="check-circle" size={18} color={Style.headerBgColor} />
                          )}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: '#e4e4e4', marginHorizontal: 16, marginBottom: 12 }} />

        {/* Content */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
          </View>
        ) : filteredBranches.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          >
            {filteredBranches.map((branch, index) => (
              <View
                key={branch._id || index}
                style={{
                  backgroundColor: Style.basicbgColor,
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 0.5,
                  borderColor: '#e6e6e6',
                }}
              >
                {/* Branch Header */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottomWidth: 0.5,
                  borderBottomColor: '#f0f0f0',
                }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: `${Style.headerBgColor}12`,
                    justifyContent: 'center', alignItems: 'center', marginRight: 12,
                  }}>
                    <MaterialCommunityIcons name="office-building-outline" size={22} color={Style.headerBgColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>
                      {branch.fullName || branch.name || 'Branch'}
                    </Text>
                    {branch.branchCode ? (
                      <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        <View style={{
                          backgroundColor: `${Style.headerBgColor}12`,
                          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
                        }}>
                          <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.headerBgColor }}>
                            #{branch.branchCode}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>

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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <View style={{
              width: 76, height: 76, borderRadius: 38,
              backgroundColor: `${Style.headerBgColor}10`,
              justifyContent: 'center', alignItems: 'center', marginBottom: 14,
            }}>
              <MaterialCommunityIcons name="office-building-outline" size={38} color={`${Style.headerBgColor}60`} />
            </View>
            <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginBottom: 6 }}>
              No Branches Found
            </Text>
            {selectedState ? (
              <>
                <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, textAlign: 'center', marginBottom: 18 }}>
                  No branches available in {selectedState}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedState(null)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: Style.headerBgColor,
                    paddingHorizontal: 22, paddingVertical: 11,
                    borderRadius: 22, flexDirection: 'row', alignItems: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="refresh" size={15} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#fff', fontFamily: 'Lato-SemiBold', fontSize: 14 }}>Show All Branches</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, textAlign: 'center' }}>
                No branch data available
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
