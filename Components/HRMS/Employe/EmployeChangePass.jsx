import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, View, Text, StatusBar, Platform, ScrollView, TextInput, Alert, TouchableOpacity, ActivityIndicator, ToastAndroid, KeyboardAvoidingView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../../../Urls/DomainUrl';
import { UserContext } from '../../../Context/UserProvider';
import { handleEmployeUnauthorized, isUnauthorized } from '../../../Context/EmployeeAutoLogin';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Ionicons } from "@expo/vector-icons";

function showToast(message, onOk = null) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    if (onOk) {
      setTimeout(onOk, 2000);
    }
  } else {
    Alert.alert('', message, [{ text: 'OK', onPress: () => onOk && onOk() }], { cancelable: false });
  }
}

export default function EmployeChangePass({ navigation, route }) {
  const { logout } = useContext(UserContext);
  const [oldPassword, setOldPassword] = useState('');
  const [oldShowPass, setOldShowPass] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [newShowPass, setNewShowPass] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmShowPass, setConfirmShowPass] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const oldPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
        }
      } catch (error) {
        console.error("Failed to load userData:", error);
      }
    };
    loadUserData();
  }, []);

  const validateChangePassForm = () => {
    let newErrors = {};
    if (!oldPassword || !oldPassword.trim()) { 
      newErrors.oldPassword = "Old password is required"; 
    }
    if (!newPassword || !newPassword.trim()) { 
      newErrors.newPassword = "New password is required"; 
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    if (!confirmPassword || !confirmPassword.trim()) { 
      newErrors.confirmPassword = "Confirm password is required"; 
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPass = () => {
    setNewPassword('');
    setOldPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  const employeChangePass = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        showToast("Authentication token not found");
        setLoading(false);
        return;
      }
      
      if (!validateChangePassForm()) {
        setLoading(false);
        return;
      }
      
      if (newPassword !== confirmPassword) {
        showToast("New password and confirm password do not match");
        setLoading(false);
        return;
      }

      if (oldPassword === newPassword) {
        showToast("New password cannot be the same as old password");
        setLoading(false);
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + token);

      const raw = JSON.stringify({
        "_id": userData?._id,
        "newPassword": newPassword,
        "password": confirmPassword
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const response = await fetch(`${BASE_URL}/admin/common/changePassword`, requestOptions);
      const result = await response.json();
      
      if (result.statusCode === 200) {
        showToast(result.message || "Password changed successfully!");
        handleResetPass();
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      } else {
        showToast(result.message || "Failed to change password");
      }
    } catch (error) {
      console.log(error);
      showToast("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#6a8ff3" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#6a8ff3" />
            <Text style={styles.infoTitle}>Password Requirements</Text>
            <View style={styles.requirementsList}>
              <Text style={styles.requirementText}>✓ Minimum 6 characters long</Text>
              <Text style={styles.requirementText}>✓ Cannot be same as old password</Text>
              <Text style={styles.requirementText}>✓ Must match confirmation password</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Old Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={[styles.inputWrapper, errors.oldPassword && styles.inputError]}>
                <TextInput
                  ref={oldPasswordRef}
                  placeholder="Enter your current password"
                  value={oldPassword}
                  onChangeText={(text) => {
                    setOldPassword(text);
                    if (errors.oldPassword) {
                      setErrors({ ...errors, oldPassword: null });
                    }
                  }}
                  placeholderTextColor="#999"
                  secureTextEntry={oldShowPass}
                  style={styles.textInput}
                  returnKeyType="next"
                  onSubmitEditing={() => newPasswordRef.current?.focus()}
                />
                <TouchableOpacity onPress={() => setOldShowPass(!oldShowPass)} style={styles.eyeIcon}>
                  <Ionicons name={oldShowPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6a8ff3" />
                </TouchableOpacity>
              </View>
              {errors.oldPassword && <Text style={styles.errorText}>{errors.oldPassword}</Text>}
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={[styles.inputWrapper, errors.newPassword && styles.inputError]}>
                <TextInput
                  ref={newPasswordRef}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: null });
                    }
                  }}
                  placeholderTextColor="#999"
                  secureTextEntry={newShowPass}
                  style={styles.textInput}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <TouchableOpacity onPress={() => setNewShowPass(!newShowPass)} style={styles.eyeIcon}>
                  <Ionicons name={newShowPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6a8ff3" />
                </TouchableOpacity>
              </View>
              {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  ref={confirmPasswordRef}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: null });
                    }
                  }}
                  placeholderTextColor="#999"
                  secureTextEntry={confirmShowPass}
                  style={styles.textInput}
                  returnKeyType="done"
                  onSubmitEditing={employeChangePass}
                />
                <TouchableOpacity onPress={() => setConfirmShowPass(!confirmShowPass)} style={styles.eyeIcon}>
                  <Ionicons name={confirmShowPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6a8ff3" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              onPress={employeChangePass} 
              disabled={loading}
              style={[styles.changeButton, loading && styles.changeButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="key-outline" size={20} color="#fff" />
                  <Text style={styles.changeButtonText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResetPass} style={styles.resetButton}>
              <Ionicons name="refresh-outline" size={18} color="#999" />
              <Text style={styles.resetButtonText}>Clear Form</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#6a8ff3" />
          <Text style={styles.loaderText}>Updating password...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6a8ff3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#6a8ff3',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Lato-SemiBold',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    // elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Lato-Bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 12,
  },
  requirementsList: {
    alignSelf: 'stretch',
  },
  requirementText: {
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.05,
    // shadowRadius: 8,
    // elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  textInput: {
    flex: 1,
    fontFamily: 'Lato-Regular',
    fontSize: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#333',
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    fontFamily: 'Lato-Regular',
    marginTop: 6,
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 20,
  },
  changeButton: {
    flexDirection: 'row',
    backgroundColor: '#6a8ff3',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    // shadowColor: '#6a8ff3',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 8,
    // elevation: 5,
  },
  changeButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    gap: 6,
  },
  resetButtonText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'Lato-Medium',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Lato-Medium',
    marginTop: 12,
  },
});