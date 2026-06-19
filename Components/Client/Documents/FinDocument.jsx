import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Animated, ScrollView, Platform, Modal, ToastAndroid, ActivityIndicator, Alert, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";
import SelectDropdown from 'react-native-select-dropdown';
import DatePicker from 'react-native-modern-datepicker';
import moment from "moment";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import MonthPicker from 'react-native-month-year-picker';

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

export default function FinDocument({ navigation }) {
 
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading, personalInfoData, error } = useSelector((state) => state.client);
  const [scale] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible1, setModalVisible1] = useState(false);
  const [docType, setDocType] = useState([]);
  const [docName, setDocName] = useState([]);
  const [images, setImages] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(new Date());
  const [fiscalYear, setFiscalYear] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItem_id, setSelectedItem_id] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [originalDocData, setOriginalDocData] = useState({});
  const[selectedType, setSelectedType] = useState(null);
  const [quarterData, setQuarterData] = useState([]);
  const [monthsData, setMonthsData] = useState([]);
  const logoutHandled = useRef(false);

  const onChange = (event, selectedDate) => {
    if (event === 'dismissed') {
      setShow(false);
      return;
    }

    const chosenDate = selectedDate || date;
    setDate(chosenDate);
    setShow(false);

    // Calculate financial year based on April–March cycle
    const month = chosenDate.getMonth(); // Jan = 0, April = 3
    const year = chosenDate.getFullYear();
    const fyStart = month >= 3 ? year : year - 1;
    const fyEnd = fyStart + 1;

    setFiscalYear(`${fyStart}-${fyEnd}`);
  };

  const showPicker = () => setShow(true);

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
      "type": "Financial",
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
          // console.log("financial",result);
          setDocType(result?.data?.docs);
        }else if(result.statusCode === 401){
            dispatch(logout());
            await AsyncStorage.removeItem('token');
            await AsyncStorage.clear();
            navigation.navigate('Splash');
        }else{
          showToast(result.message)
        }
      })
      .catch((error) => console.error(error));
  }

  const uploadFile = async () => {
    // console.log("image........")
    if (!docName || !fiscalYear || images.length === 0) {
      showToast("All fields are required.");
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
      formData.append("isMultiple", "false");
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
        // console.log("Uploaded data finance:", result);
        setFileData(result.data);
        uploadDoc(result.data);
      }else if(result.statusCode === 401){
        showToast("Session expired, please login again");
        dispatch(logout());
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
    fiscalYear !== originalDocData.yearRange ||
    images.map(img => img.uri).join() !== originalDocData.images.join();

    const isVerified = hasEdited ? false : originalDocData.isVerified ?? false
    
    const raw = JSON.stringify({
      "type": "financial",
      "financialInfo": [
        {
          "_id": selectedItem_id || null,
          "userId": personalInfoData?._id,
          "name": docName,
          "yearRange": fiscalYear,
          "filePath": data,
          "isVerified":isVerified,
          "type": selectedType,
           monthName: selectedType === 'Monthly' ? monthsData : '',
           monthQuaters: selectedType === 'Quaterly' ? quarterData : '',
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
          setFiscalYear('');
          setSelectedType(null);
          setQuarterData([]);
          setMonthsData([]);
          dispatch(personalInfo());
          showToast(result.message);
        }else if(result.statusCode === 401){
          showToast("Session expired, please login again");
          dispatch(logout());
          await AsyncStorage.removeItem('token');
          await AsyncStorage.clear();
          navigation.navigate('Autologin');
        }else{
          console.log(result.message || "Document upload failed.");
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

   useEffect(() => {
        dispatch(personalInfo());
   }, [dispatch]);

  const financeDataList = personalInfoData?.financeData || [];

  const filteredData = financeDataList.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.yearRange.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setFiscalYear('');
    setSelectedType(null);
    setQuarterData([]);
    setMonthsData([]);
    setModalVisible(!modalVisible)
  }
  const handleClose1 =()=>{
    setImages([]);
    setDocName([]);
    setFiscalYear('');
    setSelectedType(null);
    setQuarterData([]);
    setMonthsData([]);
    setModalVisible1(!modalVisible1)
  }

  useEffect(() => {
    if (modalVisible1 && selectedItem) {
      const initialDoc = {
        name: selectedItem.name || '',
        yearRange: selectedItem.yearRange || '',
        type: selectedItem.type || '',
        monthQuaters: selectedItem.monthQuaters || '',
        monthName: selectedItem.monthName || '',
        images: selectedItem.filePath?.map(path => path) || [],
        isVerified: selectedItem.isVerified ?? false,
      };
  
      setOriginalDocData(initialDoc);
      setSelectedItem_id(selectedItem._id || "");
      setDocName(initialDoc.name);
      setFiscalYear(initialDoc.yearRange);
      setFiscalYear(initialDoc.yearRange);
      setSelectedType(initialDoc.type);
      setQuarterData(initialDoc.monthQuaters);
      setMonthsData(initialDoc.monthName);
  
      const formattedImages = initialDoc.images.map(path => ({
        uri: path,
      }));
      setImages(formattedImages);
    }
  }, [modalVisible1, selectedItem]);

  // for (let year = 2000; year <= 2049; year++) {
  //   const yearRange = `${year}-${year + 1}`;
  //   yearRanges.push(yearRange);
  // }

   const generateFinancialYearPairs = () => {
     const currentYear = new Date().getFullYear();
     const yearPairs = [];
     for (let year = currentYear - 50; year <= currentYear + 50; year++) {
       yearPairs.push(`${year}-${year + 1}`);
     }
     return yearPairs;
   };

  const yearRanges = generateFinancialYearPairs()
  const quarter = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <Animated.View style={{ paddingHorizontal:18, transform: [{ scale }] }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn} activeOpacity={0.75}>
             <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Financial Documents</Text>
          <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={styles.headerIconBtn} activeOpacity={0.75}>
             <Feather name="bell" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#94a0b8" style={{ marginLeft: 14 }} />
          <TextInput placeholder="Search by name or financial year" placeholderTextColor="#9aa3bf" value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} />
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
              <Text style={styles.bodyTitle}>Financial</Text>
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
                  <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
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
                    <Text style={styles.fieldLabel}>Year Range</Text>
                    <TouchableOpacity style={styles.fieldShell} >
                    <SelectDropdown
                      data={yearRanges}
                      onSelect={(selectedYearRange, index) => {
                        setFiscalYear(selectedYearRange);
                        // showToast(`Selected: ${selectedYearRange}`);
                      }}
                      renderButton={(selectedYearRange, isOpened) => {
                        return (
                          <View style={styles.dropdownButtonStyle}>
                            <Text style={styles.dropdownButtonTxtStyle}>
                              {selectedYearRange ? selectedYearRange : 'Select Year Range'}
                            </Text>
                            <Entypo
                              name={isOpened ? 'chevron-up' : 'chevron-down'}
                              style={styles.dropdownButtonArrowStyle}
                            />
                          </View>
                        );
                      }}
                      renderItem={(yearRange, index, isSelected) => {
                        return (
                          <View
                            style={{
                              ...styles.dropdownItemStyle,
                              ...(isSelected && { backgroundColor: '#D2D9DF' }),
                            }}
                          >
                            <Text style={styles.dropdownItemTxtStyle}>
                              {yearRange}  {/* Display the year range */}
                            </Text>
                          </View>
                        );
                      }}
                      showsVerticalScrollIndicator={false}
                      dropdownStyle={styles.dropdownMenuStyle}
                    />
                    </TouchableOpacity>
                     
                    <Text style={styles.fieldLabel}>Period</Text>
                    <View style={{ width:'100%', gap:10, flexDirection:'row', justifyContent:'space-between', marginTop: -8 }} >
                      <View style={{ flex:1 }} >
                        <TouchableOpacity style={[styles.fieldShell, { marginBottom: 0 }]} >
                        <SelectDropdown
                          data={["Quaterly", "Monthly", "Yearly"]}
                          onSelect={(selectedType, index) => {
                            setSelectedType(selectedType);
                            // showToast(`Selected: ${selectedType}`);
                          }}
                          renderButton={(selectedType, isOpened) => {
                            return (
                              <View style={styles.dropdownButtonStyle}>
                                <Text style={styles.dropdownButtonTxtStyle}>
                                  {selectedType ? selectedType : 'Select Type'}
                                </Text>
                                <Entypo
                                  name={isOpened ? 'chevron-up' : 'chevron-down'}
                                  style={styles.dropdownButtonArrowStyle}
                                />
                              </View>
                            );
                          }}
                          renderItem={(selectedType, index, isSelected) => {
                            return (
                              <View
                                style={{
                                  ...styles.dropdownItemStyle,
                                  ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                }}
                              >
                                <Text style={styles.dropdownItemTxtStyle}>
                                  {selectedType}  {/* Display the year range */}
                                </Text>
                              </View>
                            );
                          }}
                          showsVerticalScrollIndicator={false}
                          dropdownStyle={styles.dropdownMenuStyle}
                        />
                      </TouchableOpacity>
                      </View>
                      <View style={{ flex:1 }} >
                          {selectedType === "Quaterly" && (
                            <View style={[styles.fieldShell, { marginBottom: 0 }]}>
                            <SelectDropdown
                              data={quarter}
                              onSelect={(quarterType, index) => {
                                setQuarterData(quarterType);
                              }}
                              renderButton={(quarterType, isOpened) => (
                                <View style={styles.dropdownButtonStyle}>
                                  <Text style={styles.dropdownButtonTxtStyle}>
                                    {quarterType ? quarterType : 'Select Quarter'}
                                  </Text>
                                  <Entypo
                                    name={isOpened ? 'chevron-up' : 'chevron-down'}
                                    style={styles.dropdownButtonArrowStyle}
                                  />
                                </View>
                              )}
                              renderItem={(quarterType, index, isSelected) => (
                                <View
                                  style={{
                                    ...styles.dropdownItemStyle,
                                    ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                  }}
                                >
                                  <Text style={styles.dropdownItemTxtStyle}>{quarterType}</Text>
                                </View>
                              )}
                              showsVerticalScrollIndicator={false}
                              dropdownStyle={styles.dropdownMenuStyle}
                            />
                            </View>
                           )}

                           { selectedType === "Monthly" && (
                            <View style={[styles.fieldShell, { marginBottom: 0 }]}>
                            <SelectDropdown
                              data={months}
                              onSelect={(monthsType, index) => {
                                setMonthsData(monthsType);
                              }}
                              renderButton={(monthsType, isOpened) => (
                                <View style={styles.dropdownButtonStyle}>
                                  <Text style={styles.dropdownButtonTxtStyle}>
                                    {monthsType ? monthsType : 'Select Month'}
                                  </Text>
                                  <Entypo
                                    name={isOpened ? 'chevron-up' : 'chevron-down'}
                                    style={styles.dropdownButtonArrowStyle}
                                  />
                                </View>
                              )}
                              renderItem={(monthsType, index, isSelected) => (
                                <View
                                  style={{
                                    ...styles.dropdownItemStyle,
                                    ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                  }}
                                >
                                  <Text style={styles.dropdownItemTxtStyle}>{monthsType}</Text>
                                </View>
                              )}
                              showsVerticalScrollIndicator={false}
                              dropdownStyle={styles.dropdownMenuStyle}
                            />
                            </View>
                          )}
                      </View>
                    </View>

                    <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Attachments {images.length > 0 ? `(${images.length}/5)` : ''}</Text>
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
                  </ScrollView>
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
                        filteredData?.map((item, index) => {
                          const verified = !!item.isVerified;
                          const fileCount = item.filePath?.length || 0;
                          const periodLabel = item.type === 'Monthly' ? item.monthName
                                           : item.type === 'Quaterly' ? item.monthQuaters
                                           : item.type === 'Yearly' ? 'Yearly'
                                           : '';
                          return(
                              <View key={index} style={styles.docCard} >
                                 <View style={styles.docCardHeader} >
                                    <View style={styles.docTitleRow}>
                                      <View style={[styles.docIconWrap, verified ? styles.docIconVerified : styles.docIconUnverified]}>
                                        <MaterialCommunityIcons name="file-chart-outline" size={18} color={verified ? '#22a06b' : '#e94e4e'} />
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
                                   <View style={styles.docFooterCol}>
                                     <Text style={styles.docFooterLabel}>Financial Year</Text>
                                     <Text style={styles.docFooterValue} numberOfLines={1}>{item.yearRange || '—'}</Text>
                                   </View>
                                   {!!periodLabel && (
                                     <View style={[styles.docFooterCol, { alignItems: 'flex-end' }]}>
                                       <Text style={styles.docFooterLabel}>Period</Text>
                                       <Text style={styles.docFooterValue} numberOfLines={1}>{periodLabel}</Text>
                                     </View>
                                   )}
                                 </View>
                              </View>
                           )
                        })
                      ):(
                        <View style={styles.emptyWrap}>
                          <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons name="folder-open-outline" size={32} color={Style.headerBgColor} />
                          </View>
                          <Text style={styles.emptyTitle}>No financial documents</Text>
                          <Text style={styles.emptyHint}>Tap “Upload” to add a financial document for any year.</Text>
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
                         <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom }} showsVerticalScrollIndicator={false}>
                           <Text style={styles.fieldLabel}>Document Type</Text>
                           <View style={styles.fieldShell} >
                            <SelectDropdown
                              data={docType || []}
                              defaultValue={
                                docType?.find(d => d.name === docName) || null
                              }
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
                          </View>
                          <Text style={styles.fieldLabel}>Year Range</Text>
                          <View style={styles.fieldShell} >
                          <SelectDropdown
                            data={yearRanges}
                            defaultValue={fiscalYear}
                            onSelect={(selectedYearRange, index) => {
                              setFiscalYear(selectedYearRange); 
                              // showToast(`Selected: ${selectedYearRange}`); 
                            }}
                            renderButton={(selectedYearRange, isOpened) => {
                              return (
                                <View style={styles.dropdownButtonStyle}>
                                  <Text style={styles.dropdownButtonTxtStyle}>
                                    {selectedYearRange ? selectedYearRange : 'Select Year Range'}
                                  </Text>
                                  <Entypo
                                    name={isOpened ? 'chevron-up' : 'chevron-down'}
                                    style={styles.dropdownButtonArrowStyle}
                                  />
                                </View>
                              );
                            }}
                            renderItem={(yearRange, index, isSelected) => {
                              return (
                                <View
                                  style={{
                                    ...styles.dropdownItemStyle,
                                    ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                  }}
                                >
                                  <Text style={styles.dropdownItemTxtStyle}>
                                    {yearRange} 
                                  </Text>
                                </View>
                              );
                            }}
                            showsVerticalScrollIndicator={false}
                            dropdownStyle={styles.dropdownMenuStyle}
                          />
                          </View>

                          <Text style={styles.fieldLabel}>Period</Text>
                          <View style={{ width:'100%', gap:10, flexDirection:'row', justifyContent:'space-between', marginTop: -8 }} >
                      <View style={{ flex:1 }} >
                        <View style={[styles.fieldShell, { marginBottom: 0 }]} >
                        <SelectDropdown
                          data={["Quaterly", "Monthly", "Yearly"]}
                          defaultValue={selectedType}
                          onSelect={(selectedType, index) => {
                            setSelectedType(selectedType);
                            // showToast(`Selected: ${selectedType}`); 
                          }}
                          renderButton={(selectedType, isOpened) => {
                            return (
                              <View style={styles.dropdownButtonStyle}>
                                <Text style={styles.dropdownButtonTxtStyle}>
                                  {selectedType ? selectedType : 'Select Type'}
                                </Text>
                                <Entypo
                                  name={isOpened ? 'chevron-up' : 'chevron-down'}
                                  style={styles.dropdownButtonArrowStyle}
                                />
                              </View>
                            );
                          }}
                          renderItem={(selectedType, index, isSelected) => {
                            return (
                              <View
                                style={{
                                  ...styles.dropdownItemStyle,
                                  ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                }}
                              >
                                <Text style={styles.dropdownItemTxtStyle}>
                                  {selectedType}  {/* Display the year range */}
                                </Text>
                              </View>
                            );
                          }}
                          showsVerticalScrollIndicator={false}
                          dropdownStyle={styles.dropdownMenuStyle}
                        />
                      </View>
                      </View>
                          <View style={{ flex:1 }} >
                              {selectedType === "Quaterly" && (
                                <View style={[styles.fieldShell, { marginBottom: 0 }]}>
                                <SelectDropdown
                                  data={quarter}
                                  defaultValue={quarterData}
                                  onSelect={(quarterType, index) => {
                                    setQuarterData(quarterType);
                                  }}
                                  renderButton={(quarterType, isOpened) => (
                                    <View style={styles.dropdownButtonStyle}>
                                      <Text style={styles.dropdownButtonTxtStyle}>
                                        {quarterType ? quarterType : 'Select Quarter'}
                                      </Text>
                                      <Entypo
                                        name={isOpened ? 'chevron-up' : 'chevron-down'}
                                        style={styles.dropdownButtonArrowStyle}
                                      />
                                    </View>
                                  )}
                                  renderItem={(quarterType, index, isSelected) => (
                                    <View
                                      style={{
                                        ...styles.dropdownItemStyle,
                                        ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                      }}
                                    >
                                      <Text style={styles.dropdownItemTxtStyle}>{quarterType}</Text>
                                    </View>
                                  )}
                                  showsVerticalScrollIndicator={false}
                                  dropdownStyle={styles.dropdownMenuStyle}
                                />
                                </View>
                               )}

                               { selectedType === "Monthly" && (
                                <View style={[styles.fieldShell, { marginBottom: 0 }]}>
                                <SelectDropdown
                                  data={months}
                                  defaultValue={monthsData}
                                  onSelect={(monthsType, index) => {
                                    setMonthsData(monthsType);
                                  }}
                                  renderButton={(monthsType, isOpened) => (
                                    <View style={styles.dropdownButtonStyle}>
                                      <Text style={styles.dropdownButtonTxtStyle}>
                                        {monthsType ? monthsType : 'Select Month'}
                                      </Text>
                                      <Entypo
                                        name={isOpened ? 'chevron-up' : 'chevron-down'}
                                        style={styles.dropdownButtonArrowStyle}
                                      />
                                    </View>
                                  )}
                                  renderItem={(monthsType, index, isSelected) => (
                                    <View
                                      style={{
                                        ...styles.dropdownItemStyle,
                                        ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                      }}
                                    >
                                      <Text style={styles.dropdownItemTxtStyle}>{monthsType}</Text>
                                    </View>
                                  )}
                                  showsVerticalScrollIndicator={false}
                                  dropdownStyle={styles.dropdownMenuStyle}
                                />
                                </View>
                              )}

                          </View>
                         </View>

                           <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Attachments {images.length > 0 ? `(${images.length}/5)` : ''}</Text>
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
                           </ScrollView>
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
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.06,
    // shadowRadius: 8,
    // elevation: 3,
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
    gap: 12,
  },
  docFooterCol: {
    flex: 1,
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
    marginTop: 2,
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