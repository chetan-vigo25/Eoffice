import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Animated, RefreshControl, FlatList, Modal, StyleSheet, UIManager, Platform, StatusBar, ToastAndroid, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from 'react-native-select-dropdown'
import moment from "moment";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import usePaginatedList from '../../../hooks/usePaginatedList';

import { AntDesign, Feather, Entypo, Fontisto } from "@expo/vector-icons";
import Style from "../../../Style/Style";
import BASE_URL from '../../../Urls/DomainUrl';
import { downloadDocumentPdf, DOC_TYPE } from '../../../Utils/pdf';
import DocumentViewer from '../../Common/DocumentViewer';

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function TransactionList({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [scale] = useState(new Animated.Value(0));
  const [modalVisible, setModalVisible] = useState(false);
  const [statusD, setStatusD] = useState('');
  const [startDate, setStartDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const statusData = ['Paid', 'PendingPayment'];

  const filtersRef = React.useRef({ statusD: '', startDate: '' });

  const [downloadingId, setDownloadingId] = useState(null);
  const [viewerDoc, setViewerDoc] = useState(null);   // { id, number }

  const onUnauthorized = useCallback(async () => {
    dispatch(logout());
    await AsyncStorage.removeItem('token');
    await AsyncStorage.clear();
    navigation.navigate('Autologin');
  }, [dispatch, navigation]);

  const buildBody = useCallback(() => ({
    text: "",
    sort: true,
    status: filtersRef.current.statusD || "",
    departmentId: "",
    isPagination: false,
    date: filtersRef.current.startDate || "",
  }), []);

  const extractDocs = useCallback((result) => result.data?.docs, []);

  const { data, allData, loading, refreshing, hasMore, loadFirst, loadMore, refresh } = usePaginatedList({
    url: `${BASE_URL}/client/invoice/payment/history`,
    buildBody,
    extractDocs,
    onUnauthorized,
  });

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      filtersRef.current = { statusD, startDate };
      loadFirst();
    }, [])
  );

  const displayData = filteredData !== null ? filteredData : data;
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredData(null);
    } else {
      const results = allData().filter(item => {
        const invoiceMatch = String(item.invoiceNumber || '').toLowerCase().includes(text.toLowerCase());
        const receiptMatch = String(item.receiptNumber || '').toLowerCase().includes(text.toLowerCase());
        return invoiceMatch || receiptMatch;
      });
      setFilteredData(results);
    }
  };

  const applyFilters = () => {
    setModalVisible(false);
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { statusD, startDate };
    loadFirst();
  };

  const resetFilters = () => {
    setStartDate('');
    setStatusD('');
    setModalVisible(false);
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { statusD: '', startDate: '' };
    loadFirst();
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setFilteredData(null);
    filtersRef.current = { statusD, startDate };
    refresh();
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    setStartDate(date);
    hideDatePicker();
  };
  const formattedDate = startDate ? moment(startDate).format("DD/MM/YYYY") : "Select Date";

  const downloadInvoicePDF = useCallback(async (invoice) => {
    const rowId = invoice?._id;
    if (!rowId) {
      showToast('This invoice cannot be downloaded.');
      return;
    }
    if (downloadingId) return;
    setDownloadingId(rowId);
    try {
      await downloadDocumentPdf({
        id: rowId,
        type: DOC_TYPE.invoice,
        source: invoice,
        baseName: `Invoice_${invoice?.invoiceNumber || ''}_${moment().format('DDMMYYYY')}`,
        fallbackName: 'Invoice',
        onToast: showToast,
        onUnauthorized,
      });
    } catch (error) {
      console.error('[Invoice PDF Download Error]:', error);
      showToast(`Failed to download PDF: ${error?.message || error}`);
    } finally {
      setDownloadingId(null);
    }
  }, [downloadingId, onUnauthorized]);

  const renderItem = useCallback(({ item }) => {
    // Advance entries are not invoices, so they get no document actions.
    const canOpen = !!item._id && item.type !== 'Advance';
    const isDownloading = downloadingId === item._id;
    return (
    <View style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, marginBottom:10, padding:10 }} >
      <View style={{ width:"100%", flexDirection:'row', gap:10, justifyContent:'space-between', alignItems:'center' }} >
        <Text style={{flex:8, fontSize:14, fontWeight:"500", color:Style.headerBgColor }}>{item.type ==="Advance"?`Advance: ${item.invoiceNumber}`:`Inv: ${item.invoiceNumber}`}</Text>
          <TouchableOpacity onPress={()=> {navigation.navigate('TransDetail', {_id:item._id})}} style={{ flex:2, width:100, backgroundColor:item.status ==='Paid'? '#85BD2A':'#E51E1E', height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
              <Text style={{ fontSize:14, fontWeight:"600", color:Style.basicbgColor }}>{item.status==='Paid'? 'Paid':'Unpaid'}</Text>
          </TouchableOpacity>
      </View>
       <View style={{ flexDirection:'row', paddingVertical:5, alignItems:'center' }}>
          <Text style={{ fontSize:16, fontWeight:"600", color:Style.secondryTextColor }}>Rs : </Text>
          <Text style={{ fontSize:14, fontWeight:"500", color:Style.secondryTextColor }}>{item.grandTotal}/-</Text>
       </View>
       <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center' }} >
         <View style={{ flexDirection:'row', alignItems:'center' }}>
            <Text style={{ fontSize:14, fontWeight:"600", color:Style.secondryTextColor }}>Date : </Text>
            <Text style={{ fontSize:12, fontWeight:"500", color:Style.secondryTextColor }}>{moment(item.updatedAt).format('DD/MM/YYYY')}</Text>
         </View>
         <View style={{ flexDirection:'row', alignItems:'center', gap:8 }} >
           {canOpen ? (
             <>
               <TouchableOpacity
                 onPress={() => setViewerDoc({ id: item._id, number: item.invoiceNumber })}
                 style={{ width:34, height:34, borderRadius:17, backgroundColor:'#eef2ff', justifyContent:'center', alignItems:'center' }}
               >
                 <Feather name="eye" size={16} color={Style.headerBgColor} />
               </TouchableOpacity>
               <TouchableOpacity
                 onPress={() => downloadInvoicePDF(item)}
                 disabled={isDownloading}
                 style={{ width:34, height:34, borderRadius:17, backgroundColor:'#eef2ff', justifyContent:'center', alignItems:'center' }}
               >
                 {isDownloading
                   ? <ActivityIndicator size="small" color={Style.headerBgColor} />
                   : <Feather name="download" size={16} color={Style.headerBgColor} />}
               </TouchableOpacity>
             </>
           ) : null}
         </View>
       </View>
    </View>
    );
  }, [navigation, downloadingId, downloadInvoicePDF]);

  const renderFooter = () => {
    if (!loading || data.length === 0) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
        {startDate || statusD ? 'No transactions match your filters.' : 'No Transactions Available.'}
      </Text>
    );
  };

  return (
    <>
    <DocumentViewer
      visible={!!viewerDoc}
      id={viewerDoc?.id}
      type={DOC_TYPE.invoice}
      title="Invoice"
      number={viewerDoc?.number}
      onClose={() => setViewerDoc(null)}
      onUnauthorized={onUnauthorized}
    />
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
        <Modal
           animationType="slide"
           transparent={true}
           visible={modalVisible}
           onRequestClose={() => {
             setModalVisible(false)
           }}>
         <TouchableOpacity onPress={()=> setModalVisible(false)} style={{ flex:1, backgroundColor:'#00000080', justifyContent:'flex-end'}}>
            <View style={{ width:'100%', backgroundColor:'#eee', height:400,  borderTopStartRadius:30, borderTopEndRadius:30, padding:15 }} >
            <View style={{ width:60, height:4, backgroundColor:'#b3b3b3', alignSelf:'center', marginTop:20, borderRadius:5 }} ></View>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10 }} >
            <Text style={{ fontSize:16, fontWeight:"600", color:'#074173', }}>Filters</Text>
             <TouchableOpacity onPress={resetFilters} style={{ width:110, paddingHorizontal:10, height:40, backgroundColor:'#658Eff10', justifyContent:'center', alignItems:'center', borderRadius:6, borderWidth:1, borderColor:Style.headerBgColor }} >
               <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: Style.primaryTextColor }} >Reset</Text>
             </TouchableOpacity>
            </View>
              <View style={{ width:'100%', flexDirection:'row', gap:10 }} >
                <View style={{ flex:1, height:50, flexDirection:'row', borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                   <SelectDropdown
                      data={statusData.length === 0 ? ['No data found'] : statusData}
                      onSelect={(statusData, index) => {
                        setStatusD(statusData);
                      }}
                      renderButton={(statusData, isOpened) => {
                        return (
                          <View style={styles.dropdownButtonStyle}>
                             <Text style={styles.dropdownButtonTxtStyle}>
                               {(statusData && statusData) || 'Select Status'}
                             </Text>
                             <Entypo name={isOpened ? 'chevron-up' : 'chevron-down'} style={styles.dropdownButtonArrowStyle} />
                          </View>
                        );
                      }}
                      renderItem={(statusData, index, isSelected) => {
                        return (
                          <View style={{...styles.dropdownItemStyle, ...(isSelected && {backgroundColor: '#D2D9DF'})}}>
                            <Text style={styles.dropdownItemTxtStyle}>{statusData}</Text>
                          </View>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={styles.dropdownMenuStyle}
                   />
                 </View>
                 <View style={{ flex:1, height:50, flexDirection:'row', backgroundColor:Style.basicbgColor, borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                  <View style={{ width:'100%', height:50, borderRadius:5, flexDirection:'row', backgroundColor:Style.basicbgColor, elevation:0, marginBottom:10, padding:5, justifyContent:"center", alignItems:'center'}}>
                    <View style={{ flex:9, borderRadius:5, padding:5,  }} >
                      <Text style={{ color:Style.headerBgColor, fontWeight:'600', fontSize:12 }}>{formattedDate}</Text>
                    </View>
                    <TouchableOpacity onPress={showDatePicker} style={{ flex:1.5, height:50, alignItems:'center', justifyContent:'center',}}>
                       <Feather name="calendar" size={20} color={Style.basicTextColor} />
                     </TouchableOpacity>
                  </View>
               </View>
              </View>
              <TouchableOpacity disabled={!startDate && !statusD} onPress={applyFilters} style={{ width:'50%', height:40, backgroundColor: (!startDate && !statusD) ? '#cccccc40' : '#074173', borderRadius:5, justifyContent:'center', alignItems:'center', alignSelf:'center', elevation:0, marginTop:0, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, marginBottom:10 }} >
                  <Text style={{ fontWeight:600, fontSize:14, color:(!startDate && !statusD)?'#999':'#fff' }} >Apply</Text>
              </TouchableOpacity>
          </View>
         </TouchableOpacity>
        </Modal>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          date={startDate || new Date()}
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center', }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 14, fontFamily:'Lato-SemiBold', flex: 1, }}>Transaction History</Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 20,}}>
          <View style={{flex: 8, flexDirection: 'row', alignItems: 'center', backgroundColor:Style.basicbgColor, borderRadius: 50, height: 50, elevation: 4 }}>
            <TextInput placeholder="Search" value={searchQuery} onChangeText={handleSearch} style={{flex: 9, fontSize: 18,padding: 10,paddingLeft: 20,}} />
             <TouchableOpacity style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
               <Image source={require('../../../assets/oui_search.png')} resizeMode='contain'style={{ width: 20, height: 20,}} />
             </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={{ flex:1.5, width: 50, height: 50, borderRadius: 50, justifyContent: 'center', alignItems:"flex-end" }}>
             <Feather name="bell" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
        <Animated.View style={{ flex:1, transform: [{ scale }] }}>
             <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:10 }} >
               <Text style={{ flex:1, fontSize:14, fontFamily:'Lato-SemiBold', color:Style.headerBgColor }}>All Transactions</Text>
                 <View style={{ flexDirection:'row', flex:1, justifyContent:'flex-end' }} >
                  <TouchableOpacity onPress={resetFilters} style={{ width:40, height:40, justifyContent:'center', alignItems:'center' }} >
                      <Fontisto name="spinner-refresh" size={24} color="gray" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=> setModalVisible(true)} style={{ width:40, height:40, justifyContent:'center', alignItems:'center' }} >
                      <Image source={require('../../../assets/menuIcon.png')} resizeMode="contain" style={{ width:30, height:30 }} />
                  </TouchableOpacity>
                 </View>
             </View>
             {loading && data.length === 0 ? (
               <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                 <ActivityIndicator size="large" color="#0000ff" />
               </View>
             ) : (
               <FlatList
                 data={displayData}
                 keyExtractor={(item) => item._id?.toString()}
                 renderItem={renderItem}
                 onEndReached={filteredData === null ? loadMore : undefined}
                 onEndReachedThreshold={0.3}
                 ListFooterComponent={renderFooter}
                 ListEmptyComponent={renderEmpty}
                 contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                 showsVerticalScrollIndicator={false}
                 refreshControl={
                   <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                 }
               />
             )}
        </Animated.View>
      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: "100%",
    height: 50,
    backgroundColor: Style.basicbgColor,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation:0
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Style.headerBgColor,
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: Style.headerBgColor,
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});
