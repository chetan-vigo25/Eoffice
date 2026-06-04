import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Linking, Alert, Animated, ScrollView, ToastAndroid, ActivityIndicator, Image, StatusBar } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../../Urls/DomainUrl';
import moment from "moment";
import { useDispatch } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { useFocusEffect } from '@react-navigation/native';
import { AntDesign, FontAwesome, Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

function showToast(message) {
  ToastAndroid.show(message, ToastAndroid.SHORT);
}

const PRIORITY_COLORS = {
  high:   { bg: '#fdecea', text: '#c0392b' },
  medium: { bg: '#fff4e5', text: '#d97706' },
  low:    { bg: '#edfaf1', text: '#27ae60' },
};

const STATUS_COLORS = {
  Task_Stop:   { bg: '#fdecea', text: '#c0392b' },
  Completed:   { bg: '#edfaf1', text: '#27ae60' },
  Assigned:    { bg: '#eaf0fb', text: '#1d64c8' },
};
function getStatusStyle(status) {
  return STATUS_COLORS[status] || { bg: '#fff4e5', text: '#d97706' };
}
function formatStatus(status) {
  return status?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || '-';
}

const SectionTitle = ({ title }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 4 }}>
    <View style={{ width: 3, height: 16, backgroundColor: Style.headerBgColor, borderRadius: 2, marginRight: 8 }} />
    <Text style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>{title}</Text>
  </View>
);

const Card = ({ children, style }) => (
  <View style={[{
    backgroundColor: Style.basicbgColor,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: '#e6e6e6',
  }, style]}>
    {children}
  </View>
);

const Row = ({ label, value, highlight = false }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginBottom: 3 }}>{label}</Text>
    <Text style={{
      fontSize: 13, fontFamily: 'Lato-SemiBold',
      color: highlight ? Style.headerBgColor : Style.basicTextColor,
    }}>{value || '-'}</Text>
  </View>
);

const TwoCol = ({ children }) => (
  <View style={{ flexDirection: 'row', gap: 16 }}>
    <View style={{ flex: 1 }}>{children[0]}</View>
    <View style={{ flex: 1 }}>{children[1]}</View>
  </View>
);

const Divider = () => <View style={{ height: 0.5, backgroundColor: '#f0f0f0', marginVertical: 10 }} />;

export default function TaskSummary({ navigation, route }) {
  const dispatch = useDispatch();
  const { _id } = route.params;
  const maxStars = 5;
  const [rating, setRating]           = useState(0);
  const [slideAnim]                   = useState(new Animated.Value(30));
  const [loading, setLoading]         = useState(false);
  const [taskSumry, setTaskSumry]     = useState(null);
  const [review, setReview]           = useState('');
  const [taskReview, setTaskReview]   = useState(null);
  const logoutHandled                 = useRef(false);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
  }, []);

  useFocusEffect(React.useCallback(() => { taskDetail(); }, []));

  const taskDetail = async () => {
    if (logoutHandled.current) return;
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    if (!token) { navigation.navigate('Autologin'); return; }
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/task/view`, { method: "POST", headers, body: JSON.stringify({ _id }), redirect: "follow" })
      .then(r => r.json())
      .then(async result => {
        if (result.statusCode === 200) {
          // console.log('Task Summary:', JSON.stringify(result.data, null, 2));
          setTaskSumry(result.data);
          setRating(result.data?.taskRatingData?.rating || 0);
          const rv = result.data?.taskReviewData || null;
          setTaskReview(rv);
          setReview(rv?.feedback || '');
        } else if (result.statusCode === 401) {
          dispatch(logout()); await AsyncStorage.clear(); navigation.navigate('Autologin');
        } else { showToast(result.message); }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const sendReview = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    if (!token) { navigation.navigate('Autologin'); return; }
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/taskReview/create`, { method: "POST", headers, body: JSON.stringify({ taskId: _id, feedback: review }), redirect: "follow" })
      .then(r => r.json())
      .then(async result => {
        if (result.statusCode === 200) { showToast(result.message); setReview(''); taskDetail(); }
        else if (result.statusCode === 401) { dispatch(logout()); await AsyncStorage.clear(); navigation.navigate('Autologin'); }
        else { showToast(result.message); }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const updateReview = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/taskReview/update`, { method: "POST", headers, body: JSON.stringify({ _id: taskReview?._id, taskId: _id, feedback: review }), redirect: "follow" })
      .then(r => r.json())
      .then(result => {
        if (result.statusCode === 200) { showToast(result.message); setReview(''); taskDetail(); }
        else { showToast(result.message); }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const sendRating = async (value) => {
    setLoading(true);
    const token = await AsyncStorage.getItem("token");
    if (!token) { navigation.navigate('Autologin'); return; }
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/taskReview/rating`, { method: "POST", headers, body: JSON.stringify({ taskId: _id, rating: value }), redirect: "follow" })
      .then(r => r.json())
      .then(async result => {
        if (result.statusCode === 200) { setRating(value); taskDetail(); }
        else if (result.statusCode === 401) { dispatch(logout()); await AsyncStorage.clear(); navigation.navigate('Autologin'); }
        else { showToast(result.message); }
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const comments = taskSumry?.assignTaskList?.[0]?.commentData || [];
  const employees = taskSumry?.assignTaskList?.[0]?.employeData || [];
  const branch = taskSumry?.clientBranch;
  const dept = taskSumry?.departmentData;
  const statusStyle = getStatusStyle(taskSumry?.status);
  const priorityStyle = PRIORITY_COLORS[taskSumry?.priority?.toLowerCase()] || PRIORITY_COLORS.medium;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle="light-content" />

      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
            <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 17, fontFamily: 'Lato-SemiBold' }} numberOfLines={1}>
              {/* {taskSumry?.taskName || 'Task Summary'} */}
              Task Summary
            </Text>
            {taskSumry?.code ? (
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Lato-Medium', marginTop: 2 }}>
                {taskSumry.code}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
            {dept?.mobile?.number ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${dept.mobile.code}${dept.mobile.number}`)}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
              >
                <Feather name="phone-call" size={17} color="#fff" />
              </TouchableOpacity>
            ) : null}
            {dept?.email ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${dept.email}`)}
                style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
              >
                <MaterialCommunityIcons name="email-outline" size={18} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <Animated.View style={{
        flex: 1, backgroundColor: Style.primaryBgColor,
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        transform: [{ translateY: slideAnim }],
      }}>
        {loading && !taskSumry ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Style.headerBgColor} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

            {/* ── Status + Priority strip ── */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              <View style={{ flex: 1, backgroundColor: statusStyle.bg, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: statusStyle.text, marginBottom: 2 }}>Status</Text>
                <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: statusStyle.text }}>
                  {formatStatus(taskSumry?.status)}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: priorityStyle.bg, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: priorityStyle.text, marginBottom: 2 }}>Priority</Text>
                <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: priorityStyle.text, textTransform: 'capitalize' }}>
                  {taskSumry?.priority || '-'}
                </Text>
              </View>
              {taskSumry?.isOverDue && (
                <View style={{ flex: 1, backgroundColor: '#fdecea', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: '#c0392b', marginBottom: 2 }}>Overdue</Text>
                  <Ionicons name="warning-outline" size={16} color="#c0392b" />
                </View>
              )}
            </View>

            {/* ── Task Info ── */}
            <SectionTitle title="Task Information" />
            <Card>
              <Row label="Task Name" value={taskSumry?.taskName} highlight />
              <Divider />
              <TwoCol>
                <Row label="Task Code" value={taskSumry?.code} />
                <Row label="Fees" value={taskSumry?.fee ? `₹ ${taskSumry.fee}` : '-'} />
              </TwoCol>
              <TwoCol>
                <Row label="Type" value={taskSumry?.type} />
                <Row label="Financial Year" value={taskSumry?.financialYear} />
              </TwoCol>
              {taskSumry?.monthName ? (
                <TwoCol>
                  <Row label="Month" value={taskSumry?.monthName} />
                  <Row label="Quarter" value={taskSumry?.monthQuaters || '-'} />
                </TwoCol>
              ) : null}
              <TwoCol>
                <Row label="Due Date" value={taskSumry?.dueDate ? moment.utc(taskSumry.dueDate).format('DD MMM YYYY') : '-'} />
                <Row label="Assigned On" value={taskSumry?.createdAt ? moment(taskSumry.createdAt).format('DD MMM YYYY') : '-'} />
              </TwoCol>
              {taskSumry?.remarks ? (
                <>
                  <Divider />
                  <Row label="Remarks" value={taskSumry.remarks} />
                </>
              ) : null}
              {taskSumry?.description ? (
                <Row label="Description" value={taskSumry.description} />
              ) : null}
            </Card>

            {/* ── Client & Branch ── */}
            <SectionTitle title="Client & Branch" />
            <Card>
              <Row label="Client Name" value={taskSumry?.clientData?.fullName} highlight />
              {branch ? (
                <>
                  <Divider />
                  <Row label="Branch Name" value={branch.fullName} />
                  <TwoCol>
                    <Row label="Branch Email" value={branch.email} />
                    <Row label="Branch Phone" value={branch.mobile?.number ? `${branch.mobile.code} ${branch.mobile.number}` : '-'} />
                  </TwoCol>
                  {branch.branchProfile?.GSTNumber ? (
                    <Row label="GST Number" value={branch.branchProfile.GSTNumber} />
                  ) : null}
                  {branch.addresses?.primary?.street ? (
                    <Row
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
                </>
              ) : null}
            </Card>

            {/* ── Department ── */}
            <SectionTitle title="Department" />
            <Card>
              <Row label="Department Name" value={dept?.name} highlight />
              <TwoCol>
                <Row label="Email" value={dept?.email} />
                <Row label="Phone" value={dept?.mobile?.number ? `${dept.mobile.code} ${dept.mobile.number}` : '-'} />
              </TwoCol>
            </Card>

            {/* ── Assigned To ── */}
            <SectionTitle title="Assigned By" />
            <Card>
              <Row label="Assigned By" value={taskSumry?.creatorData?.fullName} />
              {employees.length > 0 && (
                <>
                  <Divider />
                  <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginBottom: 8 }}>
                    Team Members
                  </Text>
                  {employees.map((emp, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i < employees.length - 1 ? 10 : 0 }}>
                      {emp.profileImage && !emp.profileImage.includes('placeholder') ? (
                        <Image source={{ uri: emp.profileImage }} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10, backgroundColor: '#eee' }} />
                      ) : (
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${Style.headerBgColor}18`, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                          <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>
                            {emp.fullName?.charAt(0) || 'U'}
                          </Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.basicTextColor }}>{emp.fullName}</Text>
                    </View>
                  ))}
                </>
              )}
            </Card>

            {/* ── Activity / Comments ── */}
            <SectionTitle title="Activity" />
            <Card>
              {comments.length > 0 ? (
                comments.map((item, index) => {
                  const cs = getStatusStyle(item.status);
                  const isTaskReq = item.type === 'taskReq';
                  return (
                    <View key={index}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        {/* Avatar */}
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: `${Style.headerBgColor}18`, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 }}>
                          <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>
                            {item.creatorData?.fullName?.charAt(0) || 'U'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          {/* Name + status badge */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}>
                              {item.creatorData?.fullName || 'Unknown'}
                            </Text>
                            {item.status ? (
                              <View style={{ backgroundColor: cs.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                <Text style={{ fontSize: 10, fontFamily: 'Lato-SemiBold', color: cs.text }}>
                                  {formatStatus(item.status)}
                                </Text>
                              </View>
                            ) : isTaskReq ? (
                              <View style={{ backgroundColor: item.isReqApproved === 'approved' ? '#edfaf1' : '#fff4e5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                <Text style={{ fontSize: 10, fontFamily: 'Lato-SemiBold', color: item.isReqApproved === 'approved' ? '#27ae60' : '#d97706' }}>
                                  {item.isReqApproved === 'approved' ? 'Approved' : 'Task Request'}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          {/* Message */}
                          {item.message ? (
                            <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.basicTextColor, lineHeight: 18, marginBottom: 4 }}>
                              {item.message}
                            </Text>
                          ) : null}
                          {/* Date */}
                          <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                            {moment(item.createdAt).format('DD MMM YYYY, hh:mm A')}
                          </Text>
                        </View>
                      </View>
                      {index < comments.length - 1 && <Divider />}
                    </View>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Feather name="message-circle" size={36} color="#ccc" />
                  <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 8 }}>No activity yet</Text>
                </View>
              )}
            </Card>

            {/* ── Rating ── */}
            <SectionTitle title="Task Rating" />
            <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {Array.from({ length: maxStars }, (_, i) => (
                  <TouchableOpacity key={i} onPress={() => sendRating(i + 1)} activeOpacity={0.7}>
                    <FontAwesome name={i < rating ? 'star' : 'star-o'} size={30} color="#FBBF24" />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>
                {rating > 0 ? `You rated ${rating} out of 5` : 'Tap a star to rate this task'}
              </Text>
              {taskSumry?.taskRatingData?.createdAt ? (
                <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 4 }}>
                  Rated on {moment(taskSumry.taskRatingData.createdAt).format('DD MMM YYYY')}
                </Text>
              ) : null}
            </Card>

            {/* ── Review ── */}
            <SectionTitle title="Your Review" />
            <Card>
              {taskReview?.updatedAt && (
                <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginBottom: 10 }}>
                  Last updated: {moment(taskReview.updatedAt).format('DD MMM YYYY, hh:mm A')}
                </Text>
              )}
              <TextInput
                value={review}
                onChangeText={setReview}
                placeholder="Write your review here..."
                placeholderTextColor={Style.placeHolderTextColor}
                style={{
                  backgroundColor: Style.inputBgColor,
                  borderRadius: 10, padding: 12,
                  color: Style.basicTextColor,
                  fontSize: 13, fontFamily: 'Lato-Medium',
                  borderWidth: 1, borderColor: '#e0e0e0',
                  minHeight: 80, textAlignVertical: 'top',
                  marginBottom: 12,
                }}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                disabled={review.trim() === '' || loading}
                onPress={taskReview ? updateReview : sendReview}
                activeOpacity={0.8}
                style={{
                  height: 46, borderRadius: 10,
                  backgroundColor: review.trim() === '' ? '#e0e0e0' : Style.headerBgColor,
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontSize: 14, fontFamily: 'Lato-SemiBold', color: review.trim() === '' ? '#999' : '#fff' }}>
                    {taskReview ? 'Update Review' : 'Submit Review'}
                  </Text>
                )}
              </TouchableOpacity>
            </Card>

          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
