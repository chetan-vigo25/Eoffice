import React, { useState, useEffect, useRef } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Animated, ScrollView, ToastAndroid, ActivityIndicator, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import SelectDropdown from 'react-native-select-dropdown';
import * as ImagePicker from 'expo-image-picker';
import BASE_URL from '../../Urls/DomainUrl';
import { useDispatch } from 'react-redux';
import { logout } from "../../Redux/Reducer/Auth/Auth.reducers";
import { AntDesign, Entypo, Feather } from "@expo/vector-icons";
import Style from "../../Style/Style";

function showToast(msg) { ToastAndroid.show(msg, ToastAndroid.SHORT); }

export default function SupportCreate({ navigation, route }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const ticket = route.params?.ticket || null;
  const isEdit = !!ticket;

  const [slideAnim] = useState(new Animated.Value(30));
  const [title, setTitle] = useState(ticket?.title || ''); // This will store selected problem NAME
  const [problemList, setProblemList] = useState([]); // Renamed to avoid confusion - stores the list of problems from API
  const [description, setDescription] = useState(ticket?.description || '');
  const [departmentId, setDepartmentId] = useState(ticket?.departmentData?._id || '');
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [problemLoading, setProblemLoading] = useState(true);
  const [localImages, setLocalImages] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState(ticket?.attachment || []);
  const [uploading, setUploading] = useState(false);
  const MAX_ATTACHMENTS = 5;
  const [user, setUser] = useState(null);

  const getUserData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user');
      if (jsonValue != null) {
        const userData = JSON.parse(jsonValue);
        setUser(userData);
        return userData;
      } else {
        return null;
      }
    } catch (e) {
      console.log('Error fetching data:', e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const user = await getUserData();
      // console.log('User:', user?.companyId);
    };
    loadData();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    fetchDepartments();
    fetchProblemList();
  }, []);

  const fetchDepartments = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/task/department`, { method: "POST", headers, redirect: "follow" })
      .then(r => r.json())
      .then(result => { if (result.statusCode === 200) setDepartments(result.data || []); })
      .catch((error) => {console.log("API error:", error)});
  };

  const fetchProblemList = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) { setProblemLoading(false); return; }
    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      "text": "",
      "status": true,
      "page": 1,
      "limit": 100,
      "isPagination": true
    });

    fetch(`${BASE_URL}/admin/master/others/problem/list`, {
      method: "POST",
      headers,
      body: raw,
      redirect: "follow"
    })
      .then(r => r.json())
      .then(result => {
        if (result.statusCode === 200) {
          setProblemList(result?.data?.docs || []);
        }
      })
      .catch((error) => { console.log("API error:", error); })
      .finally(() => setProblemLoading(false));
  };

  const pickImages = async () => {
    const currentCount = uploadedUrls.length + localImages.length;
    if (currentCount >= MAX_ATTACHMENTS) {
      showToast(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
      return;
    }
    const remaining = MAX_ATTACHMENTS - currentCount;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (!result.canceled) {
      setLocalImages(prev => [...prev, ...result.assets]);
    }
  };

  const removeLocalImage = (index) =>
    setLocalImages(prev => prev.filter((_, i) => i !== index));

  const removeUploadedUrl = (index) =>
    setUploadedUrls(prev => prev.filter((_, i) => i !== index));

  const uploadImages = async (token) => {
    if (localImages.length === 0) return uploadedUrls;
    const formData = new FormData();
    localImages.forEach((img, index) => {
      formData.append("filePath", {
        uri: img.uri,
        name: `attachment_${index}.jpg`,
        type: 'image/jpeg',
      });
    });
    formData.append("fileLocation", "/clientImage");
    formData.append("isMultiple", "true");
    formData.append("isVideo", "false");
    const response = await fetch(`${BASE_URL}/client/auth/fileUpload`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "Content-Type": "multipart/form-data" },
      body: formData,
    });
    const result = await response.json();
    if (result.statusCode === 200) {
      return [...uploadedUrls, ...(result.data || [])];
    }
    throw new Error(result.message || "Upload failed");
  };

 const handleSubmit = async () => {
  if (!title.trim())       { showToast('Please select a problem'); return; }
  if (!description.trim()) { showToast('Description is required'); return; }

  setIsLoading(true);

  const token = await AsyncStorage.getItem("token");
  if (!token) { navigation.navigate('Autologin'); return; }

  let allUrls = uploadedUrls;

  if (localImages.length > 0) {
    setUploading(true);
    try {
      allUrls = await uploadImages(token);
      setUploading(false);
    } catch (e) {
      setUploading(false);
      setIsLoading(false);
      showToast(e.message || 'Attachment upload failed');
      return;
    }
  }

  const headers = {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json"
  };

  const body = isEdit
    ? { 
        companyId: user?.companyId, 
        branchId: user?.branchId, 
        _id: ticket._id, 
        title: title.trim(),
        description: description.trim(), 
        attachment: allUrls 
      }
    : { 
        companyId: user?.companyId, 
        branchId: user?.branchId, 
        title: title.trim(),
        description: description.trim(), 
        attachment: allUrls, 
        ...(departmentId ? { departmentId } : {}) 
      };

  const endpoint = isEdit
    ? `${BASE_URL}/client/department/support/update`
    : `${BASE_URL}/client/department/support/create`;

  // ✅ LOG EVERYTHING BEFORE API HIT
  // console.log("Request Payload:", body);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const result = await response.json();

    if (result.statusCode === 200) {
      showToast(result.message);
      navigation.goBack();
    } else if (result.statusCode === 401) {
      dispatch(logout());
      await AsyncStorage.clear();
      navigation.navigate('Autologin');
    } else {
      showToast(result.message);
    }

  } catch (e) {
    console.log("Fetch Error:", e);
  } finally {
    setIsLoading(false);
  }
};

  const canSubmit = title.trim() !== '' && description.trim() !== '';
  const totalImages = uploadedUrls.length + localImages.length;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle="light-content" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontFamily: 'Lato-SemiBold', flex: 1 }}>
          {isEdit ? 'Edit Ticket' : 'New Ticket'}
        </Text>
      </View>

      <Animated.View style={{ flex: 1, backgroundColor: Style.primaryBgColor, borderTopLeftRadius: 20, borderTopRightRadius: 20, transform: [{ translateY: slideAnim }] }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">

           {/* Department (only on create) */}
          {!isEdit && departments.length > 0 && (
            <>
              <Text style={label}>Department<Text style={{ color: '#ef4444' }}> *</Text></Text>
              <SelectDropdown
                data={departments}
                defaultValueByIndex={departments.findIndex(d => d._id === departmentId)}
                onSelect={item => setDepartmentId(item._id)}
                renderButton={(selected, isOpen) => (
                  <View style={[input, { flexDirection: 'row', alignItems: 'center', height: 50, marginBottom: 20 }]}>
                    <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Lato-Medium', color: selected ? Style.primaryTextColor : Style.placeHolderTextColor }}>
                      {selected ? selected.name : 'Select Department (Optional)'}
                    </Text>
                    <Entypo name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Style.secondryTextColor} />
                  </View>
                )}
                renderItem={(item, _, isSelected) => (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isSelected ? '#f0f4ff' : '#fff' }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: Style.primaryTextColor }}>{item.name}</Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                dropdownStyle={{ borderRadius: 10, backgroundColor: '#fff' }}
              />
            </>
          )}

          {/* Problem Dropdown */}
          <Text style={label}>Problem Type <Text style={{ color: '#ef4444' }}>*</Text></Text>
          {problemLoading ? (
            <View style={[input, { height: 50, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }]}>
              <ActivityIndicator size="small" color={Style.headerBgColor} />
              <Text style={{ marginLeft: 8, fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>Loading...</Text>
            </View>
          ) : problemList.length > 0 ? (
            <SelectDropdown
              data={problemList}
              defaultValueByIndex={problemList.findIndex(p => p.name === title)}
              onSelect={item => setTitle(item.name)}
              renderButton={(selected, isOpen) => (
                <View style={[input, { flexDirection: 'row', alignItems: 'center', height: 50, marginBottom: 20, borderColor: title ? Style.headerBgColor : '#e0e0e0' }]}>
                  <Text style={{ flex: 1, fontSize: 14, fontFamily: 'Lato-Medium', color: selected ? Style.primaryTextColor : Style.placeHolderTextColor }}>
                    {selected ? selected.name : 'Select Problem Type'}
                  </Text>
                  <Entypo name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Style.secondryTextColor} />
                </View>
              )}
              renderItem={(item, _, isSelected) => (
                <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isSelected ? '#f0f4ff' : '#fff' }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: Style.primaryTextColor }}>{item.name}</Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
              dropdownStyle={{ borderRadius: 10, backgroundColor: '#fff', maxHeight: 300 }}
            />
          ) : (
            <View style={[input, { height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }]}>
              <Text style={{ fontSize: 13, fontFamily: 'Lato-Medium', color: Style.secondryTextColor }}>No problem types available</Text>
            </View>
          )}

          {/* Description */}
          <Text style={label}>Query <Text style={{ color: '#ef4444' }}>*</Text></Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your issue in detail..."
            placeholderTextColor={Style.placeHolderTextColor}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[input, { height: 120 }, description ? { borderColor: Style.headerBgColor } : {}]}
          />

          {/* Attachments */}
          <Text style={label}>Attachments <Text style={{ color: Style.secondryTextColor, fontSize: 11 }}>(Optional)</Text></Text>

          {/* Image grid */}
          {totalImages > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12, gap: 10 }}>
              {/* Already-uploaded URLs */}
              {uploadedUrls.map((url, i) => (
                <View key={`up-${i}`} style={thumb}>
                  <Image
                    source={{ uri: url.startsWith('http') ? url : `${BASE_URL}${url}` }}
                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeUploadedUrl(i)}
                    style={thumbRemove}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <AntDesign name="close" size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {/* Locally picked images (not yet uploaded) */}
              {localImages.map((img, i) => (
                <View key={`loc-${i}`} style={thumb}>
                  <Image
                    source={{ uri: img.uri }}
                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => removeLocalImage(i)}
                    style={thumbRemove}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <AntDesign name="close" size={10} color="#fff" />
                  </TouchableOpacity>
                  {/* "new" indicator */}
                  <View style={{ position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 9, color: '#fff', fontFamily: 'Lato-Medium' }}>new</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add image button */}
          <TouchableOpacity
            onPress={pickImages}
            disabled={totalImages >= MAX_ATTACHMENTS}
            style={[input, {
              flexDirection: 'row', alignItems: 'center', height: 48, marginBottom: 20, justifyContent: 'center',
              opacity: totalImages >= MAX_ATTACHMENTS ? 0.45 : 1,
            }]}
          >
            <Feather name="image" size={16} color={Style.headerBgColor} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: Style.headerBgColor }}>
              {totalImages >= MAX_ATTACHMENTS
                ? `Limit reached (${MAX_ATTACHMENTS}/${MAX_ATTACHMENTS})`
                : totalImages > 0
                  ? `Add More Images (${totalImages}/${MAX_ATTACHMENTS})`
                  : `Add Images (max ${MAX_ATTACHMENTS})`}
            </Text>
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            disabled={!canSubmit || isLoading}
            onPress={handleSubmit}
            activeOpacity={0.8}
            style={{
              height: 50, borderRadius: 12, marginTop: 8,
              backgroundColor: canSubmit ? Style.headerBgColor : '#e0e0e0',
              justifyContent: 'center', alignItems: 'center',
            }}
          >
            {isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 14, fontFamily: 'Lato-Medium', color: '#fff' }}>
                  {uploading ? 'Uploading...' : 'Saving...'}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 15, fontFamily: 'Lato-SemiBold', color: canSubmit ? '#fff' : '#999' }}>
                {isEdit ? 'Update Ticket' : 'Submit Ticket'}
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const label = {
  fontSize: 12,
  fontFamily: 'Lato-SemiBold',
  color: Style.secondryTextColor,
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

const input = {
  backgroundColor: Style.basicbgColor,
  borderRadius: 10,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  fontFamily: 'Lato-Medium',
  color: Style.basicTextColor,
  borderWidth: 1,
  borderColor: '#e0e0e0',
  marginBottom: 20,
};

const thumb = {
  width: 76,
  height: 76,
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative',
};

const thumbRemove = {
  position: 'absolute',
  top: 4,
  right: 4,
  width: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
};