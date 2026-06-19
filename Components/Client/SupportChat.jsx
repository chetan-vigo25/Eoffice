import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Animated, ScrollView, KeyboardAvoidingView, Platform, ToastAndroid, ActivityIndicator, Alert, Image, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../Urls/DomainUrl';
import moment from "moment";
import { useDispatch } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import { useFocusEffect } from "@react-navigation/native";
import { AntDesign, Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Style from "../../Style/Style";

function showToast(msg) { ToastAndroid.show(msg, ToastAndroid.SHORT); }

const STATUS_MAP = {
  Open:       { bg: '#eaf0fb', text: '#1d64c8', icon: 'alert-circle-outline' },
  InProgress: { bg: '#fff4e5', text: '#d97706', icon: 'time-outline' },
  Resolved:   { bg: '#edfaf1', text: '#27ae60', icon: 'checkmark-circle-outline' },
  Closed:     { bg: '#f3f4f6', text: '#818181', icon: 'close-circle-outline' },
};

export default function SupportChat({ navigation, route }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { ticketId, title: routeTitle } = route.params;

  const [slideAnim]  = useState(new Animated.Value(30));
  const [ticket, setTicket]     = useState(null);
  const [message, setMessage]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sending, setSending]   = useState(false);
  const scrollRef = useRef(null);
  const logoutHandled = useRef(false);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(useCallback(() => { fetchTicket(); }, []));

  const fetchTicket = async () => {
    if (logoutHandled.current) return;
    setIsLoading(true);
    const token = await AsyncStorage.getItem("token");
    if (!token) { navigation.navigate('Autologin'); return; }
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/department/support/detail`, {
      method: "POST", headers,
      body: JSON.stringify({ _id: ticketId }),
      redirect: "follow",
    })
      .then(r => r.json())
      .then(async result => {
        if (result.statusCode === 200) {
          setTicket(result.data);
          markAsRead();
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
        } else if (result.statusCode === 401) {
          dispatch(logout()); await AsyncStorage.clear(); navigation.navigate('Autologin');
        } else { showToast(result.message); }
      })
      .catch(e => console.error(e))
      .finally(() => setIsLoading(false));
  };

  const markAsRead = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/department/support/markAsRead`, {
      method: "POST", headers,
      body: JSON.stringify({ _id: ticketId }),
      redirect: "follow",
    }).catch(() => {});
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    const token = await AsyncStorage.getItem("token");
    if (!token) { navigation.navigate('Autologin'); return; }
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/department/support/sendMessage`, {
      method: "POST", headers,
      body: JSON.stringify({ _id: ticketId, message: message.trim(), attachments: [] }),
      redirect: "follow",
    })
      .then(r => r.json())
      .then(result => {
        if (result.statusCode === 200) {
          setMessage('');
          setTicket(prev => ({ ...prev, messages: result.data?.messages || prev?.messages, status: result.data?.status || prev?.status }));
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        } else { showToast(result.message); }
      })
      .catch(e => console.error(e))
      .finally(() => setSending(false));
  };

  const st = STATUS_MAP[ticket?.status] || STATUS_MAP.Open;
  const messages = (ticket?.messages || []).filter(m => !m.isDeleted);
  const isClosed = ticket?.status === 'Closed' || ticket?.status === 'Resolved';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle="light-content" />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
            <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold' }}>
              Support Chat
            </Text>
          </View>
          {/* {ticket?.status === 'Open' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('SupportCreate', { ticket })}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
            >
              <Feather name="edit-2" size={18} color="#fff" />
            </TouchableOpacity>
          )} */}
        </View>
      </View>

      <Animated.View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopLeftRadius: 24, borderTopRightRadius: 24, transform: [{ translateY: slideAnim }] }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>

          {isLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
            </View>
          ) : (
            <>
              <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
              >
                
                {/* Ticket Detail Card (Includes everything - Title, Description, Status, Department, Attachments) */}
                <View style={{ margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 16, }}>
                  
                  {/* Title Row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                        Ticket Title
                      </Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Lato-Bold', color: Style.primaryTextColor }}>
                        {ticket?.title || routeTitle || 'N/A'}
                      </Text>
                    </View>
                    {/* Status Badge */}
                    <View style={{ backgroundColor: st.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name={st.icon} size={14} color={st.text} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 12, fontFamily: 'Lato-SemiBold', color: st.text }}>
                        {ticket?.status || 'Open'}
                      </Text>
                    </View>
                  </View>

                  {/* Department */}
                  {ticket?.departmentData?.name && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' }}>
                      <Feather name="grid" size={14} color={Style.secondryTextColor} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                        Department: <Text style={{ color: Style.primaryTextColor }}>{ticket.departmentData.name}</Text>
                      </Text>
                    </View>
                  )}

                  {/* Assigned To */}
                  {ticket?.assignedToData?.fullName && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <Feather name="user" size={14} color={Style.secondryTextColor} style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                        Assigned to: <Text style={{ color: Style.primaryTextColor }}>{ticket.assignedToData.fullName}</Text>
                      </Text>
                    </View>
                  )}

                  {/* Created Date */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Feather name="calendar" size={14} color={Style.secondryTextColor} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                      Created: <Text style={{ color: Style.primaryTextColor }}>{moment(ticket?.createdAt).format('DD MMM YYYY, hh:mm A')}</Text>
                    </Text>
                  </View>

                  {/* Description */}
                  {ticket?.description && (
                    <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                        Description
                      </Text>
                      <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: Style.basicTextColor, lineHeight: 20 }}>
                        {ticket?.description}
                      </Text>
                    </View>
                  )}

                  {/* Attachments - Inside the same card */}
                  {ticket?.attachment?.length > 0 && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' }}>
                      <Text style={{ fontSize: 11, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                        Attachments ({ticket.attachment.length})
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                        {ticket.attachment.map((url, i) => {
                          const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          if (isImage) {
                            return (
                              <TouchableOpacity key={i} onPress={() => Linking.openURL(fullUrl)} style={{ marginRight: 12 }}>
                                <Image
                                  source={{ uri: fullUrl }}
                                  style={{ width: 80, height: 80, borderRadius: 12, borderWidth: 0.5, borderColor: '#e6e6e6' }}
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            );
                          }
                          return (
                            <TouchableOpacity
                              key={i}
                              onPress={() => Linking.openURL(fullUrl)}
                              style={{ marginRight: 12, width: 80, height: 80, borderRadius: 12, borderWidth: 0.5, borderColor: '#e6e6e6', backgroundColor: '#f5f7fa', justifyContent: 'center', alignItems: 'center' }}
                            >
                              <Feather name="file" size={24} color={Style.headerBgColor} />
                              <Text numberOfLines={2} style={{ fontSize: 9, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 4, textAlign: 'center', paddingHorizontal: 4 }}>
                                {url.split('/').pop().substring(0, 15)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Chat Section Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, marginTop: 8 }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#e6e6e6' }} />
                  <Text style={{ marginHorizontal: 12, fontSize: 12, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Conversation
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: '#e6e6e6' }} />
                </View>

                {/* Messages */}
                {messages.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40, marginHorizontal: 16 }}>
                    <View style={{ backgroundColor: '#f5f7fa', borderRadius: 60, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                      <MaterialCommunityIcons name="chat-outline" size={40} color="#ccc" />
                    </View>
                    <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                      No messages yet
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.placeHolderTextColor, marginTop: 4 }}>
                      Start the conversation
                    </Text>
                  </View>
                ) : (
                  <View style={{ paddingHorizontal: 16 }}>
                    {messages.map((msg, i) => {
                      const isOwn = msg.senderType === 'client';
                      return (
                        <View key={msg._id || i} style={{ marginBottom: 16, alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                          {/* Sender label */}
                          {!isOwn && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginLeft: 4 }}>
                              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#eaf0fb', justifyContent: 'center', alignItems: 'center', marginRight: 6 }}>
                                <Feather name="users" size={12} color={Style.headerBgColor} />
                              </View>
                              <Text style={{ fontSize: 11, fontFamily: 'Lato-SemiBold', color: Style.secondryTextColor }}>
                                {msg.senderType === 'admin' ? 'Support Team' : msg.senderType}
                              </Text>
                            </View>
                          )}
                          
                          {/* Message Bubble */}
                          <View style={{
                            maxWidth: '80%',
                            backgroundColor: isOwn ? Style.headerBgColor : '#f5f7fa',
                            borderRadius: 20,
                            borderBottomRightRadius: isOwn ? 4 : 20,
                            borderBottomLeftRadius: isOwn ? 20 : 4,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            // shadowColor: '#000',
                            // shadowOffset: { width: 0, height: 1 },
                            // shadowOpacity: 0.03,
                            // shadowRadius: 2,
                            // elevation: 1,
                          }}>
                            <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: isOwn ? '#fff' : Style.basicTextColor, lineHeight: 20 }}>
                              {msg.message}
                            </Text>
                          </View>
                          
                          {/* Time + read status */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginHorizontal: 6 }}>
                            <Text style={{ fontSize: 10, fontFamily: 'Lato-Medium', color: Style.placeHolderTextColor }}>
                              {moment(msg.createdAt).format('hh:mm A')}
                            </Text>
                            {isOwn && (
                              <Ionicons
                                name={msg.isRead ? "checkmark-done" : "checkmark"}
                                size={12}
                                color={msg.isRead ? Style.headerBgColor : Style.placeHolderTextColor}
                                style={{ marginLeft: 4 }}
                              />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
                
                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Input Bar */}
              {isClosed ? (
                <View style={{ padding: 16, paddingBottom: insets.bottom + 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e6e6e6', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f7fa', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 10 }}>
                    <Ionicons name="lock-closed" size={14} color={Style.secondryTextColor} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                      This ticket is {ticket?.status?.toLowerCase()}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 12,
                  backgroundColor: '#fff',
                  borderTopWidth: 1, 
                  borderTopColor: '#f0f0f0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.03,
                  shadowRadius: 4,
                  elevation: 5,
                }}>
                  <View style={{ 
                    flex: 1, 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: '#f5f7fa', 
                    borderRadius: 24, 
                    paddingHorizontal: 16, 
                    paddingVertical: 4,
                    marginRight: 12,
                  }}>
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Type your message..."
                      placeholderTextColor={Style.placeHolderTextColor}
                      multiline
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontFamily: 'Lato-Medium',
                        color: Style.basicTextColor,
                        maxHeight: 100,
                        paddingVertical: 10,
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={sendMessage}
                    disabled={!message.trim() || sending}
                    activeOpacity={0.7}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: message.trim() ? Style.headerBgColor : '#e6e6e6',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: message.trim() ? Style.headerBgColor : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 6,
                      elevation: message.trim() ? 4 : 0,
                    }}
                  >
                    {sending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="send" size={20} color={message.trim() ? '#fff' : '#aaa'} />
                    }
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}