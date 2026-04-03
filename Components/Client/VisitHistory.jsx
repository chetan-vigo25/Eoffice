import { useState, useEffect, useCallback, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, SafeAreaView, Platform, RefreshControl, FlatList, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import moment from "moment";
import { useDispatch } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";

import BASE_URL from '../../Urls/DomainUrl';
import Style from "../../Style/Style";
import { AntDesign } from "@expo/vector-icons";

const PAGE_LIMIT = 10;

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

export default function VisitHistory({ navigation, route }) {
    const dispatch = useDispatch();
    const { userData } = route.params || {};
    const [slideAnim] = useState(new Animated.Value(30));

    const [activeTab, setActiveTab] = useState("existing");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const logoutHandled = useRef(false);

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
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

    const fetchVisits = async (pageNum = 1, isRefresh = false) => {
      if (logoutHandled.current) return;
      if (pageNum === 1 && !isRefresh) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          handleLogout();
          return;
        }

        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + token);
        myHeaders.append("Content-Type", "application/json");

        let apiUrl = "";
        let body = {};

        if (activeTab === "existing") {
          // Client tab - existing visitor list API
          apiUrl = `${BASE_URL}/admin/visitor/list?page=${pageNum}&limit=${PAGE_LIMIT}`;
          body = {
            companyId: userData?.companyId || "",
            directorId: "",
            branchId: userData?.branchId || "",
            departmentId: "",
            employeId: "",
            clientId: userData?._id || "",
            visitReasonId: "",
            category: "existing",
            startDate: "",
            endDate: "",
            text: "",
            sort: true,
            status: "",
            isPagination: true,
          };
        } else {
          // Employe Visit tab - general visitor list API
          apiUrl = `${BASE_URL}/admin/generalVisitor/list?page=${pageNum}&limit=${PAGE_LIMIT}`;
          body = {
            companyId: userData?.companyId || "",
            directorId: "",
            branchId: userData?.branchId || "",
            departmentId: "",
            employeId: "",
            clientId: userData?._id || "",
            category: "client",
            startDate: "",
            endDate: "",
            text: "",
            sort: true,
            status: "",
            isPagination: true,
          };
        }

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: JSON.stringify(body),
          redirect: "follow"
        };

        const response = await fetch(apiUrl, requestOptions);
        const result = await response.json();

        // console.log(`[VisitHistory --Page ${pageNum} Response]:`, JSON.stringify(result, null, 2));

        if (result.statusCode === 200) {
          const docs = result?.data?.docs || result?.data?.visitorData || result?.data || [];
          // console.log(`[VisitHistory Page:: ${pageNum} Data]:`, docs.length, 'items');

          if (pageNum === 1) {
            setData(docs);
          } else {
            setData(prev => [...prev, ...docs]);
          }

          // Check if more pages exist
          const totalPages = result?.data?.totalPages || result?.data?.pages || 0;
          const totalDocs = result?.data?.totalDocs || result?.data?.total || 0;
          if (totalPages > 0) {
            setHasMore(pageNum < totalPages);
          } else if (totalDocs > 0) {
            setHasMore((pageNum * PAGE_LIMIT) < totalDocs);
          } else {
            setHasMore(docs.length === PAGE_LIMIT);
          }

          setPage(pageNum);
        } else if (result.statusCode === 401) {
          handleLogout();
        } else {
          showToast(result.message || "Something went wrong.");
          if (pageNum === 1) setData([]);
        }
      } catch (error) {
        console.error("[VisitHistory Error]:", error);
        showToast("Network error. Please try again.");
        if (pageNum === 1) setData([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    };

    useEffect(() => {
      setData([]);
      setPage(1);
      setHasMore(true);
      fetchVisits(1);
    }, [activeTab]);

    const handleLoadMore = () => {
      if (!hasMore || loadingMore || loading) return;
      fetchVisits(page + 1);
    };

    const handleRefresh = () => {
      setRefreshing(true);
      setHasMore(true);
      fetchVisits(1, true);
    };

    const renderItem = useCallback(({ item }) => (
      <View style={{ width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 10, elevation: 2, padding: 15, marginBottom: 15 }} >
        <View style={{ flexDirection:'row', gap:10, justifyContent:'space-between' }} >
          <Text numberOfLines={1} ellipsizeMode="tail" style={{flex:1.5, fontSize: 14, fontFamily: "Lato-SemiBold", color: Style.primaryTextColor }}>{item.name}</Text>
           <View style={{ flex:1 }}>
              <Text style={{ fontSize: 12, fontFamily: "Lato-SemiBold", color: "#5e6366" }}>Visit time/Date:</Text>
              <Text style={{ fontSize: 10, fontFamily: "Lato-SemiBold", color: Style.secondryTextColor }}>{moment(item.date).format("DD-MM-YYYY / hh:mm a")}</Text>
           </View>
        </View>
        <View style={{ flexDirection:"row", gap:0, alignItems:'center' }} >
          <Text style={{ fontSize: 14, fontFamily: "Lato-SemiBold", color: "#5e6366" }}>Departmemt: </Text>
          <Text style={{ fontSize: 14, fontFamily: "Lato-SemiBold", color: Style.secondryTextColor }}>{item.departmentName}</Text>
        </View>
        <View style={{ flexDirection:"row", gap:0, alignItems:'center', marginBottom:10 }} >
          <Text style={{ fontSize: 14, fontFamily: "Lato-SemiBold", color: "#5e6366" }}>Reason: </Text>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 14, fontFamily: "Lato-SemiBold", color: Style.secondryTextColor }}>{item.visitReasonId}</Text>
        </View>
        <View style={{ marginTop:5 }} >
          {
            item.updateByEmploye === true?
            <View style={{ width:'70%', height:40, justifyContent:'center', alignItems:'center', backgroundColor:'#ffdddd', borderRadius:6 }} >
              <Text style={{ fontSize: 14, fontFamily: "Lato-SemiBold", color:'#c32c2c' }} >Cancelled By Employee</Text>
            </View>:
            item.updateByClient === true?
            <View style={{ width:'70%', height:40, justifyContent:'center', alignItems:'center', backgroundColor:item.status === "confirmed"?'#dbffd2':'#ffdddd', borderRadius:6 }} >
              <Text style={{ fontSize: 14, fontFamily: "Lato-SemiBold", color:item.status === "confirmed"?'#34a32a':'#c32c2c' }} >{item.status === "confirmed"? 'Metting Successful': 'Cancelled By You'}</Text>
            </View>:null
          }
        </View>
      </View>
    ), []);

    const renderFooter = () => {
      if (loadingMore) {
        return (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={Style.headerBgColor} />
          </View>
        );
      }
      if (!hasMore && data.length > 0) {
        return (
          <Text style={{ textAlign: 'center', paddingVertical: 15, fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
            No more visits
          </Text>
        );
      }
      return null;
    };

    const renderEmpty = () => {
      if (loading) return null;
      return (
        <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
          No Data Found
        </Text>
      );
    };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
     <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />
      <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center',paddingHorizontal:20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
           <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{color: '#fff', fontSize: 14, fontWeight: '500', flex: 1, }}>Visit History</Text>
      </View>
      <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
        <View style={{ flexDirection: 'row', backgroundColor: '#e8e8e8', borderRadius: 10, marginBottom: 15, padding: 4, }} >
          <TouchableOpacity
            onPress={() => setActiveTab("existing")}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: activeTab === "existing" ? Style.headerBgColor : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: activeTab === "existing" ? '#fff' : Style.secondryTextColor }}>Client</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("client")}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: activeTab === "client" ? Style.headerBgColor : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: activeTab === "client" ? '#fff' : Style.secondryTextColor }}>Employe Visit</Text>
          </TouchableOpacity>
        </View>
        {loading && data.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, index) => item._id?.toString() || `visit-${index}`}
            renderItem={renderItem}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
