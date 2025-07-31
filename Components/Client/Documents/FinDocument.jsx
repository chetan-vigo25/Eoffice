import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Animated, SafeAreaView, ScrollView, Platform, Modal, ToastAndroid, ActivityIndicator, Alert, StyleSheet, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import SelectDropdown from 'react-native-select-dropdown';
import DatePicker from 'react-native-modern-datepicker';
import moment from "moment";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import MonthPicker from 'react-native-month-year-picker';

import { AntDesign, Feather, Ionicons, Entypo, MaterialIcons } from "@expo/vector-icons";
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
    let token = await AsyncStorage.getItem("token");
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
      .then((result) => {
        if(result.statusCode === 200){
          // console.log("financial",result?.data?.docs);
          setDocType(result?.data?.docs);
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
      let token = await AsyncStorage.getItem("token");
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
        // showToast(result.message);
        // console.log("Uploaded data finance:", result);
        setFileData(result.data);
        uploadDoc(result.data);
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

    let token = await AsyncStorage.getItem("token");
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
console.log('requestOptions', requestOptions)
    fetch(`${BASE_URL}/client/document/update`, requestOptions)
     .then((response) => response.json())
      .then((result) => {
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
       const filename = fileUrl.split('/').pop();
       const downloadResumable = FileSystem.createDownloadResumable(
         fileUrl,
         FileSystem.documentDirectory + filename
       );
   
       const { uri } = await downloadResumable.downloadAsync();
   
       // Request permission to save to media library
       const { status } = await MediaLibrary.requestPermissionsAsync();
       if (status === 'granted') {
         const asset = await MediaLibrary.createAssetAsync(uri);
         await MediaLibrary.createAlbumAsync('Documents', asset, false);
         showToast("Download complete and saved to Documents folder.");
       } else {
         showToast("Permission denied to save the file.");
       }
   
     } catch (e) {
       console.error("Download error:", e);
       showToast("Download failed.");
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
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <Animated.View style={{ paddingHorizontal:20, transform: [{ scale }] }}>
        <View style={{ flexDirection: 'row', width: '100%', marginTop: 0, alignItems:'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start' }}>
             <AntDesign name="arrowleft" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{color: '#fff', fontSize: 14, fontWeight: '500', flex: 1, }}>Financial Documents</Text>
        </View>
        <View style={{flexDirection: 'row',alignItems: 'center', marginTop: 20, marginBottom: 20,}}>
          <View style={{flex: 8, flexDirection: 'row', alignItems: 'center', backgroundColor:Style.basicbgColor,borderRadius: 50, height: 50, elevation: 4 }}>
            <TextInput placeholder="Search" value={searchQuery} onChangeText={setSearchQuery} style={{flex: 9, fontSize: 18,padding: 10,paddingLeft: 20,}} />
            <TouchableOpacity style={{ flex: 1.5, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={require('../../../assets/oui_search.png')} resizeMode='contain' style={{ width: 20, height: 20,}} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={()=> navigation.navigate('Notifikation')} style={{ flex:1.5, width: 50, height: 50, borderRadius: 50, justifyContent: 'center', alignItems:"flex-end" }}>
             <Feather name="bell" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
        
      <View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20 }} >
        <Animated.View style={{flex:1, transform: [{ scale }] }}>
          <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingBottom:10 }} >
            <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor }}>Financial Documents</Text>
              <TouchableOpacity onPress={()=> setModalVisible(true)} style={{ flexDirection:'row', gap:10, backgroundColor:Style.headerBgColor, paddingHorizontal:10, height:40, justifyContent:'center', alignItems:'center', borderRadius:6 }} >
                <Feather name="upload" size={20} color="#fff" />
                <Text style={{ color:'#fff', fontFamily:'Poppins-Medium', fontSize:12, }} >Documents</Text>
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
                 <View style={styles.modalHeader}>
                   <Text style={styles.modalTitle}>Upload Documents</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                      <Ionicons name="close-sharp" size={32} color='#fff' />
                    </TouchableOpacity>
                 </View>
                  <View style={{ padding:10 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    <TouchableOpacity style={{ width:'100%', height:40, backgroundColor:"#eee", borderRadius:6, marginBottom:10, justifyContent:'space-between'}} >
                     {Array.isArray(docType) && docType.length > 0 ? (
                      <SelectDropdown
                        data={docType}
                        defaultValue={docType.find(d => d.name === docName) || null}
                        onSelect={(selecteddocType, index) => {
                          setDocName(selecteddocType.name);
                          showToast(`Selected: ${selecteddocType.name}`);
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
                    <TouchableOpacity style={{ width:'100%', height:40, backgroundColor:"#eee", borderRadius:6, marginBottom:10, justifyContent:'space-between'}} >
                    <SelectDropdown
                      data={yearRanges}
                      onSelect={(selectedYearRange, index) => {
                        setFiscalYear(selectedYearRange); 
                        showToast(`Selected: ${selectedYearRange}`); 
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
                     
                    <View style={{ width:'100%', gap:10, flexDirection:'row', justifyContent:'space-between', }} >
                      <View style={{ flex:1 }} >
                        <TouchableOpacity style={{ width:'100%', height:40, backgroundColor:"#eee", borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                        <SelectDropdown
                          data={["Quaterly", "Monthly", "Yearly"]}
                          onSelect={(selectedType, index) => {
                            setSelectedType(selectedType); 
                            showToast(`Selected: ${selectedType}`); 
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
                            <SelectDropdown
                              data={quarter}
                              onSelect={(quarterType, index) => {
                                setQuarterData(quarterType); 
                                showToast(`Selected Quarter: ${quarterType}`); 
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
                           )}
                           
                           { selectedType === "Monthly" && (
                            <SelectDropdown
                              data={months}
                              onSelect={(monthsType, index) => {
                                setMonthsData(monthsType); 
                                showToast(`Selected Month: ${monthsType}`); 
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
)                          }
                      </View>
                    </View>
                      {images.map((img, index) => (
                        <TouchableOpacity
                          key={index}
                          style={{
                            width: '48%',
                            height: 150,
                            borderWidth: 1,
                            borderRadius: 10,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          disabled={true}
                        >
                          <Image
                            source={{ uri: img.uri }}
                            style={{ width: '100%', height: '100%', borderRadius: 10 }}
                          />
                        </TouchableOpacity>
                      ))}
                
                      {/* Show new image picker if less than max (optional limit) */}
                      {images.length < 5 && (
                        <TouchableOpacity
                          onPress={pickImages}
                          style={{
                            width: '48%',
                            height: 150,
                            borderWidth: 1,
                            borderRadius: 10,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Ionicons name="image-outline" size={40} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                      <TouchableOpacity onPress={uploadFile} style={{ width:'90%', height:45, justifyContent:'center', alignItems:'center', alignSelf:'center', backgroundColor:Style.headerBgColor, borderRadius:6, position:'absolute', bottom:20,  }} >
                         <Text style={{ color:'#fff', fontFamily:'Poppins-Medium', fontSize:12, }} >Upload</Text>
                      </TouchableOpacity>
                 </View>
               </View>
           </Modal>
           <ScrollView refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} style={{ flex:1 }}>
                <View>
                   {
                     isLoading?(
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
                          <ActivityIndicator size="large" color="#0000ff" />
                      </View>
                     ):(
                      filteredData.length > 0 ?(
                        filteredData?.map((item, index) => {
                          return(
                              <View key={index} style={{ width:'100%', backgroundColor:Style.basicbgColor, borderRadius:10, marginBottom:10, padding:10 }} >
                                 <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center' }} >
                                    <View style={{ flexDirection:'row', gap:10, alignItems:'center' }}>
                                       <MaterialIcons name="verified-user" size={16} color={item.isVerified ? 'green' : 'red'} />
                                       <Text style={{ fontSize:16, fontWeight:"500", color:Style.headerBgColor }}>{item.name}</Text>
                                     </View>
                                     <View style={{ flexDirection:'row', gap:10 }} >
                                       <TouchableOpacity onPress={() => {
                                           if (item.filePath.length === 0) {
                                             showToast("No images available to download.");
                                           } else {
                                             item.filePath.forEach(url => downloadFile(url));
                                           }
                                         }} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
                                           <Feather name="download" size={22} color={Style.placeHolderTextColor} />
                                       </TouchableOpacity>
                                       <TouchableOpacity onPress={() => {
                                          setSelectedItem(item);
                                          setModalVisible1(true);
                                        }} style={{ width:30, height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
                                          <Feather name="edit" size={22} color={Style.placeHolderTextColor} />
                                       </TouchableOpacity>
                                     </View>
                                 </View>
                                  {
                                   item.filePath.map((fpath, index)=>{
                                     return(
                                       <Text key={index} style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.secondryTextColor }}>{fpath.split('/').pop()}</Text>
                                     )
                                   })
                                  }
                                 <View style={{ flexDirection:'row', alignItems:'center', paddingVertical:5 }}>
                                    <Text style={{ fontSize:16, fontFamily:'Poppins-SemiBold', color:Style.secondryTextColor }}>FY : </Text>
                                    <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.placeHolderTextColor }}>{item.yearRange}</Text>
                                 </View>
                              </View>
                           )
                        })
                      ):(
                        <Text style={{ fontSize: 18, fontWeight: '600', color: Style.secondryTextColor, textAlign: 'center', paddingVertical: 20 }}>
                            No Data Found
                        </Text>
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
                        <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>Updata Documents</Text>
                          <TouchableOpacity onPress={handleClose1} style={styles.closeButton}>
                            <Ionicons name="close-sharp" size={32} color='#fff' />
                          </TouchableOpacity>
                        </View>
                         <View style={{ padding:10 }}>
                           <TouchableOpacity style={{ width:'100%', height:40, backgroundColor:"#eee", borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                            <SelectDropdown
                              data={docType || []}
                              defaultValue={
                                docType?.find(d => d.name === docName) || null
                              }
                              onSelect={(selecteddocType, index) => {
                                setDocName(selecteddocType.name);
                                showToast(`Selected: ${selecteddocType.name}`);
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
                          <TouchableOpacity style={{ width:'100%', height:40, backgroundColor:"#eee", borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                          <SelectDropdown
                            data={yearRanges}
                            defaultValue={fiscalYear}
                            onSelect={(selectedYearRange, index) => {
                              setFiscalYear(selectedYearRange); 
                              showToast(`Selected: ${selectedYearRange}`); 
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
                          </TouchableOpacity>

                             <View style={{ width:'100%', gap:10, flexDirection:'row', justifyContent:'space-between', }} >
                      <View style={{ flex:1 }} >
                        <TouchableOpacity style={{ width:'100%', height:40, backgroundColor:"#eee", borderRadius:6, marginBottom:20, justifyContent:'space-between'}} >
                        <SelectDropdown
                          data={["Quaterly", "Monthly", "Yearly"]}
                          defaultValue={selectedType}
                          onSelect={(selectedType, index) => {
                            setSelectedType(selectedType); 
                            showToast(`Selected: ${selectedType}`); 
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
                                <SelectDropdown
                                  data={quarter}
                                  defaultValue={quarterData}
                                  onSelect={(quarterType, index) => {
                                    setQuarterData(quarterType); 
                                    showToast(`Selected Quarter: ${quarterType}`); 
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
                               )}
                               
                               { selectedType === "Monthly" && (
                                <SelectDropdown
                                  data={months}
                                  defaultValue={monthsData}
                                  onSelect={(monthsType, index) => {
                                    setMonthsData(monthsType); 
                                    showToast(`Selected Month: ${monthsType}`); 
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
)                               }
                              
                          </View>
                         </View>

                           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                             {images.map((img, index) => (
                               <View
                                 key={index}
                                 style={{ width: '48%', height: 150, borderWidth: 1, borderRadius: 10, overflow: 'hidden', position: 'relative', }} >
                                 <Image
                                   source={{ uri: img.uri }}
                                   style={{ width: '100%', height: '100%' }}
                                 />
                             
                                 <TouchableOpacity
                                   onPress={() => pickSingleImage(index)}
                                   style={{ position: 'absolute', top: 5, right: 5, backgroundColor: '#000000aa', padding: 5, borderRadius: 20, }} >
                                   <Feather name="edit" size={18} color="#fff" />
                                 </TouchableOpacity>
                               </View>
                             ))}
                              {images.length < 5 && (
                                <TouchableOpacity
                                  onPress={pickImages}
                                  style={{ width: '48%', height: 150, borderWidth: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center',}} >
                                  <Ionicons name="image-outline" size={40} color="#999" />
                                </TouchableOpacity>
                              )}
                            </View>
                           </View>
                           <TouchableOpacity onPress={uploadFile} style={{ width:'90%', height:45, justifyContent:'center', alignItems:'center', alignSelf:'center', backgroundColor:Style.headerBgColor, borderRadius:6, position:'absolute', bottom:20,  }} >
                              <Text style={{ color:'#fff', fontFamily:'Poppins-Medium', fontSize:12, }} >Submit</Text>
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
  dropdownButtonStyle: {
      width: "100%",
      height: 50,
      backgroundColor: Style.basicbgColor,
      borderRadius: 6,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,
      elevation:1
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
      backgroundColor: '#00000095',
      justifyContent: "center",
      padding: 0,
    },
    modalContainer: {
      width: '100%',
      backgroundColor: Style.primaryBgColor,
      padding: 0,
      borderRadius: 5,
      flex:1,
      marginTop:60
    },
    modalHeader: {
      width: '100%',
      height: 50,
      backgroundColor: Style.headerBgColor,
      flexDirection: 'row',
      justifyContent: "space-between",
      alignItems: 'center',
      padding: 10,
    },
    modalTitle: {
      fontFamily: 'Roboto-Bold',
      color: "#fff",
      fontSize: 14,
    },
    closeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
});