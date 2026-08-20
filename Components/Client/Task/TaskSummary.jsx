import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Linking, Alert, Animated, ScrollView, ToastAndroid, ActivityIndicator, Image, StatusBar, Platform, Keyboard } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL, { IMAGE_FILEPATH_URL } from '../../../Urls/DomainUrl';
import moment from "moment";
import { useDispatch } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import { useFocusEffect } from '@react-navigation/native';
import { AntDesign, FontAwesome, Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

// Server origin (without /api/v1) — used to resolve relative attachment paths
const FILE_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');

// Build a full URL from an attachment value (handles absolute URLs and relative paths)
const resolveFileUrl = (p) => {
  if (!p || typeof p !== 'string') return '';
  if (/^https?:\/\//i.test(p)) return p;
  return `${FILE_ORIGIN}${p.startsWith('/') ? '' : '/'}${p}`;
};

const isImageUrl = (url) => /\.(jpe?g|png|gif|webp|bmp|heic)(\?|$)/i.test(url || '');
const isPdfUrl = (url) => /\.pdf(\?|$)/i.test(url || '');

// Derive a readable file name from a path/url
const getFileName = (url) => (url ? decodeURIComponent(url.split('/').pop().split('?')[0]) : 'Attachment');

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

/* ── People (assigned by / assigned to / reporting manager) ── */

// `profileImage` arrives as a server-relative path such as "/uploads/x.jpeg".
const resolveProfileImage = (path) => {
  if (!path || typeof path !== 'string') return '';
  const value = path.trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${IMAGE_FILEPATH_URL.replace(/\/+$/, '')}/${value.replace(/^\/+/, '')}`;
};

const formatMobile = (mobile) => {
  const number = mobile?.number?.toString().trim();
  if (!number) return '';
  return `${mobile?.code ? `${mobile.code} ` : ''}${number}`;
};

/** Photo when there is one, initial when there is a name, icon when there is neither. */
const Avatar = ({ image, name, size = 44 }) => {
  const [failed, setFailed] = useState(false);
  const uri = resolveProfileImage(image);
  const initial = name?.trim()?.charAt(0)?.toUpperCase();

  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: `${Style.headerBgColor}14`,
      justifyContent: 'center', alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1, borderColor: `${Style.headerBgColor}22`,
    }}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : initial ? (
        <Text style={{ fontSize: size * 0.38, fontFamily: 'Lato-SemiBold', color: Style.headerBgColor }}>{initial}</Text>
      ) : (
        <Feather name="user" size={size * 0.45} color={Style.headerBgColor} />
      )}
    </View>
  );
};

const RoleTag = ({ text }) => (
  <View style={{ backgroundColor: '#eaf0fb', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
    <Text style={{ fontSize: 10, fontFamily: 'Lato-SemiBold', color: '#1d64c8' }}>{text}</Text>
  </View>
);

/** Contact line — tappable when there is something to open. */
const ContactLine = ({ icon, value, href }) => {
  if (!value) return null;
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 }}>
      <Feather name={icon} size={12} color={Style.secondryTextColor} />
      <Text
        numberOfLines={1}
        style={{ flex: 1, fontSize: 12, fontFamily: 'Lato-Medium', color: href ? Style.headerBgColor : Style.secondryTextColor }}
      >
        {value}
      </Text>
    </View>
  );
  if (!href) return content;
  return (
    <TouchableOpacity onPress={() => Linking.openURL(href).catch(() => {})} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
};

/** One person block. `compact` is used for the nested reporting manager. */
const Person = ({ person, compact = false }) => {
  if (!person) return null;
  const phone = formatMobile(person.mobile);
  const designation = person.designationData?.name;
  const department = person.departmentData?.name;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <Avatar image={person.profileImage} name={person.fullName} size={compact ? 36 : 44} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize: compact ? 13 : 14, fontFamily: 'Lato-SemiBold', color: Style.primaryTextColor }}
          >
            {person.fullName || 'Unnamed'}
          </Text>
          {designation ? <RoleTag text={designation} /> : null}
        </View>

        {department ? (
          <Text numberOfLines={2} style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 2 }}>
            {department}
          </Text>
        ) : null}

        <ContactLine icon="mail" value={person.email} href={person.email ? `mailto:${person.email}` : null} />
        <ContactLine icon="phone" value={phone} href={phone ? `tel:${phone.replace(/\s+/g, '')}` : null} />

        {!person.email && !phone && !department && !designation ? (
          <Text style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 4 }}>
            No contact details available
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const EmptyPeople = ({ text }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
    <Feather name="user-x" size={14} color={Style.secondryTextColor} />
    <Text style={{ fontSize: 12, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>{text}</Text>
  </View>
);

export default function TaskSummary({ navigation, route }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { _id } = route.params;
  const maxStars = 5;
  const [rating, setRating]           = useState(0);
  const [slideAnim]                   = useState(new Animated.Value(30));
  const [loading, setLoading]         = useState(false);
  const [taskSumry, setTaskSumry]     = useState(null);
  const [review, setReview]           = useState('');
  const [taskReview, setTaskReview]   = useState(null);
  const logoutHandled                 = useRef(false);
  const scrollRef                     = useRef(null);
  const reviewFocused                 = useRef(false);
  const keyboardUp                    = useRef(false);
  const [kbHeight, setKbHeight]       = useState(0);

  // The window does not resize when the keyboard opens (edge-to-edge ignores
  // adjustResize), so reserve the keyboard's height as scroll padding ourselves
  // and scroll the review box — the last card — into the space above it.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardUp.current = true;
      setKbHeight(e?.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardUp.current = false;
      setKbHeight(0);
    });

    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

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

  const assignBlock = taskSumry?.assignTaskList?.[0] || {};
  const comments = assignBlock.commentData || [];
  const employees = Array.isArray(assignBlock.employeData)
    ? assignBlock.employeData
    : (Array.isArray(taskSumry?.employeData) ? taskSumry.employeData : []);
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
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              if (reviewFocused.current && keyboardUp.current) {
                scrollRef.current?.scrollToEnd({ animated: true });
              }
            }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 + Math.max(insets.bottom, kbHeight) }}
          >

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

            {/* ── Attachments (only if the task has documents with files) ── */}
            {(() => {
              const docs = Array.isArray(taskSumry?.taskDocuments) ? taskSumry.taskDocuments : [];
              // Flatten every document's attachment array, keeping the parent message for context
              const files = docs.flatMap((doc) => {
                const list = Array.isArray(doc.attachment) ? doc.attachment : (doc.attachment ? [doc.attachment] : []);
                return list.filter(Boolean).map((path) => ({ path, message: doc.message, status: doc.status }));
              });
              if (files.length === 0) return null;

              const openFile = (url) => {
                if (!url) { showToast('File not available.'); return; }
                Linking.openURL(url).catch(() => showToast('Unable to open attachment.'));
              };

              return (
                <>
                  <SectionTitle title={`Attachments (${files.length})`} />
                  <Card>
                    {files.map((f, idx) => {
                      const url = resolveFileUrl(f.path);
                      const name = getFileName(url);
                      const image = isImageUrl(url);
                      const pdf = isPdfUrl(url);
                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.7}
                          onPress={() => openFile(url)}
                          style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingVertical: 12,
                            borderTopWidth: idx === 0 ? 0 : 0.5, borderTopColor: '#f0f0f0',
                          }}
                        >
                          {image ? (
                            <Image source={{ uri: url }} style={{ width: 46, height: 46, borderRadius: 8, backgroundColor: '#eef2ff' }} />
                          ) : (
                            <View style={{ width: 46, height: 46, borderRadius: 8, backgroundColor: pdf ? '#fdecea' : '#eef2ff', justifyContent: 'center', alignItems: 'center' }}>
                              <MaterialCommunityIcons
                                name={pdf ? 'file-pdf-box' : 'file-document-outline'}
                                size={26}
                                color={pdf ? '#c0392b' : Style.headerBgColor}
                              />
                            </View>
                          )}
                          <View style={{ flex: 1, marginHorizontal: 12 }}>
                            <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: 'Lato-SemiBold', color: Style.basicTextColor }}>
                              {name}
                            </Text>
                            {f.message ? (
                              <Text numberOfLines={2} style={{ fontSize: 11, fontFamily: 'Lato-Medium', color: Style.secondryTextColor, marginTop: 3 }}>
                                {f.message}
                              </Text>
                            ) : null}
                          </View>
                          <Feather name="external-link" size={18} color={Style.headerBgColor} />
                        </TouchableOpacity>
                      );
                    })}
                  </Card>
                </>
              );
            })()}

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

            {/* ── Assigned To (with each member's reporting manager) ── */}
            <SectionTitle title="Assigned To" />
            <Card>
              {employees.length === 0 ? (
                <EmptyPeople text="No team member assigned yet." />
              ) : (
                employees.map((emp, i) => (
                  <View key={emp?._id || i}>
                    <Person person={emp} />

                    {emp?.managerData ? (
                      <View style={{
                        marginTop: 12, marginLeft: 12,
                        paddingLeft: 14, paddingVertical: 10, paddingRight: 10,
                        borderLeftWidth: 2, borderLeftColor: `${Style.headerBgColor}25`,
                        backgroundColor: '#fafbfd', borderRadius: 10,
                      }}>
                        <Text style={{
                          fontSize: 10, fontFamily: 'Lato-SemiBold',
                          color: Style.secondryTextColor, letterSpacing: 0.6,
                          marginBottom: 8, textTransform: 'uppercase',
                        }}>
                          Reporting Manager
                        </Text>
                        <Person person={emp.managerData} compact />
                      </View>
                    ) : null}

                    {i < employees.length - 1 ? <Divider /> : null}
                  </View>
                ))
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

            {/* ── Rating & Review (only once the task is completed) ── */}
            {taskSumry?.status === 'Completed' && (
              <>
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
                    onFocus={() => { reviewFocused.current = true; }}
                    onBlur={() => { reviewFocused.current = false; }}
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
              </>
            )}

          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
