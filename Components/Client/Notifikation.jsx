import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, FlatList, RefreshControl, ToastAndroid, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../Urls/DomainUrl';
import moment from "moment";
import { parseISO, isToday } from 'date-fns';
import { useDispatch } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import { useFocusEffect } from '@react-navigation/native';
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../Style/Style";

const PAGE_SIZE = 10;

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

export default function Notifikation({ navigation }) {
  const dispatch = useDispatch();
  const [scale] = useState(new Animated.Value(0));
  const [notifyData, setNotifyData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const logoutHandled = useRef(false);
  const pendingReadIds = useRef(new Set());
  const localReadStatus = useRef(new Map());
  const isFetching = useRef(false);

  useEffect(() => {
    const loadLocalReads = async () => {
      try {
        const saved = await AsyncStorage.getItem("LOCAL_READ_IDS");
        if (saved) {
          const ids = JSON.parse(saved);
          ids.forEach(id => localReadStatus.current.set(id, true));
          console.log("📦 Restored local read IDs:", ids.length);
        }
      } catch (e) {
        console.log("Error loading local read IDs", e);
      }
    };
    loadLocalReads();
  }, []);

  const saveLocalReads = async () => {
    try {
      const ids = Array.from(localReadStatus.current.keys());
      await AsyncStorage.setItem("LOCAL_READ_IDS", JSON.stringify(ids));
      console.log("💾 Saved local read IDs:", ids.length);
    } catch (e) {
      console.log("Error saving local reads", e);
    }
  };

  useEffect(() => {
    Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused - refreshing notifications");
      const timer = setTimeout(() => {
        getNotification(true);
      }, 300);
      return () => clearTimeout(timer);
    }, [])
  );

  const getNotification = async (force = false) => {
    if (logoutHandled.current || isFetching.current) return;
    isFetching.current = true;
    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        navigation.navigate('Autologin');
        return;
      }

      const headers = new Headers();
      headers.append("Authorization", "Bearer " + token);
      headers.append("Content-Type", "application/json");

      const res = await fetch(`${BASE_URL}/client/notification/history`, {
        method: "POST",
        headers,
      });

      const result = await res.json();

      if (result.statusCode === 200) {
        const serverNotifications = result?.data || [];
        
        // Merge with local read status
        const mergedNotifications = serverNotifications.map(notification => ({
          ...notification,
          isRead: localReadStatus.current.has(notification._id) || notification.status === "read",
        }));
        
        setNotifyData(mergedNotifications);

        const unreadCount = mergedNotifications.filter(n => !n.isRead).length;
        console.log(`📊 Notifications loaded: Total: ${mergedNotifications.length}, Unread: ${unreadCount}`);
        console.log(`📌 Locally marked read: ${localReadStatus.current.size}`);
      } 
      else if (result.statusCode === 401) {
        dispatch(logout());
        await AsyncStorage.clear();
        navigation.navigate('Autologin');
      } 
      else {
        showToast(result.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFetching.current = false;
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (pendingReadIds.current.has(notificationId)) return;
    pendingReadIds.current.add(notificationId);
    
    // Save locally FIRST
    localReadStatus.current.set(notificationId, true);
    console.log(`📝 Marked as read locally: ${notificationId}`);
    
    // Update UI instantly
    setNotifyData(prev =>
      prev.map(n =>
        n._id === notificationId
          ? { ...n, isRead: true, status: "read" }
          : n
      )
    );
    
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      
      const res = await fetch(`${BASE_URL}/client/notification/read`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ _ids: [notificationId] }),
      });

      const result = await res.json();
      if (result.statusCode === 200) {
        console.log("✅ Server confirmed read for:", notificationId);
        await saveLocalReads();
      } else {
        console.log("⚠️ Server failed, keeping local state");
      }
    } catch (err) {
      console.log("❌ Server error:", err);
    } finally {
      setTimeout(() => {
        pendingReadIds.current.delete(notificationId);
      }, 500);
    }
  };

  const handleTaskPress = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    navigation.navigate('TaskManagement');
  };

  const handleInvoicePress = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    navigation.navigate('InvoiceList');
  };

  const unreadCount = notifyData.filter(n => !n.isRead).length;

  const sortedNotifications = [...notifyData].sort((a, b) => {
    const aIsToday = isToday(parseISO(a.createdAt));
    const bIsToday = isToday(parseISO(b.createdAt));
    if (aIsToday && !bIsToday) return -1;
    if (!aIsToday && bIsToday) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const visibleNotifications = sortedNotifications.slice(0, displayCount);
  const hasMore = displayCount < sortedNotifications.length;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 500);
  }, [hasMore, loadingMore]);

  const onRefresh = async () => {
    setRefresh(true);
    await getNotification(true);
    setRefresh(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar barStyle="light-content" backgroundColor={Style.headerBgColor} />

      <Animated.View style={{ paddingHorizontal: 20, paddingBottom: 14, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}
          >
            <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold' }}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Lato-Medium', marginTop: 1 }}>
                {unreadCount} unread
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <View style={{
              backgroundColor: '#ef4444',
              borderRadius: 14,
              minWidth: 28,
              height: 28,
              paddingHorizontal: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: '#fff' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopStartRadius: 20, borderTopEndRadius: 20, padding: 16 }}>
        <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
          {isLoading && notifyData.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
            </View>
          ) : notifyData.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="bell-off-outline" size={48} color="#ccc" />
              <Text style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginTop: 12 }}>
                No Notifications
              </Text>
            </View>
          ) : (
            <FlatList
              data={visibleNotifications}
              keyExtractor={(item, index) => item._id || index.toString()}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />}
              renderItem={({ item, index }) => {
                const isCurrentToday = isToday(parseISO(item.createdAt));
                const prevItem = index > 0 ? visibleNotifications[index - 1] : null;
                const isPrevToday = prevItem ? isToday(parseISO(prevItem.createdAt)) : null;
                let sectionHeader = null;
                if (index === 0 && isCurrentToday) sectionHeader = 'Today';
                else if (isPrevToday === true && !isCurrentToday) sectionHeader = 'Earlier';
                else if (index === 0 && !isCurrentToday) sectionHeader = 'Earlier';

                return (
                  <>
                    {sectionHeader && (
                      <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginBottom: 8, marginTop: index === 0 ? 0 : 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {sectionHeader}
                      </Text>
                    )}
                    {item.type === "task" ? (
                      <TaskCard data={item} onPress={() => handleTaskPress(item)} />
                    ) : item.type === "invoice" ? (
                      <InvoiceCard data={item} onPress={() => handleInvoicePress(item)} />
                    ) : null}
                  </>
                );
              }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 15, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={Style.headerBgColor} />
                  </View>
                ) : !hasMore && visibleNotifications.length > 0 ? (
                  <Text style={{ textAlign: 'center', paddingVertical: 15, fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                    No more notifications
                  </Text>
                ) : null
              }
            />
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const TaskCard = ({ data, onPress }) => {
  const isUnread = !data.isRead;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{
      width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 12,
      padding: 14, marginBottom: 10, borderWidth: isUnread ? 1 : 0.5,
      borderColor: isUnread ? `${Style.headerBgColor}40` : '#e8e8e8',
      flexDirection: 'row', alignItems: 'flex-start',
    }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${Style.headerBgColor}12`, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 }}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={Style.headerBgColor} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginRight: 8 }}>
            {data?.data?.taskName || 'N/A'}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
            {moment(data.createdAt).fromNow()}
          </Text>
        </View>
        {data?.data?.code && (
          <View style={{ marginBottom: 4 }}>
            <View style={{ backgroundColor: `${Style.headerBgColor}12`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' }}>
              <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.headerBgColor }}>{data.data.code}</Text>
            </View>
          </View>
        )}
        <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, lineHeight: 17 }}>{data.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontSize: 10, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{moment(data.createdAt).format('DD MMM YYYY')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontFamily: 'Lato-Medium', color: Style.headerBgColor, marginRight: 3 }}>View Task</Text>
            <AntDesign name="arrowright" size={10} color={Style.headerBgColor} />
          </View>
        </View>
      </View>
      {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginLeft: 8, marginTop: 6 }} />}
    </TouchableOpacity>
  );
};

const InvoiceCard = ({ data, onPress }) => {
  const isUnread = !data.isRead;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{
      width: '100%', backgroundColor: Style.basicbgColor, borderRadius: 12,
      padding: 14, marginBottom: 10, borderWidth: isUnread ? 1 : 0.5,
      borderColor: isUnread ? `${Style.headerBgColor}40` : '#e8e8e8',
      flexDirection: 'row', alignItems: 'flex-start',
    }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#fff4e5', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 }}>
        <MaterialCommunityIcons name="receipt" size={18} color="#d97706" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>
            {data?.data?.invoiceNumber || 'Invoice'}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
            {moment(data.createdAt).fromNow()}
          </Text>
        </View>
        <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: '#d97706', marginBottom: 4 }}>
          ₹ {data?.data?.grandTotal?.toLocaleString('en-IN') || '0'}
        </Text>
        <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{data.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={{ fontSize: 10, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{moment(data.createdAt).format('DD MMM YYYY')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontFamily: 'Lato-Medium', color: Style.headerBgColor, marginRight: 3 }}>View Invoice</Text>
            <AntDesign name="arrowright" size={10} color={Style.headerBgColor} />
          </View>
        </View>
      </View>
      {isUnread && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginLeft: 8, marginTop: 6 }} />}
    </TouchableOpacity>
  );
};