import React, { useState, useEffect, useCallback, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, Animated, FlatList, RefreshControl, ToastAndroid, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../Urls/DomainUrl';
import moment from "moment";
import { useDispatch } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import { useFocusEffect } from "@react-navigation/native";
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../Style/Style";

function showToast(msg) { ToastAndroid.show(msg, ToastAndroid.SHORT); }

const STATUS_MAP = {
  Open:       { bg: '#eaf0fb', text: '#1d64c8' },
  InProgress: { bg: '#fff4e5', text: '#d97706' },
  Resolved:   { bg: '#edfaf1', text: '#27ae60' },
  Closed:     { bg: '#f3f4f6', text: '#818181' },
};

export default function Support({ navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(30));
  const [tickets, setTickets]     = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const logoutHandled = useRef(false);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(useCallback(() => { fetchTickets(); }, []));

  const fetchTickets = async () => {
    if (logoutHandled.current) return;
    setIsLoading(true);
    const token = await AsyncStorage.getItem("token");
    if (!token) { navigation.navigate('Autologin'); return; }
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/department/support/supportlist`, {
      method: "POST", headers,
      body: JSON.stringify({ text: "", sort: true, status: "", isPagination: true }),
      redirect: "follow",
    })
      .then(r => r.json())
      .then(async result => {
        // console.log('Support list full response:', JSON.stringify(result, null, 2));
        if (result.statusCode === 200) {
          const docs = result.data?.docs ?? (Array.isArray(result.data) ? result.data : []);
          setTickets(docs);
        } else if (result.statusCode === 401) {
          dispatch(logout()); await AsyncStorage.clear(); navigation.navigate('Autologin');
        } else { showToast(result.message); }
      })
      .catch(e => console.error('Support list error:', e))
      .finally(() => setIsLoading(false));
  };



  const deleteTicket = async (id) => {
    Alert.alert('Delete Ticket', 'Are you sure you want to delete this ticket?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const token = await AsyncStorage.getItem("token");
          const headers = new Headers();
          headers.append("Authorization", "Bearer " + token);
          headers.append("Content-Type", "application/json");
          fetch(`${BASE_URL}/client/department/support/delete`, {
            method: "POST", headers,
            body: JSON.stringify({ _id: id }),
            redirect: "follow",
          })
            .then(r => r.json())
            .then(result => {
              if (result.statusCode === 200) {
                showToast(result.message);
                setTickets(prev => prev.filter(t => t._id !== id));
              } else { showToast(result.message); }
            })
            .catch(e => console.error(e));
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets().finally(() => setRefreshing(false));
  };

  const renderTicket = ({ item }) => {
    const st = STATUS_MAP[item.status] || STATUS_MAP.Open;
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('SupportChat', { ticketId: item._id, title: item.title })}
        activeOpacity={0.75}
        style={{
          backgroundColor: Style.basicbgColor,
          borderRadius: 14, padding: 14, marginBottom: 12,
          borderWidth: 0.5, borderColor: '#e6e6e6',
        }}
      >
        {/* Title row */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
          <Text numberOfLines={2} style={{ flex: 1, fontSize: 14, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor, marginRight: 10 }}>
            {item.title}
          </Text>
          <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ fontSize: 11, fontFamily: 'Lato-SemiBold', color: st.text }}>{item.status}</Text>
          </View>
        </View>

        {/* Description preview */}
        {item.description ? (
          <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginBottom: 8 }}>
            {item.description}
          </Text>
        ) : null}

        {/* Department */}
        {item.departmentData?.name ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialCommunityIcons name="domain" size={12} color={Style.secondryTextColor} style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
              {item.departmentData.name}
            </Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#f0f0f0', paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="clock" size={11} color={Style.secondryTextColor} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
              {moment(item.lastMessageAt || item.createdAt).fromNow()}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Unread badge */}
            {item.unreadCount > 0 && (
              <View style={{ backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                <Text style={{ fontSize: 11, fontFamily: 'Lato-SemiBold', color: '#fff' }}>{item.unreadCount}</Text>
              </View>
            )}
            {/* Message count */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="message-circle" size={12} color={Style.secondryTextColor} style={{ marginRight: 3 }} />
              <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{item.messageCount || 0}</Text>
            </View>
            {/* Delete */}
            {(item.status === 'Open' || item.status === 'Closed') && (
              <TouchableOpacity onPress={() => deleteTicket(item._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="trash-2" size={14} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle="light-content" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold' }}>Support</Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Lato-Medium', marginTop: 1 }}>
            {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('SupportCreate', {})}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
        >
          <AntDesign name="plus" size={14} color="#fff" style={{ marginRight: 5 }} />
          <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Lato-SemiBold' }}>New</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingHorizontal: 16, transform: [{ translateY: slideAnim }] }}>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={item => item._id}
            renderItem={renderTicket}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                <MaterialCommunityIcons name="ticket-outline" size={52} color="#ccc" />
                <Text style={{ fontSize: 16, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, marginTop: 12 }}>No Support Tickets</Text>
                <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 6, textAlign: 'center' }}>
                  Tap "New" to raise your first ticket
                </Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
