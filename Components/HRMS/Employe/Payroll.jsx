import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import BASE_URL from '../../../Urls/DomainUrl';
import { UserContext } from '../../../Context/UserProvider';
import { handleEmployeUnauthorized, isUnauthorized } from '../../../Context/EmployeeAutoLogin';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';

const PRIMARY = '#6a8ff3';
const PRIMARY_DARK = '#4c72d9';
const PRIMARY_TINT = '#eef2ff';
const TEXT_DARK = '#1f2440';
const TEXT_MUTED = '#7c84a3';
const BORDER = '#eef0fa';
const SUCCESS = '#22a06b';
const WARNING = '#e6a400';
const DANGER = '#e94e4e';
const BG = '#f6f7fb';
const PAGE_SIZE = 10;

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) {
      setTimeout(onOk, 2000);
    }
  } else {
    Alert.alert(
      '',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onOk);
          },
        },
      ],
      { cancelable: false }
    );
  }
}

const statusColor = (s) => {
  const str = (s || '').toLowerCase();
  if (str.includes('active') || str.includes('approved') || str.includes('paid')) return SUCCESS;
  if (str.includes('pending') || str.includes('hold')) return WARNING;
  if (str.includes('reject') || str.includes('inactive') || str.includes('unpaid')) return DANGER;
  return PRIMARY_DARK;
};

const formatINR = (n) => {
  if (n === null || n === undefined || n === '') return '₹0';
  try {
    return `₹${Number(n).toLocaleString('en-IN')}`;
  } catch {
    return `₹${n}`;
  }
};

const initialsOf = (name) => {
  if (!name) return '?';
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join('')
      .toUpperCase() || '?'
  );
};

export default function Payroll({ navigation, route }) {
  const { logout } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('StandardPayroll');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [standardData, setStandardData] = useState([]);
  const [actualData, setActualData] = useState([]);

  const [standardVisibleCount, setStandardVisibleCount] = useState(PAGE_SIZE);
  const [actualVisibleCount, setActualVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');

        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          await StandardPayList(parsedData);
          await actualPayList(parsedData);
        }
      } catch (error) {
        console.error('Failed to load userData:', error);
      }
    };

    loadUserData();
  }, []);

  const StandardPayList = async (userDataParam) => {
    setLoading(true);
    try {
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showToast('Authentication token not found');
        setLoading(false);
        setStandardData([]);
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', 'Bearer ' + token);

      const raw = JSON.stringify({
        branchId: userDataParam?.branchId,
        companyId: userDataParam?.companyId,
        directorId: '',
        employeId: userDataParam?._id,
        isPagination: false,
        sort: true,
        status: 'Active',
        text: '',
      });

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };

      const response = await fetch(`${BASE_URL}/admin/employe/payroll/standerd/list`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        setStandardData(result.data.docs || []);
        setStandardVisibleCount(PAGE_SIZE);
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
        setStandardData([]);
      } else {
        showToast(result.message || 'Failed to fetch Standard Payroll data');
        setStandardData([]);
      }
    } catch (error) {
      console.log('Error fetching Standard Payroll data:', error);
      setStandardData([]);
    } finally {
      setLoading(false);
    }
  };

  const actualPayList = async (userDataParam) => {
    setLoading(true);
    try {
      let token = await AsyncStorage.getItem('authToken');
      if (!token) {
        showToast('Authentication token not found');
        setLoading(false);
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', 'Bearer ' + token);

      const raw = JSON.stringify({
        branchId: userDataParam?.branchId,
        companyId: userDataParam?.companyId,
        directorId: '',
        employeId: userDataParam?._id,
        isPagination: false,
        sort: true,
        status: 'Active',
        text: '',
      });

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };

      const response = await fetch(`${BASE_URL}/admin/employe/payroll/list`, requestOptions);
      const result = await response.json();

      if (result.statusCode === 200) {
        setActualData(result.data.docs || []);
        setActualVisibleCount(PAGE_SIZE);
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
        setActualData([]);
      } else {
        showToast(result.message || 'Failed to fetch Actual Payroll data');
        setActualData([]);
      }
    } catch (error) {
      console.log('Error fetching Actual Payroll data:', error);
      setActualData([]);
    } finally {
      setLoading(false);
    }
  };

  const isStandard = activeTab === 'StandardPayroll';
  const sourceData = isStandard ? standardData : actualData;
  const currentVisibleCount = isStandard ? standardVisibleCount : actualVisibleCount;
  const visibleData = sourceData.slice(0, currentVisibleCount);
  const hasMoreData = currentVisibleCount < sourceData.length;

  const handleScroll = (event) => {
    if (isLoadingMore || !hasMoreData) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 120;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isNearBottom) {
      setIsLoadingMore(true);
      setTimeout(() => {
        if (isStandard) {
          setStandardVisibleCount((prev) => Math.min(prev + PAGE_SIZE, standardData.length));
        } else {
          setActualVisibleCount((prev) => Math.min(prev + PAGE_SIZE, actualData.length));
        }
        setIsLoadingMore(false);
      }, 400);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PRIMARY }}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.topTitle}>Payroll Management</Text>
          <Text style={styles.topSubtitle}>Review your salary & payslips</Text>
        </View>
        <View style={styles.headerBadge}>
          <FontAwesome name="rupee" size={16} color="#fff" />
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveTab('StandardPayroll')}
            style={[styles.tabBtn, isStandard && styles.tabBtnActive]}
          >
            <Feather name="file-text" size={14} color={isStandard ? '#fff' : PRIMARY_DARK} />
            <Text style={[styles.tabBtnText, isStandard && styles.tabBtnTextActive]}>
              Standard
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setActiveTab('ActualPayroll')}
            style={[styles.tabBtn, !isStandard && styles.tabBtnActive]}
          >
            <Feather name="credit-card" size={14} color={!isStandard ? '#fff' : PRIMARY_DARK} />
            <Text style={[styles.tabBtnText, !isStandard && styles.tabBtnTextActive]}>
              Actual
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              {isStandard ? 'Standard Payroll' : 'Actual Payroll'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {loading
                ? 'Loading…'
                : `${sourceData.length} record${sourceData.length === 1 ? '' : 's'}`}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {loading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Loading your payroll…</Text>
            </View>
          ) : visibleData.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyImageWrap}>
                <Image
                  source={require('../../../assets/Images/notFound.png')}
                  style={styles.emptyImage}
                />
              </View>
              <Text style={styles.emptyTitle}>No Records</Text>
              <Text style={styles.emptySubtitle}>
                {isStandard
                  ? 'No standard payroll data has been assigned yet'
                  : 'No actual payroll records found'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {isStandard
                ? visibleData.map((item, index) => (
                    <StandardCard key={item._id?.toString() || `s-${index}`} item={item} />
                  ))
                : visibleData.map((item, index) => (
                    <ActualCard
                      key={item._id?.toString() || `a-${index}`}
                      item={item}
                      navigation={navigation}
                    />
                  ))}

              {isLoadingMore && (
                <View style={styles.loadMoreRow}>
                  <ActivityIndicator size="small" color={PRIMARY} />
                  <Text style={styles.loadMoreText}>Loading more…</Text>
                </View>
              )}

              {!isLoadingMore && !hasMoreData && sourceData.length > PAGE_SIZE && (
                <View style={styles.endOfListRow}>
                  <View style={styles.endOfListDivider} />
                  <Text style={styles.endOfListText}>You're all caught up</Text>
                  <View style={styles.endOfListDivider} />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function StandardCard({ item }) {
  const color = statusColor(item.status);
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardHeadLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(item.employeName)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.employeName || '—'}
            </Text>
            <Text style={styles.subText} numberOfLines={1}>
              Created by {item.createdBy || '—'}
            </Text>
          </View>
        </View>
        {!!item.status && (
          <View style={[styles.statusBadge, { backgroundColor: `${color}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{item.status}</Text>
          </View>
        )}
      </View>

      <View style={styles.pairGrid}>
        <View style={styles.pairBox}>
          <View style={styles.pairIconWrap}>
            <Feather name="briefcase" size={14} color={PRIMARY_DARK} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.pairLabel}>BASE SALARY</Text>
            <Text style={styles.pairValue}>{formatINR(item.baseSalary)}</Text>
          </View>
        </View>
        <View style={[styles.pairBox, styles.pairBoxAccent]}>
          <View style={[styles.pairIconWrap, { backgroundColor: '#fff' }]}>
            <Feather name="trending-up" size={14} color={PRIMARY_DARK} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.pairLabel, { color: 'rgba(255,255,255,0.8)' }]}>CTC</Text>
            <Text style={[styles.pairValue, { color: '#fff' }]}>{formatINR(item.ctc)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function ActualCard({ item, navigation }) {
  const color = statusColor(item.status);
  const fullName = item.employeData?.fullName || '—';
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardHeadLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(fullName)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.nameText} numberOfLines={1}>
              {fullName}
            </Text>
            <View style={styles.dateRow}>
              <Feather name="calendar" size={11} color={TEXT_MUTED} />
              <Text style={styles.dateRowText}>
                {moment(item.startDate).format('DD MMM')} — {moment(item.endDate).format('DD MMM YYYY')}
              </Text>
            </View>
          </View>
        </View>
        {!!item.status && (
          <View style={[styles.statusBadge, { backgroundColor: `${color}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{item.status}</Text>
          </View>
        )}
      </View>

      <View style={styles.triGrid}>
        <View style={styles.triBox}>
          <Text style={styles.triLabel}>BASIC</Text>
          <Text style={styles.triValue}>{formatINR(item.basicSalary)}</Text>
        </View>
        <View style={[styles.triBox, styles.triBoxMiddle]}>
          <Text style={styles.triLabel}>GROSS</Text>
          <Text style={styles.triValue}>{formatINR(item.grossSalary)}</Text>
        </View>
        <View style={styles.triBox}>
          <Text style={styles.triLabel}>NET</Text>
          <Text style={[styles.triValue, { color: SUCCESS }]}>{formatINR(item.netSalary)}</Text>
        </View>
      </View>

      <View style={styles.cardFoot}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('EmployePaySlip', { item })}
          style={styles.slipBtn}
        >
          <FontAwesome name="file-text-o" size={12} color="#fff" />
          <Text style={styles.slipBtnText}>View Payslip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  topTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },
  topSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    marginTop: 2,
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    flex: 1,
    backgroundColor: BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  tabBtnText: {
    color: PRIMARY_DARK,
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.2,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
    marginTop: 2,
  },
  loadingText: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    marginTop: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyImageWrap: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    // shadowColor: TEXT_DARK,
    // shadowOpacity: 0.04,
    // shadowOffset: { width: 0, height: 3 },
    // shadowRadius: 8,
    // elevation: 1,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_TINT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe1f5',
  },
  avatarText: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
  },
  nameText: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
    textTransform: 'capitalize',
  },
  subText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  dateRowText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
    textTransform: 'capitalize',
  },

  /* Standard card salary pair */
  pairGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  pairBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafbff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
  },
  pairBoxAccent: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
    // shadowColor: PRIMARY,
    // shadowOpacity: 0.25,
    // shadowOffset: { width: 0, height: 3 },
    // shadowRadius: 6,
    // elevation: 2,
  },
  pairIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: PRIMARY_TINT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairLabel: {
    fontSize: 9,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  pairValue: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
    marginTop: 2,
  },

  /* Actual card salary triplet */
  triGrid: {
    flexDirection: 'row',
    backgroundColor: '#fafbff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 6,
  },
  triBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  triBoxMiddle: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
  },
  triLabel: {
    fontSize: 9,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_MUTED,
    letterSpacing: 0.5,
  },
  triValue: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
    marginTop: 4,
  },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f4fb',
  },
  slipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    // shadowColor: PRIMARY,
    // shadowOpacity: 0.3,
    // shadowOffset: { width: 0, height: 3 },
    // shadowRadius: 6,
    // elevation: 2,
  },
  slipBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },

  /* Infinite scroll footer */
  loadMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadMoreText: {
    color: PRIMARY_DARK,
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },
  endOfListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  endOfListDivider: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  endOfListText: {
    color: '#9aa0b4',
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    letterSpacing: 0.4,
  },
});
