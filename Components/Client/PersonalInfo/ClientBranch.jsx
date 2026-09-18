import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, ScrollView, ActivityIndicator, Modal, FlatList } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";
import BASE_URL from "../../../Urls/DomainUrl";

// Branches whose address carries no state still have to be reachable, otherwise the
// per-state counts silently add up to less than the total shown in the header.
const NO_STATE = '__no_state__';

const normalizeState = value => (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// The form takes the state as free text, so one branch can carry several of them
// ("Nagpur, Maharashtra"). Each entry becomes its own row in the filter.
const splitStates = value =>
  (value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
const isShouting = value => value === value.toUpperCase() && value !== value.toLowerCase();

// A branch stores its state as free text, so the same place arrives spelled several
// ways ("Himach", "tamilnadu"). Expand it to the master spelling when that is
// unambiguous, and otherwise keep exactly what the branch has — a wrong full name
// would be worse than a short one.
const makeStateResolver = masterNames => {
  const byName = new Map();
  masterNames.forEach(name => {
    const key = normalizeState(name);
    if (key && !byName.has(key)) byName.set(key, name);
  });

  return raw => {
    const value = (raw || '').trim();
    if (!value) return '';

    const key = normalizeState(value);
    const sameName = byName.get(key);
    // Master holds a few all-caps entries (GOA, ODISHA) — don't shout them back
    if (sameName) return isShouting(sameName) ? value : sameName;

    if (key.length >= 4) {
      const completions = masterNames.filter(name => {
        const candidate = normalizeState(name);
        return candidate.length > key.length && candidate.startsWith(key);
      });
      if (completions.length === 1) return completions[0];
    }
    return value;
  };
};

export default function ClientBranch({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading, personalInfoData } = useSelector((state) => state.client);
  const [slideAnim] = useState(new Animated.Value(30));
  const [selectedState, setSelectedState] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [masterStates, setMasterStates] = useState([]);

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

  // Only used to spell the branches' own states out in full
  const fetchStates = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/master/others/state/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPagination: false, text: "", countryName: "India", sort: true, status: true }),
      });
      const result = await response.json();
      if (result.statusCode === 200) {
        setMasterStates((result.data?.docs || []).map(s => s.name).filter(Boolean));
      }
    } catch (error) {
      console.log('Error fetching states:', error);
    }
  };

  const branchData = personalInfoData?.branchData || [];

  const resolveState = makeStateResolver(masterStates);
  // Resolve once and reuse, so the filter can never disagree with the list counts.
  // A branch listing two states belongs to both, so this is a list per branch.
  const branchStates = branchData.map(branch => {
    const resolved = splitStates(branch.addresses?.primary?.state).map(resolveState).filter(Boolean);
    // "Delhi, delhi" is one place, not two
    const seen = new Set();
    return resolved.filter(name => {
      const key = normalizeState(name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  // Re-resolve the selection too: it may have been picked before the master list
  // arrived, when the same state still went by its short spelling.
  const resolvedSelection =
    selectedState && selectedState !== NO_STATE ? resolveState(selectedState) : selectedState;

  const filteredBranches = selectedState
    ? branchData.filter((branch, index) => {
        const states = branchStates[index];
        return selectedState === NO_STATE
          ? states.length === 0
          : states.some(state => normalizeState(state) === normalizeState(resolvedSelection));
      })
    : branchData;

  const selectedStateLabel = selectedState === NO_STATE ? 'Not Specified' : resolvedSelection;

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

  // States come from the branches themselves, so the list only ever shows places
  // the client actually has a branch in — no empty rows, and no dependency on the
  // master-state spelling matching what is saved on the branch.
  const stateOptions = (() => {
    const groups = new Map();
    let missing = 0;
    branchStates.forEach(states => {
      if (states.length === 0) {
        missing += 1;
        return;
      }
      states.forEach(name => {
        const key = normalizeState(name);
        const existing = groups.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          groups.set(key, { _id: name, name, count: 1 });
        }
      });
    });
    const options = Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
    // Keep the odd ones out at the bottom so the counts always reconcile with the total
    if (missing > 0) {
      options.push({ _id: NO_STATE, name: 'Not Specified', count: missing });
    }
    return options;
  })();

  const listItems = [
    { _id: '__all__', name: 'All States', count: branchData.length },
    ...stateOptions,
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
            {selectedState ? ` in ${selectedStateLabel}` : ' Total'}
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
              {selectedStateLabel || 'All States'}
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
                      const isSelected =
                        item._id === '__all__'
                          ? selectedState === null
                          : item._id === NO_STATE
                            ? selectedState === NO_STATE
                            : normalizeState(resolvedSelection) === normalizeState(item._id);
                      return (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedState(item._id === '__all__' ? null : item._id);
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
                              name={
                                item._id === '__all__'
                                  ? 'earth'
                                  : item._id === NO_STATE
                                    ? 'map-marker-off-outline'
                                    : 'map-marker-outline'
                              }
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
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
                  No branches available in {selectedStateLabel}
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
