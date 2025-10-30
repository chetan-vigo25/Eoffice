import React, { useState, useEffect , useRef} from "react";
import { View, Text, TouchableOpacity, TextInput, Image, Animated, Linking, SafeAreaView, LayoutAnimation, UIManager, Alert, Platform, ScrollView, ToastAndroid, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../../Urls/DomainUrl';
import moment from "moment";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from "../../../Redux/Reducer/Auth/Auth.reducers";

import { AntDesign, FontAwesome, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Style from "../../../Style/Style";

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) {
      setTimeout(onOk, 2000);
    }
  } else {
    Alert.alert(
      '',
      message,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onOk) onOk();
          },
        },
      ],
      { cancelable: false }
    );
  }
}

export default function TaskSummary({ navigation, route }) {

  const dispatch = useDispatch();
  const { _id } = route.params; 
  const maxStars = 5;
  const [rating, setRating] = useState(0);
  const [slideAnim] = useState(new Animated.Value(30)); 
  const [loading, setLoading] = useState(false);  
  const [taskSumry, setTaskSumry] = useState([]);
  const [review, setReview] = useState('');
  const [taskReview, setTaskReview] = useState('');
  const logoutHandled = useRef(false);

    const handleCallPress = (item) => {
      const phoneNumber = `${item?.mobile?.code}${item?.mobile?.number}`;
      const url = `tel:${phoneNumber}`;
    
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            console.log("Phone call not supported");
          }
        })
        .catch((err) => console.error("An error occurred", err));
    };
    const handleEmailPress = (item) => {
      const email = item?.email;
      const url = `mailto:${email}`;
    
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            console.log("Email not supported");
          }
        })
        .catch((err) => console.error("An error occurred", err));
    };

    useEffect(() => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, []);  

    const taskDetail = async ()=>{
      if (logoutHandled.current) return;
       setLoading(true)
       let token = await AsyncStorage.getItem("token");
       if(!token) {
        navigation.navigate('Autologin');
        return;
     }
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        "_id": _id
      });
      
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
      
      fetch(`${BASE_URL}/client/task/view`, requestOptions)
       .then((response) => response.json())
        .then((result) => {
          if(result.statusCode == 200){
            setLoading(false)
            // console.log("task detail",result?.data)
            setTaskSumry(result.data)
            setRating(result?.data?.taskRatingData?.rating || 0);
            const reviewData = result?.data?.taskReviewData || 0;
            setTaskReview(reviewData)
            // console.log("Task Review Data: ", reviewData);
            setReview(reviewData?.feedback || '');
          }else if (result.statusCode === 401) {
            if (!logoutHandled.current) {
              logoutHandled.current = true; // Flag to prevent multiple logouts
              showToast("Session expired. Please log in again.", () => {
                dispatch(logout()); // Dispatch logout action when OK is pressed
                navigation.navigate('Autologin'); // Navigate to autologin page
              });
            }
          }else{
            showToast(result.message);
          }
        })
        .catch((error) => console.error(error))
        .finally(() => setLoading(false));
    }

    const sendReview = async ()=>{
      setLoading(true)
      let token = await AsyncStorage.getItem("token");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        "taskId": _id,
        "feedback": review,
      });
      
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };
      
      fetch(`${BASE_URL}/client/taskReview/create`, requestOptions)
       .then((response) => response.json())
        .then((result) => {
          if(result.statusCode == 200){
            setLoading(false)
            showToast(result.message)
            setReview('')
            taskDetail()
          }else{
            showToast(result.message)
          }
        })
        .catch((error) => console.error(error))
        .finally(() => setLoading(false));
    }

    const sendRating = async (value)=>{
      let token = await AsyncStorage.getItem("token");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");

      const raw = JSON.stringify({
        "taskId": _id,
        "rating": value,
      });
      
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      }; 
      
      fetch(`${BASE_URL}/client/taskReview/rating`, requestOptions)
       .then((response) => response.json())
        .then((result) => {
          if(result.statusCode == 200){
            setLoading(false)
            setRating(value); 
            // showToast(result.message)
            taskDetail()
          }else{
            showToast(result.message)
          }
        })
        .catch((error) => console.error(error))
        .finally(() => setLoading(false));
    }

     const handlePress = (value) => {
      sendRating(value);
    };


    const updateReview = async ()=>{
      setLoading(true)
      let token = await AsyncStorage.getItem("token");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + token);
      myHeaders.append("Content-Type", "application/json");
      
      const raw = JSON.stringify({
       "_id": taskReview?._id,
       "taskId": _id,
       "feedback": review
      });
      
      const requestOptions = {
       method: "POST",
       headers: myHeaders,
       body: raw,
       redirect: "follow"
      };

      fetch(`${BASE_URL}/client/taskReview/update`, requestOptions)
       .then((response) => response.json())
        .then((result) => {
         if(result.statusCode == 200){
           setLoading(false);
           showToast(result.message)
           setReview('');
           taskDetail();
         }else{
           showToast(result.message);
           setLoading(false);
         }
        })
        .catch((error) => console.error(error))
        .finally(() => setLoading(false));
    }

    useEffect(()=>{
      taskDetail();
    },[])
  
  return (
    <SafeAreaView style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <View style={{ paddingHorizontal:20 }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <View style={{ flexDirection: 'row', flex:8, width: '100%', marginTop: 0, alignItems:'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'flex-start',}}>
            <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{color: '#fff',fontSize: 14, fontWeight: '500', flex: 1, }}>Task Summary</Text>
      </View>
      <View style={{ flex:2, gap:10, height: 50, flexDirection:"row", justifyContent:'space-between', alignItems:"center" }} >
        {taskSumry?.departmentData?.mobile?.number ? (
          <TouchableOpacity 
            onPress={handleCallPress} 
            style={{ flex: 1, height: 50, justifyContent: "center", alignItems: "center" }}
          >
            <Feather name="phone-call" size={20} color="#fff" />
          </TouchableOpacity>
        ) : null }
        {taskSumry?.departmentData?.email ? (
           <TouchableOpacity onPress={handleEmailPress} style={{ flex:1, height: 50, justifyContent:"center", alignItems:"center" }}>
             <MaterialCommunityIcons name="email-plus-outline" size={24} color="#fff" />
           </TouchableOpacity>
        ):null }
      </View>
      </View>
    </View>
      <Animated.View style={{ flex:1, backgroundColor:Style.primaryBgColor, borderTopStartRadius:20, borderTopEndRadius:20, padding:20, transform: [{ translateY: slideAnim }] }} >
        {
          loading?(
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
            </View>
          ):(
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>
                <View style={{ width:"100%", flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginVertical:10, paddingBottom:10 }} >
                  <Text style={{ flex:5, fontSize:14, fontWeight:"600", color:Style.headerBgColor }}>Task Details</Text>
                   <View style={{ width:"100%", flex:5, backgroundColor:taskSumry.status =='Task_Stop'?'#E51E1E':taskSumry.status =='Completed'?'#85BD2A':taskSumry.status =='Assigned'?'#1AA4FF':'#eb984e', height:30, justifyContent:'center', alignItems:'center', borderRadius:5 }} >
                       <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:'#fff' }}>{taskSumry.status?.replace(/_/g, ' ')
                        .toLowerCase()
                        .replace(/\b\w/g, char => char.toUpperCase())}</Text>
                   </View>
                </View>
                <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2 }} >
                  <View>
                    <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Task Name</Text>
                      <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                        <Text>{taskSumry?.taskName || 'No Task Name avilable'}</Text>
                      </View>
                  </View>
                  <View>
                    <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Department</Text>
                      <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                        <Text>{taskSumry?.departmentData?.name || 'No Department avilable'}</Text>
                      </View>
                  </View>
                  <View style={{ flexDirection:'row', gap:20 }} >
                   <View style={{ flex:1 }}>
                     <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Code No.</Text>
                       <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                         <Text>{taskSumry?.code || 'No code avilable'}</Text>
                       </View>
                   </View>
                   <View style={{ flex:1 }}>
                     <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Fees</Text>
                       <View style={{ width:'100%', height:40, justifyContent:'center', justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                         <Text>{taskSumry?.fee || 'No fee avilable'}</Text>
                       </View>
                   </View>
                  </View>
                  <View style={{ flexDirection:'row', gap:20 }} >
                   <View style={{ flex:1 }}>
                     <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Financial Year</Text>
                       <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                         <Text>{taskSumry?.financialYear || 'No Financial Year avilable'}</Text>
                       </View>
                   </View>
                   <View style={{ flex:1 }}>
                     <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Assigned By</Text>
                       <View style={{ width:'100%', height:40, justifyContent:"center", borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                        <Text numberOfLines={1} ellipsizeMode='tail' >{taskSumry?.creatorData?.fullName || 'Unknown'}</Text>
                       </View>
                   </View>
                  </View>
                  <View style={{ flexDirection:'row', gap:20 }} >
                   <View style={{ flex:1 }}>
                     <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Assigned On</Text>
                       <View style={{ width:'100%', height:40, justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                         <Text>{moment(taskSumry?.assignDate).format('DD/MM/YYYY') || 'No Date avilable'}</Text>
                       </View>
                   </View>
                   <View style={{ flex:1 }}>
                     <Text style={{ fontSize:12, fontWeight:500, color:Style.secondryTextColor, paddingBottom:5 }}>Due Date</Text>
                       <View style={{ width:'100%', height:40, justifyContent:"center", borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                          <Text>{moment(taskSumry?.dueDate).format('DD/MM/YYYY') || 'No Date avilable'}</Text>
                       </View>
                   </View>
                  </View>
                  <View>
                    <Text style={{ fontSize:12, fontFamily:'Poppins-SemiBold', color:Style.secondryTextColor, paddingBottom:5 }}>Remark</Text>
                      <View style={{ width:'100%', justifyContent:'center', borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:10, elevation:4 }}>
                       <Text>{taskSumry?.remarks || 'No Remarks avilable'}</Text>
                      </View>
                  </View>
                </View>
                <Text style={{ fontSize:14, fontWeight:"600", color:Style.headerBgColor, paddingBottom:10 }}>Internal Updates</Text>
                <View style={{ width:'100%', marginBottom:10, backgroundColor:Style.basicbgColor, padding:10, borderRadius:10, elevation:2, marginBottom:10 }} >
                  <Text style={{ fontSize:14, fontWeight:"600", color:Style.headerBgColor, paddingBottom:10 }}>Comment</Text>
                  {
                    taskSumry?.assignTaskList?.[0]?.commentData?.length > 0 ? (
                      taskSumry.assignTaskList[0].commentData.map((item, index) => (
                        <View key={index} style={{ width:'100%', backgroundColor:Style.inputBgColor, borderRadius:10, elevation:1, padding:10, marginBottom:10 }}>
                          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                             <Text style={{ fontSize:14, fontFamily:'Poppins-Medium', color:Style.secondryTextColor, paddingBottom:5 }}>
                               {item.creatorData?.fullName || "Unknown"}
                             </Text>
                            <Text style={{ fontSize:12, fontFamily:'Poppins-Medium',color: taskSumry?.status === 'Task_Stop' ? '#E51E1E' : taskSumry?.status === 'Completed' ? '#85BD2A' : taskSumry?.status === 'Assigned' ? '#1AA4FF' : '#eb984e' }}>
                             {item?.status === 'reAssign_to_other'? `Reassign to ${item.employeData?.fullName ?? ""} Request Sent`: item?.status}</Text>
                          </View>
                
                          <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:Style.placeHolderTextColor }}>{item.message} </Text>
                
                          <View style={{ flexDirection:'row', justifyContent:'space-between', paddingTop:5 }}>
                            <Text style={{ flex:1, fontSize:12, fontFamily:'Poppins-Medium', color:Style.placeHolderTextColor }}>
                              {moment(item.createdAt).format('DD/MM/YYYY | hh:mm A') || 'No Date avilable'}
                            </Text>
                            <Text numberOfLines={1} ellipsizeMode='tail' style={{ flex:1, fontSize:12, fontFamily:'Poppins-Medium', color:Style.placeHolderTextColor }}>
                              Assigned to: {item.employeData?.fullName || "Unknown"}
                            </Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.placeHolderTextColor }}>
                        No comments yet.
                      </Text>
                    )
                  }
                </View>
                <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor, paddingBottom:0 }}>Task Review</Text>
                <View style={{ width:'100%', marginBottom:10, backgroundColor:'#fff', padding:10, borderRadius:10, elevation:2 }} >
                  <View>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }} >
                      <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:'#999', paddingBottom:5 }}>Your Review</Text>
                      <Text style={{ fontSize:12, fontFamily:'Poppins-Medium', color:'#999', paddingBottom:5 }}>{taskReview?.updatedAt ? moment(taskReview.updatedAt).format("DD-MM-YYYY | hh:mm") : "  "}</Text>
                    </View>
                      <View style={{ width:'100%', height:40, borderRadius:5, backgroundColor:Style.inputBgColor, elevation:1, marginBottom:10, padding:5, elevation:4 }}>
                         <TextInput value={review} onChangeText={value=> setReview(value)} placeholder="No Review" placeholderTextColor="#999" style={{ flex:1, backgroundColor:'#f8f9fa', borderRadius:5, padding:5, color:"#074173", fontFamily:'Poppins-Mediumkk' }} />
                      </View>
                      <TouchableOpacity  disabled={review.trim() === ""} onPress={taskReview ? updateReview : sendReview} style={{ width:'50%', height:40, backgroundColor:review===""?'#cbcbcb': Style.headerBgColor, borderRadius:5, justifyContent:'center', alignItems:'center', elevation:5, marginTop:10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1 }} >
                         {
                          loading?(
                            <ActivityIndicator size="small" color="#fff" />
                          ):(
                            <Text style={{ fontSize:14, fontFamily:'Poppins-Medium', color:'#fff' }}>{taskReview ? "Update Review" : "Submit a Review"}</Text>
                          )
                         }
                      </TouchableOpacity>
                  </View>
                </View>
                <Text style={{ fontSize:14, fontFamily:'Poppins-SemiBold', color:Style.headerBgColor, paddingBottom:0 }}>Task Rating</Text>
                <View style={{ width:'100%', marginBottom:10, backgroundColor:'#fff', padding:10, borderRadius:6, elevation:2 }} >
                  <View>
                      <View style={{ flexDirection:'row',}}>
                        {Array.from({ length: maxStars }, (_, index) => (
                          <TouchableOpacity key={index} onPress={() => handlePress(index + 1)}>
                            <FontAwesome
                              name={index < rating ? 'star' : 'star-o'}
                              size={14}
                              color="#FFD700"
                              style={{ marginHorizontal: 2 }}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                  </View>
                </View>
             </ScrollView>
          )
        }
      </Animated.View>
    </SafeAreaView>
  );
}