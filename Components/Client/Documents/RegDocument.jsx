import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Animated, Modal, Platform, ScrollView, ToastAndroid, ActivityIndicator, Alert, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import SelectDropdown from 'react-native-select-dropdown';
import moment from "moment";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import { AntDesign, Feather, Ionicons, Entypo, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";
import BASE_URL from "../../../Urls/DomainUrl";

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message); // iOS fallback
  }
}

export default function RegDocument({ navigation }) {
 
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading, personalInfoData, error } = useSelector((state) => state.client);
  const [scale] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [docType, setDocType] = useState([]);
  const [docName, setDocName] = useState([]);
  const [docNo, setDocNo] = useState('');
  const [images, setImages] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItem_id, setSelectedItem_id] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [originalDocData, setOriginalDocData] = useState({});
  const logoutHandled = useRef(false);

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0]]);
    }
  };

  const pickSingleImage = async (replaceIndex) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
  
    if (!result.canceled) {
      const newImage = result.assets[0];
  
      const updatedImages = [...images];
      updatedImages[replaceIndex] = newImage; // replace image at index
      setImages(updatedImages);
    }
  };

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
        dispatch(personalInfo());
   }, [dispatch]);

  const regData = personalInfoData?.documentData || [];

  const filteredData = regData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDocType = async ()=>{
    if (logoutHandled.current) return;
     let token = await AsyncStorage.getItem("token");
     if(!token) {
      navigation.navigate('Splash');
      return;
    }
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");
    
    const raw = JSON.stringify({
      "text": "",
      "sort": false,
      "status": "",
      "type": "",
      "isPagination": false
    });
    
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    
    fetch(`${BASE_URL}/client/document/documentType`, requestOptions)
     .then((response) => response.json())
      .then(async(result) => {
        if(result.statusCode === 200){
          setDocType(result?.data?.docs);
        } else if(result.statusCode === 401){
            dispatch(logout());
            await AsyncStorage.removeItem('token');
            await AsyncStorage.clear();
            navigation.navigate('Splash');
        } else{
          showToast(result.message)
        }
      })
      .catch((error) => console.error(error));
  }

  const uploadFile = async () => {
    if (images.length === 0) {
      showToast("Please select at least one image.");
      return;
    }
    if (!docName || !docType) {
      showToast("Please select document type and enter document name.");
      return;
    }
    try {
       if (logoutHandled.current) return;
        let token = await AsyncStorage.getItem("token");
        if(!token) {
         navigation.navigate('Splash');
         return;
       }
      const formData = new FormData();
  
      images.forEach((img, index) => {
        formData.append("filePath", {
          uri: img.uri,
          name: `image_${index}.jpg`, 
          type: 'image/jpeg', 
        });
      });
  
      formData.append("fileLocation", "/clientImage");
      formData.append("isMultiple", "true");
      formData.append("isVideo", "false");
  
      const requestOptions = {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      };
  
      const response = await fetch(`${BASE_URL}/client/auth/fileUpload`, requestOptions);
      const result = await response.json();
  
      if (result.statusCode === 200) {
        showToast(result.message);
        // console.log("Uploaded data:", result);
        setFileData(result.data);
        uploadDoc(result.data);
      }else if(result.statusCode === 401){
        dispatch(logout());
          showToast('Session expired, please login again');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.clear();
          navigation.navigate('Splash');
      } else {
        console.log("Upload failed:", result.message);
        showToast(result.message || "Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Something went wrong.");
    }
  };

  const uploadDoc = async (data) => {
    if (logoutHandled.current) return;
     let token = await AsyncStorage.getItem("token");
     if(!token) {
      navigation.navigate('Splash');
      return;
    }
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + token);
    myHeaders.append("Content-Type", "application/json");

    const hasEdited =
    docName !== originalDocData.name ||
    docNo !== originalDocData.number ||
    images.map(img => img.uri).join() !== originalDocData.images.join();

    const isVerified = hasEdited ? false : originalDocData.isVerified ?? false

      const raw = JSON.stringify({
        "type": "documents",
        "documents": [
          {
            "_id": selectedItem_id || null,
            "userId": personalInfoData?._id,
            "name": docName,
            "number": docNo,
            "filePath": data,
            "isVerified": isVerified
          },
        ],
      });
      
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

    fetch(`${BASE_URL}/client/document/update`, requestOptions)
     .then((response) => response.json())
      .then(async(result) => {
        if(result.statusCode === 200){
          // console.log(result);
          setImages([]);
          setDocName([]);
          setDocNo('');
          dispatch(personalInfo());
          showToast(result.message);
        }else if(result.statusCode === 401){
          dispatch(logout());
          showToast('Session expired, please login again');
          await AsyncStorage.removeItem('token');
          await AsyncStorage.clear();
          navigation.navigate('Autologin');
        }else{
          showToast(result.message || "Document upload failed.");
        }
      })
      .catch((error) => console.error(error));
  }

 const downloadFile = async (fileUrl) => {
  if (!fileUrl) {
    showToast("No file found to download.");
    return;
  }

  try {
    if (logoutHandled.current) return;
    let token = await AsyncStorage.getItem("token");

    if (!token) {
      dispatch(logout());
      showToast("Please login to download documents.");
      navigation.navigate('Autologin'); // or Login screen
      return;
    }

    const filename = fileUrl.split('/').pop();
    const downloadResumable = FileSystem.createDownloadResumable(
      fileUrl,
      FileSystem.documentDirectory + filename
    );

    const { uri } = await downloadResumable.downloadAsync();

    // Only ask for permission if it hasn't already been granted
    let { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
    if (status !== 'granted' && canAskAgain) {
      status = (await MediaLibrary.requestPermissionsAsync()).status;
    }

    if (status === 'granted') {
      // saveToLibraryAsync saves a new asset the app owns, so Android does
      // not show the per-file "modify this photo" prompt on every download
      await MediaLibrary.saveToLibraryAsync(uri);
      showToast("Download complete and saved to your gallery.");
    } else {
      showToast("Permission denied to save the file.");
    }

  } catch (e) {
    console.error("Download error:", e);
    showToast(`Download failed: ${e?.message || e}`);
  }
};


  useEffect(()=>{
    getDocType();
  },[])

   const onRefresh = ()=>{
      setRefresh(true);
      dispatch(personalInfo());
      setTimeout(()=>{
        setRefresh(false);
      },2000)
    }

    const handleClose =()=>{
      setImages([]);
      setDocName([]);
      setDocNo('');
      setModalVisible(!modalVisible);
    }
    const handleClose1 =()=>{
      setImages([]);
      setDocName([]);
      setDocNo('');
      setModalVisible1(!modalVisible1);
    }

    useEffect(() => {
      if (modalVisible1 && selectedItem) {
        const initialDoc = {
          name: selectedItem.name || '',
          number: selectedItem.number || '',
          images: selectedItem.filePath?.map(path => path) || [],
          isVerified: selectedItem.isVerified ?? false
        };
    
        setOriginalDocData(initialDoc);
        setSelectedItem_id(selectedItem._id || "")
        setDocName(initialDoc.name);
        setDocNo(initialDoc.number);
    
        const formattedImages = initialDoc.images.map(path => ({
          uri: path,
        }));
        setImages(formattedImages);
      }
    }, [modalVisible1, selectedItem]);

  return (
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <Animated.View style={{ paddingHorizontal:18, transform: [{ scale }] }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={()=> navigation.goBack()} style={styles.headerIconBtn} activeOpacity={0.75}>
             <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registration Documents</Text>
          <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={styles.headerIconBtn} activeOpacity={0.75}>
             <Feather name="bell" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#94a0b8" style={{ marginLeft: 14 }} />
          <TextInput placeholder="Search by name or document number" placeholderTextColor="#9aa3bf" value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingHorizontal: 12 }}>
              <Ionicons name="close-circle" size={18} color="#9aa3bf" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <View style={styles.bodyWrap} >
        <Animated.View style={{flex:1, transform: [{ scale }] }}>
          <View style={styles.bodyHeaderRow} >
            <View>
              <Text style={styles.bodyTitle}>Registration</Text>
              <Text style={styles.bodySubtitle}>{filteredData.length} {filteredData.length === 1 ? 'document' : 'documents'}</Text>
            </View>
            <TouchableOpacity onPress={()=> setModalVisible(true)} activeOpacity={0.85} style={styles.uploadBtn} >
              <Feather name="upload" size={16} color="#fff" />
              <Text style={styles.uploadBtnText}>Upload</Text>
            </TouchableOpacity>
          </View>
           <Modal
             animationType="slide"
             transparent={true}
             visible={modalVisible}
             onRequestClose={() => setModalVisible(!modalVisible)}
           >
             <View style={styles.modalBackground}>
               <View style={styles.modalContainer}>
                 <View style={[styles.modalHeader, { paddingTop: insets.top, height: 56 + insets.top }]}>
                   <View style={{ flexDirection:'row', alignItems:'center', gap: 10 }}>
                     <View style={styles.modalHeaderIcon}>
                       <Feather name="upload" size={16} color="#fff" />
                     </View>
                     <Text style={styles.modalTitle}>Upload Document</Text>
                   </View>
                   <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                     <Ionicons name="close" size={24} color='#fff' />
                   </TouchableOpacity>
                 </View>
                  <View style={{ padding:16 }}>
                    <Text style={styles.fieldLabel}>Document Type</Text>
                    <TouchableOpacity style={styles.fieldShell} >
                    {Array.isArray(docType) && docType.length > 0 ? (
                      <SelectDropdown
                        data={docType}
                        defaultValue={docType.find(d => d.name === docName) || null}
                        onSelect={(selecteddocType, index) => {
                          setDocName(selecteddocType.name);
                          // showToast(`Selected: ${selecteddocType.name}`);
                        }}
                        renderButton={(selecteddocType, isOpened) => (
                          <View style={styles.dropdownButtonStyle}>
                            <Text style={styles.dropdownButtonTxtStyle}>
                              {selecteddocType ? selecteddocType.name : 'Select Document'}
                            </Text>
                            <Entypo
                              name={isOpened ? 'chevron-up' : 'chevron-down'}
                              style={styles.dropdownButtonArrowStyle}
                            />
                          </View>
                        )}
                        renderItem={(item, index, isSelected) => (
                          <View
                            style={{
                              ...styles.dropdownItemStyle,
                              ...(isSelected && { backgroundColor: '#D2D9DF' }),
                            }}
                          >
                            <Text style={styles.dropdownItemTxtStyle}>
                              {item.name}
                            </Text>
                          </View>
                        )}
                        showsVerticalScrollIndicator={false}
                        dropdownStyle={styles.dropdownMenuStyle}
                      />
                    ) : (
                      <View style={styles.dropdownButtonStyle}>
                        <Text style={styles.dropdownButtonTxtStyle}>No data found</Text>
                        <Entypo
                          name="chevron-down"
                          style={styles.dropdownButtonArrowStyle}
                        />
                      </View>
                    )}
                   </TouchableOpacity>

                    <Text style={styles.fieldLabel}>Document Number</Text>
                    <View style={[styles.fieldShell, { paddingHorizontal: 0, marginBottom: 16 }]}>
                        <TextInput value={docNo} onChangeText={value => setDocNo(value)} placeholder="Enter Document Number" placeholderTextColor="#9aa3bf" style={styles.fieldInput} />
                    </View>

                    <Text style={styles.fieldLabel}>Attachments {images.length > 0 ? `(${images.length}/5)` : ''}</Text>
                    <View style={styles.attachmentGrid}>
                      {images.map((img, index) => (
                        <View key={index} style={styles.attachmentTile}>
                          <Image source={{ uri: img.uri }} style={styles.attachmentImage} />
                        </View>
                      ))}
                      {images.length < 5 && (
                        <TouchableOpacity onPress={pickImages} activeOpacity={0.7} style={styles.attachmentPlaceholder}>
                          <View style={styles.attachmentPlaceholderIcon}>
                            <Ionicons name="add" size={26} color={Style.headerBgColor} />
                          </View>
                          <Text style={styles.attachmentPlaceholderText}>Add Image</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                      <TouchableOpacity onPress={uploadFile} activeOpacity={0.9} style={[styles.modalSubmitBtn, { bottom: insets.bottom + 18 }]} >
                         <Feather name="upload-cloud" size={16} color="#fff" />
                         <Text style={styles.modalSubmitText}>Upload</Text>
                      </TouchableOpacity>
                 </View>
               </View>
           </Modal>
           <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} colors={[Style.headerBgColor]} tintColor={Style.headerBgColor} />} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} style={{ flex:1 }}>
                <View>
                   {
                     isLoading?(
                       <View style={styles.loaderWrap}>
                           <ActivityIndicator size="large" color={Style.headerBgColor} />
                           <Text style={styles.loaderText}>Loading documents…</Text>
                       </View>
                     ):(
                      filteredData.length > 0 ?(
                        filteredData.map((item, index) => {
                          const verified = !!item.isVerified;
                          const fileCount = item.filePath?.length || 0;
                          return(
                              <View key={index} style={styles.docCard} >
                                <View style={styles.docCardHeader} >
                                   <View style={styles.docTitleRow}>
                                     <View style={[styles.docIconWrap, verified ? styles.docIconVerified : styles.docIconUnverified]}>
                                       <MaterialCommunityIcons name="file-document-outline" size={18} color={verified ? '#22a06b' : '#e94e4e'} />
                                     </View>
                                     <View style={{ flex: 1 }}>
                                       <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                                       <View style={styles.docMetaRow}>
                                         <View style={[styles.statusPill, verified ? styles.statusVerified : styles.statusPending]}>
                                           <MaterialIcons name={verified ? 'verified' : 'error-outline'} size={10} color={verified ? '#22a06b' : '#e94e4e'} />
                                           <Text style={[styles.statusText, { color: verified ? '#22a06b' : '#e94e4e' }]}>
                                             {verified ? 'Verified' : 'Pending'}
                                           </Text>
                                         </View>
                                         {fileCount > 0 && (
                                           <View style={styles.fileCountPill}>
                                             <Feather name="paperclip" size={10} color={Style.headerBgColor} />
                                             <Text style={styles.fileCountText}>{fileCount}</Text>
                                           </View>
                                         )}
                                       </View>
                                     </View>
                                   </View>
                                   <View style={styles.docActions} >
                                    <TouchableOpacity activeOpacity={0.7} onPress={() => {
                                        if (item.filePath.length === 0) {
                                          showToast("No images available to download.");
                                        } else {
                                          item.filePath.forEach(url => downloadFile(url));
                                        }
                                      }} style={styles.actionIconBtn} >
                                       <Feather name="download" size={16} color={Style.headerBgColor} />
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.7} onPress={() => {
                                       setSelectedItem(item);
                                       setModalVisible1(true);
                                     }} style={[styles.actionIconBtn, { backgroundColor: Style.headerBgColor }]} >
                                       <Feather name="edit-2" size={14} color="#fff" />
                                    </TouchableOpacity>
                                   </View>
                                </View>

                                {fileCount > 0 && (
                                  <View style={styles.fileChipRow}>
                                    {item.filePath.map((fpath, idx) => (
                                      <View key={idx} style={styles.fileChip}>
                                        <Feather name="file-text" size={11} color={Style.headerBgColor} />
                                        <Text style={styles.fileChipText} numberOfLines={1}>
                                          {fpath.split('/').pop()}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                )}

                                <View style={styles.docFooter}>
                                  <Text style={styles.docFooterLabel}>Document No.</Text>
                                  <Text style={styles.docFooterValue} numberOfLines={1}>{item.number || '—'}</Text>
                                </View>
                              </View>
                           )
                        })
                      ):(
                        <View style={styles.emptyWrap}>
                          <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons name="folder-open-outline" size={32} color={Style.headerBgColor} />
                          </View>
                          <Text style={styles.emptyTitle}>No documents yet</Text>
                          <Text style={styles.emptyHint}>Tap “Upload” to add your first registration document.</Text>
                        </View>
                      )
                     )
                   }
                   <Modal
                     animationType="slide"
                     transparent={true}
                     visible={modalVisible1}
                     onRequestClose={() => setModalVisible1(!modalVisible1)}
                   >
                     <View style={styles.modalBackground}>
                       <View style={styles.modalContainer}>
                         <View style={[styles.modalHeader, { paddingTop: insets.top, height: 56 + insets.top }]}>
                           <View style={{ flexDirection:'row', alignItems:'center', gap: 10 }}>
                             <View style={styles.modalHeaderIcon}>
                               <Feather name="edit-2" size={14} color="#fff" />
                             </View>
                             <Text style={styles.modalTitle}>Update Document</Text>
                           </View>
                           <TouchableOpacity onPress={handleClose1} style={styles.closeButton}>
                             <Ionicons name="close" size={24} color='#fff' />
                           </TouchableOpacity>
                         </View>
                          <View style={{ padding:16 }}>
                            <Text style={styles.fieldLabel}>Document Type</Text>
                            <TouchableOpacity style={styles.fieldShell} >
                             <SelectDropdown
                               data={docType || []}
                               defaultValue={
                                 docType?.find(d => d.name === docName) || null
                               }
                               onSelect={(selecteddocType, index) => {
                                 setDocName(selecteddocType.name);
                                //  showToast(`Selected: ${selecteddocType.name}`);
                               }}
                               renderButton={(selecteddocType, isOpened) => (
                                 <View style={styles.dropdownButtonStyle}>
                                   <Text style={styles.dropdownButtonTxtStyle}>
                                     {selecteddocType ? selecteddocType.name : 'Select Document'}
                                   </Text>
                                   <Entypo
                                     name={isOpened ? 'chevron-up' : 'chevron-down'}
                                     style={styles.dropdownButtonArrowStyle}
                                   />
                                 </View>
                               )}
                               renderItem={(item, index, isSelected) => (
                                 <View
                                   style={{
                                     ...styles.dropdownItemStyle,
                                     ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                   }}
                                 >
                                   <Text style={styles.dropdownItemTxtStyle}>
                                     {item.name}
                                   </Text>
                                 </View>
                               )}
                               showsVerticalScrollIndicator={false}
                               dropdownStyle={styles.dropdownMenuStyle}
                             />
                           </TouchableOpacity>
                            <Text style={styles.fieldLabel}>Document Number</Text>
                            <View style={[styles.fieldShell, { paddingHorizontal: 0, marginBottom: 16 }]}>
                                <TextInput value={docNo} onChangeText={value => setDocNo(value)} placeholder="Enter Document Number" placeholderTextColor="#9aa3bf" style={styles.fieldInput} />
                            </View>
                            <Text style={styles.fieldLabel}>Attachments {images.length > 0 ? `(${images.length}/5)` : ''}</Text>
                            <View style={styles.attachmentGrid}>
                             {images.map((img, index) => (
                               <View key={index} style={styles.attachmentTile}>
                                 <Image source={{ uri: img.uri }} style={styles.attachmentImage} />
                                 <TouchableOpacity onPress={() => pickSingleImage(index)} activeOpacity={0.85} style={styles.attachmentEditBtn}>
                                   <Feather name="edit-2" size={14} color="#fff" />
                                 </TouchableOpacity>
                               </View>
                             ))}
                              {images.length < 5 && (
                                <TouchableOpacity onPress={pickImages} activeOpacity={0.7} style={styles.attachmentPlaceholder}>
                                  <View style={styles.attachmentPlaceholderIcon}>
                                    <Ionicons name="add" size={26} color={Style.headerBgColor} />
                                  </View>
                                  <Text style={styles.attachmentPlaceholderText}>Add Image</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity onPress={uploadFile} activeOpacity={0.9} style={[styles.modalSubmitBtn, { bottom: insets.bottom + 18 }]} >
                             <Feather name="upload-cloud" size={16} color="#fff" />
                             <Text style={styles.modalSubmitText}>Save Changes</Text>
                          </TouchableOpacity>
                         </View>
                       </View>
                   </Modal>
                </View>
           </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* ---- Header ---- */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingBottom: 4,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 46,
    marginTop: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato-Medium',
    color: '#1f2440',
    paddingLeft: 10,
  },

  /* ---- Body ---- */
  bodyWrap: {
    flex: 1,
    backgroundColor: Style.primaryBgColor,
    borderTopStartRadius: 22,
    borderTopEndRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  bodyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  bodyTitle: {
    fontSize: 16,
    fontFamily: 'Lato-Bold',
    color: Style.headerBgColor,
  },
  bodySubtitle: {
    fontSize: 11.5,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Style.headerBgColor,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 999,
    shadowColor: Style.headerBgColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadBtnText: {
    color: '#fff',
    fontFamily: 'Lato-SemiBold',
    fontSize: 12.5,
  },

  /* ---- Document card ---- */
  docCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#eef0fa',
    // shadowColor: '#1f2440',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    // elevation: 2,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconVerified: { backgroundColor: '#e8f7ee' },
  docIconUnverified: { backgroundColor: '#fdecec' },
  docName: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
    color: Style.headerBgColor,
  },
  docMetaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusVerified: { backgroundColor: '#e8f7ee' },
  statusPending: { backgroundColor: '#fdecec' },
  statusText: {
    fontSize: 10,
    fontFamily: 'Lato-SemiBold',
  },
  fileCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
  },
  fileCountText: {
    fontSize: 10,
    fontFamily: 'Lato-SemiBold',
    color: Style.headerBgColor,
  },
  docActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  fileChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f4f6fb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '100%',
  },
  fileChipText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#4c5475',
    maxWidth: 160,
  },
  docFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eef0fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  docFooterLabel: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
    color: '#7c84a3',
    letterSpacing: 0.3,
  },
  docFooterValue: {
    fontSize: 13,
    fontFamily: 'Lato-Bold',
    color: Style.headerBgColor,
    maxWidth: '60%',
  },

  /* ---- Loading / empty ---- */
  loaderWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  loaderText: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
    color: Style.headerBgColor,
  },
  emptyHint: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  /* ---- Modal field helpers ---- */
  modalHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11.5,
    fontFamily: 'Lato-SemiBold',
    color: '#7c84a3',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  fieldShell: {
    width: '100%',
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6eaf5',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Lato-Medium',
    color: Style.headerBgColor,
    paddingHorizontal: 14,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 80,
  },
  attachmentTile: {
    width: '48%',
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#eef2ff',
    position: 'relative',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  attachmentEditBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentPlaceholder: {
    width: '48%',
    height: 140,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cdd6f5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9ff',
  },
  attachmentPlaceholderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  attachmentPlaceholderText: {
    fontSize: 11.5,
    fontFamily: 'Lato-SemiBold',
    color: Style.headerBgColor,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '90%',
    height: 50,
    alignSelf: 'center',
    backgroundColor: Style.headerBgColor,
    borderRadius: 14,
    position: 'absolute',
    bottom: 18,
    shadowColor: Style.headerBgColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  modalSubmitText: {
    color: '#fff',
    fontFamily: 'Lato-SemiBold',
    fontSize: 13.5,
    letterSpacing: 0.3,
  },

  /* ---- Existing dropdown / modal styles ---- */
  dropdownButtonStyle: {
      width: "100%",
      height: 50,
      backgroundColor: '#fff',
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 14,
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
  modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(20, 28, 60, 0.55)',
      justifyContent: "center",
      padding: 0,
    },
    modalContainer: {
      width: '100%',
      backgroundColor: Style.primaryBgColor,
      padding: 0,
      flex:1,
      marginTop:0,
    },
    modalHeader: {
      width: '100%',
      height: 56,
      backgroundColor: Style.headerBgColor,
      flexDirection: 'row',
      justifyContent: "space-between",
      alignItems: 'center',
      paddingHorizontal: 14,
    },
    modalTitle: {
      fontFamily: 'Lato-Bold',
      color: "#fff",
      fontSize: 15,
      letterSpacing: 0.3,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.18)',
      justifyContent: 'center',
      alignItems: 'center',
    },
});