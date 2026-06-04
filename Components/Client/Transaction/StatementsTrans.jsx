import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, RefreshControl, FlatList, Modal, StyleSheet, StatusBar, ToastAndroid, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

import { AntDesign, Feather, Fontisto } from "@expo/vector-icons";
import Style from "../../../Style/Style";
import BASE_URL from '../../../Urls/DomainUrl';

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

function formatAmount(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN');
}

export default function StatementsTrans({ navigation, route }) {
  const dispatch = useDispatch();
  const { userData } = route.params || {};

  const [scale] = useState(new Animated.Value(0));
  const [activeTab, setActiveTab] = useState('Client');
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);

  const logoutHandled = useRef(false);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogout = useCallback(async () => {
    if (logoutHandled.current) return;
    logoutHandled.current = true;
    showToast('Session expired, please login again');
    dispatch(logout());
    await AsyncStorage.removeItem('token');
    await AsyncStorage.clear();
    navigation.navigate('Autologin');
  }, [dispatch, navigation]);

  // Fetch statement data
  const fetchStatement = async (isRefresh = false, overrides = {}) => {
    if (logoutHandled.current) return;
    if (activeTab === 'Group' && isGroupDisabled) return;
    if (!isRefresh) setLoading(true);

    const sd = 'startDate' in overrides ? overrides.startDate : startDate;
    const ed = 'endDate' in overrides ? overrides.endDate : endDate;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        handleLogout();
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");

      const endpoint = activeTab === 'Client'
        ? `${BASE_URL}/admin/client/statement`
        : `${BASE_URL}/admin/master/client/groupType/statement`;

      const body = {
        _id: activeTab === 'Client' ? userData?._id : userData?.groupId,
        startDate: sd ? moment(sd).format('YYYY-MM-DD') : "",
        endDate: ed ? moment(ed).format('YYYY-MM-DD') : "",
      };

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(body),
        redirect: "follow"
      };

      const response = await fetch(endpoint, requestOptions);
      const result = await response.json();

      // console.log(`[${activeTab} Statement Response]:`, JSON.stringify(result, null, 2));

      if (result.statusCode === 200) {
        setResponseData(result?.data || null);
        // console.log(`[${activeTab} Statement Data]:`, result?.data);
      } else if (result.statusCode === 401) {
        handleLogout();
      } else {
        showToast(result.message || "Something went wrong.");
        setResponseData(null);
      }
    } catch (error) {
      console.error(`[${activeTab} Statement Error]:`, error);
      showToast("Network error. Please try again.");
      setResponseData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStatement();
    }, [activeTab])
  );

  const isGroupDisabled = userData?.isGroupOwner === false;

  // Tab switch
  const switchTab = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setResponseData(null);
    setStartDate('');
    setEndDate('');
    setActiveQuickFilter(null);
  };

  // Derived data
  const clientInfo = responseData || {};
  const transactions = responseData?.allTransactions || responseData?.allTransections || [];
  const summary = responseData?.summary || {};

  // Filters
  const applyFilters = () => {
    setModalVisible(false);
    fetchStatement();
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setActiveQuickFilter(null);
    setModalVisible(false);
    fetchStatement(false, { startDate: '', endDate: '' });
  };

  const applyQuickFilter = (key) => {
    const end = new Date();
    const monthsMap = { '1m': 1, '3m': 3, '6m': 6 };
    const start = moment().subtract(monthsMap[key], 'months').toDate();
    setStartDate(start);
    setEndDate(end);
    setActiveQuickFilter(key);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatement(true);
  };

  // Date picker
  const showDatePicker = (type) => setActiveDatePicker(type);
  const hideDatePicker = () => setActiveDatePicker(null);
  const handleConfirm = (date) => {
    if (activeDatePicker === 'start') setStartDate(date);
    else setEndDate(date);
    setActiveQuickFilter('custom');
    hideDatePicker();
  };

  const formattedStartDate = startDate ? moment(startDate).format("DD/MM/YYYY") : "Start Date";
  const formattedEndDate = endDate ? moment(endDate).format("DD/MM/YYYY") : "End Date";

  // Build address string from client data
  const getAddress = () => {
    const addr = clientInfo?.addresses?.primary;
    if (!addr) return '';
    const parts = [addr.street, addr.city, addr.state, addr.country, addr.pinCode].filter(Boolean);
    return parts.join(', ');
  };

  // Generate PDF - client detail + table matching screenshot format
  const handleDownloadPDF = async () => {
    if (!responseData || transactions.length === 0) {
      showToast("No data to download");
      return;
    }

    try {
      const name = clientInfo.fullName || clientInfo.groupName || 'N/A';
      const email = clientInfo.email || '';
      const phone = clientInfo.mobile ? `${clientInfo.mobile.code || ''}${clientInfo.mobile.number || ''}` : '';
      const address = getAddress();

      let totalDebit = 0;
      let totalCredit = 0;

      const tableRows = transactions.map((txn, idx) => {
        const isDebit = txn.debit_credit === 'debit';
        const debitVal = isDebit ? (Number(txn.amount) || 0) : 0;
        const creditVal = !isDebit ? (Number(txn.amount) || 0) : 0;
        totalDebit += debitVal;
        totalCredit += creditVal;
        const entryDate = txn.date ? moment(txn.date).format('DD-MM-YYYY') : '-';
        const valueDate = txn.date ? moment(txn.updatedAt || txn.date).format('DD-MM-YYYY') : '-';
        const bgColor = idx % 2 === 0 ? '#f9f9f9' : '#fff';
        return `
          <tr style="background:${bgColor}">
            <td>${idx + 1}</td>
            <td>${entryDate}</td>
            <td>${valueDate}</td>
            <td>${txn.naration || txn.typeOf || '-'}</td>
            <td>${txn.refNumber || '-'}</td>
            <td class="right" style="color:#b8860b">${debitVal.toFixed(2)}</td>
            <td class="right" style="color:#b8860b">${creditVal}</td>
            <td class="right">${Number(txn.currentBalance || 0)}</td>
          </tr>`;
      }).join('');

      const lastBalance = transactions.length > 0 ? (Number(transactions[transactions.length - 1].currentBalance) || 0) : 0;

      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Times New Roman', serif; padding: 30px 40px; color: #333; font-size: 13px; }
            h1 { font-size: 22px; font-weight: normal; color: #222; margin: 0 0 20px 0; }
            .info { margin-bottom: 4px; font-size: 13px; color: #444; }
            .info b { color: #222; }
            table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 12px; }
            th { background: #e8e8e8; color: #333; padding: 8px 6px; text-align: left; font-weight: 600; border: 1px solid #ccc; }
            th.right { text-align: right; }
            td { padding: 7px 6px; border: 1px solid #ddd; }
            td.right { text-align: right; }
            .total-row td { font-weight: 700; background: #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>${name} Statement Report</h1>
          ${email ? `<div class="info"><b>Email:</b> ${email}</div>` : ''}
          ${phone ? `<div class="info" style="display:inline"><b>Number:</b> ${phone}</div>` : ''}
          ${address ? `<div class="info"><b>Address:</b> ${address}</div>` : ''}

          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Entry Date</th>
                <th>Value Date</th>
                <th>Particulars</th>
                <th>Ref No.</th>
                <th class="right">Debit</th>
                <th class="right">Credit</th>
                <th class="right">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td></td>
                <td></td>
                <td></td>
                <td>Total Balance</td>
                <td></td>
                <td class="right">${totalDebit.toFixed(2)}</td>
                <td class="right">${totalCredit}</td>
                <td class="right">${lastBalance}</td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const pdfName = `${name.replace(/\s+/g, '_')}_Statement_${moment().format('DDMMYYYY')}`;

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          showToast("Storage permission is required to download PDF.");
          return;
        }
        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const safUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          pdfName,
          'application/pdf'
        );
        await FileSystem.writeAsStringAsync(safUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        showToast("PDF saved to Downloads folder.");
      } else {
        showToast("PDF downloaded successfully.");
      }
    } catch (error) {
      console.error("[PDF Error]:", error);
      showToast("Failed to download PDF");
    }
  };

  // Generate CSV (Excel) - same columns as PDF, no client detail, with total row
  const handleDownloadExcel = async () => {
    if (!responseData || transactions.length === 0) {
      showToast("No data to download");
      return;
    }

    try {
      const name = clientInfo.fullName || clientInfo.groupName || 'Statement';
      // Quote helper to prevent CSV mix-up
      const q = (val) => `"${String(val).replace(/"/g, '""')}"`;

      const csvHeader = `${q('S.No.')},${q('Entry Date')},${q('Value Date')},${q('Particulars')},${q('Ref No.')},${q('Debit')},${q('Credit')},${q('Balance')}\n`;

      let totalDebit = 0;
      let totalCredit = 0;

      const csvRows = transactions.map((txn, idx) => {
        const isDebit = txn.debit_credit === 'debit';
        const debitVal = isDebit ? (Number(txn.amount) || 0) : 0;
        const creditVal = !isDebit ? (Number(txn.amount) || 0) : 0;
        totalDebit += debitVal;
        totalCredit += creditVal;
        const entryDate = txn.date ? moment(txn.date).format('DD-MM-YYYY') : '-';
        const valueDate = txn.date ? moment(txn.updatedAt || txn.date).format('DD-MM-YYYY') : '-';
        const particulars = txn.naration || txn.typeOf || '-';
        const ref = txn.refNumber || '-';
        return `${idx + 1},${q(entryDate)},${q(valueDate)},${q(particulars)},${q(ref)},${debitVal.toFixed(2)},${creditVal},${Number(txn.currentBalance || 0)}`;
      }).join('\n');

      const lastBalance = transactions.length > 0 ? (Number(transactions[transactions.length - 1].currentBalance) || 0) : 0;
      const totalRow = `,,,"Total Balance",,${totalDebit.toFixed(2)},${totalCredit},${lastBalance}`;

      const csvContent = csvHeader + csvRows + '\n' + totalRow;
      const csvName = `${name.replace(/\s+/g, '_')}_Statement_${moment().format('DDMMYYYY')}.csv`;
      const tempUri = `${FileSystem.documentDirectory}${csvName}`;

      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          showToast("Storage permission is required to download Excel.");
          return;
        }
        const safUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          csvName.replace('.csv', ''),
          'text/csv'
        );
        await FileSystem.writeAsStringAsync(safUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        showToast("Excel saved to Downloads folder.");
      } else {
        await FileSystem.writeAsStringAsync(tempUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
        showToast("Excel downloaded successfully.");
      }
    } catch (error) {
      console.error("[Excel Error]:", error);
      showToast("Failed to download Excel");
    }
  };

  // Transaction card
  const renderItem = useCallback(({ item }) => {
    if (!item._id && item.typeOf === 'opening') {
      // Opening balance row
      return (
        <View style={styles.transCard}>
          <View style={styles.transCardLeft}>
            <View style={[styles.transIcon, { backgroundColor: '#e8f0fe' }]}>
              <Feather name="book-open" size={16} color={Style.headerBgColor} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.transNarration}>Opening Balance</Text>
            <Text style={styles.transDate}>Starting Entry</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.transAmount, { color: '#666' }]}>Rs {formatAmount(item.amount)}</Text>
            <Text style={styles.transBalance}>Bal: Rs {formatAmount(item.currentBalance)}</Text>
          </View>
        </View>
      );
    }

    const isDebit = item.debit_credit === 'debit';

    return (
      <View style={styles.transCard}>
        <View style={styles.transCardLeft}>
          <View style={[styles.transIcon, { backgroundColor: isDebit ? '#fff0f0' : '#edfff4' }]}>
            <Feather name={isDebit ? "arrow-up-right" : "arrow-down-left"} size={16} color={isDebit ? '#e53935' : '#23a26d'} />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.transRef} numberOfLines={1}>{item.refNumber || 'N/A'}</Text>
          <Text style={styles.transNarration} numberOfLines={1}>{item.naration || (item.typeOf === 'invoice' ? 'Invoice' : item.typeOf === 'payment' ? 'Payment' : item.typeOf || '-')}</Text>
          <Text style={styles.transDate}>{item.date ? moment(item.date).format('DD MMM YYYY') : '-'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.transAmount, { color: isDebit ? '#e53935' : '#23a26d' }]}>
            {isDebit ? 'Dr' : 'Cr'} Rs {formatAmount(item.amount)}
          </Text>
          <Text style={styles.transBalance}>Bal: Rs {formatAmount(item.currentBalance)}</Text>
        </View>
      </View>
    );
  }, []);

  const renderListHeader = () => (
    <View>
      {/* Client Info Card */}
      {clientInfo?.fullName && (
        <View style={styles.clientCard}>
          <View style={styles.clientCardRow}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarText}>
                {clientInfo.fullName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={1}>{clientInfo.fullName}</Text>
              <Text style={styles.clientSub}>{clientInfo.email || 'No email'}</Text>
              <Text style={styles.clientSub}>{clientInfo.mobile?.code} {clientInfo.mobile?.number}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Summary Card */}
      {(summary.totalDebit !== undefined || summary.totalCredit !== undefined) && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Opening</Text>
              <Text style={styles.summaryValue}>Rs {formatAmount(summary.openingBalance)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Closing</Text>
              <Text style={[styles.summaryValue, { color: Style.headerBgColor }]}>Rs {formatAmount(summary.closingBalance)}</Text>
            </View>
          </View>
          <View style={styles.summaryLine} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Debit</Text>
              <Text style={[styles.summaryValue, { color: '#e53935' }]}>Rs {formatAmount(summary.totalDebit)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Credit</Text>
              <Text style={[styles.summaryValue, { color: '#23a26d' }]}>Rs {formatAmount(summary.totalCredit)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Download Buttons */}
      {/* <View style={styles.downloadRow}>
        <TouchableOpacity onPress={handleDownloadPDF} style={styles.downloadBtn} activeOpacity={0.7}>
          <Feather name="file-text" size={16} color="#fff" />
          <Text style={styles.downloadBtnText}>Download PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDownloadExcel} style={[styles.downloadBtn, { backgroundColor: '#23a26d' }]} activeOpacity={0.7}>
          <Feather name="grid" size={16} color="#fff" />
          <Text style={styles.downloadBtnText}>Download Excel</Text>
        </TouchableOpacity>
      </View> */}

      {/* Transactions Header */}
      <View style={styles.transHeader}>
        <Text style={styles.transHeaderText}>All Transactions ({transactions.length})</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={resetFilters} style={styles.iconBtn}>
            <Fontisto name="spinner-refresh" size={18} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconBtn}>
            <Feather name="sliders" size={18} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 40 }}>
        No Transactions Available.
      </Text>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalOverlay} activeOpacity={1}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>Filters</Text>
              <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: Style.primaryTextColor }}>Reset</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Filters */}
            <Text style={styles.filterLabel}>Quick Filters</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              {[{ label: '1 Month', key: '1m' }, { label: '3 Months', key: '3m' }, { label: '6 Months', key: '6m' }].map(({ label, key }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => applyQuickFilter(key)}
                  style={[styles.quickChip, activeQuickFilter === key && styles.quickChipActive]}
                >
                  <Text style={[styles.quickChipText, activeQuickFilter === key && styles.quickChipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Date Range */}
            <Text style={[styles.filterLabel, { marginTop: 16 }]}>Custom Date Range</Text>
            <TouchableOpacity onPress={() => showDatePicker('start')} style={styles.datePickerBtn}>
              <Text style={{ flex: 1, color: startDate ? Style.headerBgColor : '#aaa', fontFamily: 'Lato-SemiBold', fontSize: 13 }}>{formattedStartDate}</Text>
              <Feather name="calendar" size={20} color={Style.basicTextColor} />
            </TouchableOpacity>

            <Text style={styles.filterLabel}>End Date</Text>
            <TouchableOpacity onPress={() => showDatePicker('end')} style={styles.datePickerBtn}>
              <Text style={{ flex: 1, color: endDate ? Style.headerBgColor : '#aaa', fontFamily: 'Lato-SemiBold', fontSize: 13 }}>{formattedEndDate}</Text>
              <Feather name="calendar" size={20} color={Style.basicTextColor} />
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!activeQuickFilter}
              onPress={applyFilters}
              style={[styles.applyBtn, { backgroundColor: activeQuickFilter ? Style.headerBgColor : '#cccccc40' }]}
            >
              <Text style={{ fontFamily: 'Lato-SemiBold', fontSize: 14, color: activeQuickFilter ? '#fff' : '#999' }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <DateTimePickerModal
        isVisible={activeDatePicker !== null}
        mode="date"
        date={new Date()}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />

      {/* Header */}
      <Animated.View style={{ paddingHorizontal: 20, transform: [{ scale }] }}>
        <View style={styles.headerRow}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
           </TouchableOpacity>
          <Text style={styles.headerTitle}>Statements</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => switchTab('Client')}
            style={[styles.tab, activeTab === 'Client' && styles.activeTab]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'Client' && styles.activeTabText]}>Client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => switchTab('Group')}
            style={[styles.tab, activeTab === 'Group' && styles.activeTab]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'Group' && styles.activeTabText]}>Group</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'Group' && isGroupDisabled ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={styles.restrictedCard}>
              <Feather name="lock" size={40} color="#b0b4c8" />
              <Text style={styles.restrictedTitle}>Access Restricted</Text>
              <Text style={styles.restrictedMsg}>Only the group owner has access</Text>
            </View>
          </View>
        ) : loading && !responseData ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(_, index) => `txn-${index}`}
            renderItem={renderItem}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 4,
    marginTop: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: 'rgba(255,255,255,0.7)',
  },
  activeTabText: {
    color: Style.headerBgColor,
  },
  // Content
  contentContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Client Info
  clientCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  clientCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Style.headerBgColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    fontSize: 20,
    fontFamily: 'Lato-Bold',
    color: '#fff',
  },
  clientName: {
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
    color: '#1a1a2e',
  },
  clientSub: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#8a8fa8',
    marginTop: 1,
  },
  // Summary
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#eef0f4',
  },
  summaryLine: {
    height: 1,
    backgroundColor: '#eef0f4',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#8a8fa8',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: '#1a1a2e',
  },
  // Download
  downloadRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    backgroundColor: Style.headerBgColor,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  downloadBtnText: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: '#fff',
  },
  // Transactions Header
  transHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transHeaderText: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: '#1a1a2e',
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Transaction Card
  transCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  transCardLeft: {
    marginRight: 12,
  },
  transIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transRef: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: '#1a1a2e',
  },
  transNarration: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#8a8fa8',
    marginTop: 1,
  },
  transDate: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#b0b4c8',
    marginTop: 2,
  },
  transAmount: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
  },
  transBalance: {
    fontSize: 10,
    fontFamily: 'Lato-Medium',
    color: '#b0b4c8',
    marginTop: 2,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#f5f7fa',
    borderTopStartRadius: 24,
    borderTopEndRadius: 24,
    padding: 20,
    paddingTop: 10,
  },
  modalHandle: {
    width: 50,
    height: 4,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 5,
    borderRadius: 5,
  },
  resetBtn: {
    paddingHorizontal: 16,
    height: 36,
    backgroundColor: '#658Eff10',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Style.headerBgColor,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    color: '#8a8fa8',
    marginBottom: 6,
    marginTop: 12,
  },
  quickChip: {
    flex: 1,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  quickChipActive: {
    backgroundColor: Style.headerBgColor,
    borderColor: Style.headerBgColor,
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    color: '#8a8fa8',
  },
  quickChipTextActive: {
    color: '#fff',
  },
  datePickerBtn: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eef0f4',
  },
  applyBtn: {
    width: '50%',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  // Restricted
  restrictedCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  restrictedTitle: {
    fontSize: 18,
    fontFamily: 'Lato-SemiBold',
    color: '#1a1a2e',
    marginTop: 16,
  },
  restrictedMsg: {
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: '#8a8fa8',
    marginTop: 6,
    textAlign: 'center',
  },
});
