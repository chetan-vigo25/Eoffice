import React, { useState, useEffect, useRef, useContext } from 'react';
import { StyleSheet, View, Text, StatusBar, ScrollView, Modal, Image, TouchableOpacity, ActivityIndicator, ToastAndroid, Alert, Platform, RefreshControl, Linking } from "react-native";
import moment from "moment";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { IMAGE_FILEPATH_URL } from '../../../Urls/DomainUrl';
import { UserContext } from '../../../Context/UserProvider';
import { handleEmployeUnauthorized, isUnauthorized } from '../../../Context/EmployeeAutoLogin';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Entypo, Ionicons, FontAwesome, FontAwesome6, Octicons, MaterialIcons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

const PRIMARY = '#6a8ff3';
const PRIMARY_DARK = '#4c72d9';
const PRIMARY_TINT = '#eef2ff';
const SURFACE = '#ffffff';
const BG = '#f4f6fb';
const TEXT_DARK = '#1f2440';
const TEXT_MUTED = '#7c84a3';
const BORDER = '#e6eaf5';
const SUCCESS = '#22a06b';
const DANGER = '#e94e4e';

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

export default function EmployeProfile({ navigation, route }) {
  const { userData, pickAndUploadImage, isLoading, logout } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState(1);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [onBoardingData, setOnBoardingData] = useState(null);
  const [onBoardingId, setOnBoardingId] = useState(null);
  const [localUserData, setLocalUserData] = useState(null);

  const displayUserData = userData || localUserData;

  const tabs = [
    { id: 1, label: 'Primary', icon: 'person-outline', family: 'Ionicons' },
    { id: 2, label: 'Leave', icon: 'calendar-outline', family: 'Ionicons' },
    { id: 3, label: 'Salary', icon: 'cash-outline', family: 'Ionicons' },
    { id: 4, label: 'Education', icon: 'graduation-cap', family: 'Entypo' },
    { id: 5, label: 'Employment', icon: 'briefcase', family: 'Entypo' },
    { id: 6, label: 'Family', icon: 'people-outline', family: 'Ionicons' },
    { id: 7, label: 'Emergency', icon: 'alert-circle-outline', family: 'Ionicons' },
    { id: 8, label: 'Social', icon: 'link', family: 'Entypo' },
    { id: 9, label: 'Documents', icon: 'document-text-outline', family: 'Ionicons' },
    { id: 10, label: 'Bank', icon: 'bank', family: 'FontAwesome' },
  ];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setOnBoardingId(parsedData?.onboardingId);
          if (!userData) setLocalUserData(parsedData);
        }
      } catch (error) {
        console.error("Failed to load userData:", error);
      }
    };
    loadUserData();
  }, [userData]);

  const employeeDetail = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        showToast("Authentication token not found");
        return;
      }

      const response = await fetch(`${BASE_URL}/admin/employe/onboarding/detail`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ "_id": onBoardingId })
      });

      const result = await response.json();
      if (result.statusCode === 200) {
        setOnBoardingData(result?.data || null);
      } else if (isUnauthorized(result)) {
        await handleEmployeUnauthorized(navigation, logout);
      } else {
        showToast(result.message);
      }
    } catch (error) {
      console.log(error);
      showToast("Failed to load employee details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (onBoardingId) employeeDetail();
  }, [onBoardingId]);

  const onRefresh = () => {
    setRefreshing(true);
    employeeDetail();
  };

  const handleLogout = async () => {
    try {
      if (typeof logout === 'function') {
        await logout();
      } else {
        await AsyncStorage.multiRemove(['authToken', 'userData']);
      }
      navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  const renderTabIcon = (tab, isActive) => {
    const color = isActive ? '#fff' : PRIMARY_DARK;
    const size = 14;
    switch (tab.family) {
      case 'Entypo':
        return <Entypo name={tab.icon} size={size} color={color} />;
      case 'FontAwesome':
        return <FontAwesome name={tab.icon} size={size} color={color} />;
      case 'Ionicons':
      default:
        return <Ionicons name={tab.icon} size={size} color={color} />;
    }
  };

  // InfoRow now uses a label-on-top layout for cleaner mobile readability,
  // while keeping the same call signature so render* helpers don't change.
  const InfoRow = ({ iconFamily: Icon, iconName, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Icon name={iconName} size={14} color={PRIMARY_DARK} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  const SectionCard = ({ title, children }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View>{children}</View>
    </View>
  );

  const DetailCard = ({ title, children }) => (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <View style={styles.detailDot} />
        <Text style={styles.detailTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderPrimaryDetails = () => (
    <View>
      <SectionCard title="Personal Information">
        <InfoRow iconFamily={Ionicons} iconName="person-outline" label="Full Name" value={onBoardingData?.fullName} />
        <InfoRow iconFamily={Ionicons} iconName="business-outline" label="Department" value={onBoardingData?.departmentData?.name} />
        <InfoRow iconFamily={FontAwesome} iconName="building" label="Designation" value={onBoardingData?.designationData?.name} />
        <InfoRow iconFamily={Ionicons} iconName="mail-outline" label="Email" value={onBoardingData?.email} />
        <InfoRow iconFamily={Ionicons} iconName="mail-outline" label="Office Email" value={onBoardingData?.officeEmail} />
        <InfoRow iconFamily={Ionicons} iconName="call-outline" label="Mobile" value={onBoardingData?.mobile?.number ? `+91 ${onBoardingData.mobile.number}` : null} />
        <InfoRow iconFamily={Ionicons} iconName="person-outline" label="Reporting Person" value={onBoardingData?.reportingPersonName} />
        <InfoRow iconFamily={FontAwesome} iconName="birthday-cake" label="Date of Birth" value={onBoardingData?.generalInfo?.dateOfBirth ? moment(onBoardingData.generalInfo.dateOfBirth).format('DD-MM-YYYY') : null} />
        <InfoRow iconFamily={FontAwesome6} iconName="heart" label="Marital Status" value={onBoardingData?.generalInfo?.maritalStatus} />
        <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="Date of Joining" value={onBoardingData?.generalInfo?.dateOfJoining ? moment(onBoardingData.generalInfo.dateOfJoining).format('DD-MM-YYYY') : null} />
        <InfoRow iconFamily={Ionicons} iconName="transgender-outline" label="Gender" value={onBoardingData?.generalInfo?.gender} />
        <InfoRow iconFamily={Ionicons} iconName="water-outline" label="Blood Group" value={onBoardingData?.generalInfo?.bloodGroup} />
        <InfoRow iconFamily={Entypo} iconName="v-card" label="Probation Period" value={onBoardingData?.generalInfo?.probationPeriod} />
        <InfoRow iconFamily={Entypo} iconName="briefcase" label="Work Type" value={onBoardingData?.workType} />
      </SectionCard>

      {onBoardingData?.addresses?.primary && (
        <SectionCard title="Address Information">
          <InfoRow iconFamily={FontAwesome} iconName="address-card" label="Street Address" value={onBoardingData.addresses.primary.street} />
          <View style={styles.rowTwoColumns}>
            <InfoRow iconFamily={Ionicons} iconName="location-outline" label="Country" value={onBoardingData.addresses.primary.country} />
            <InfoRow iconFamily={Ionicons} iconName="location-outline" label="State" value={onBoardingData.addresses.primary.state} />
          </View>
          <View style={styles.rowTwoColumns}>
            <InfoRow iconFamily={Ionicons} iconName="location-outline" label="City" value={onBoardingData.addresses.primary.city} />
            <InfoRow iconFamily={Ionicons} iconName="location-outline" label="Pincode" value={onBoardingData.addresses.primary.pinCode} />
          </View>
        </SectionCard>
      )}
    </View>
  );

  const renderLeaveDetails = () => {
    if (!onBoardingData?.assignLeaves?.length) {
      return <EmptyState message="No leave details found" />;
    }
    return onBoardingData.assignLeaves.map((item, index) => (
      <DetailCard key={index} title={`Leave Details ${index + 1}`}>
        <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="Financial Start" value={item.financStartDate ? moment(item.financStartDate).format('DD-MM-YYYY') : null} />
        <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="Financial End" value={item.financEndDate ? moment(item.financEndDate).format('DD-MM-YYYY') : null} />
        <InfoRow iconFamily={FontAwesome} iconName="file-text" label="Leave Policy" value={item.leavePolicy} />
        <InfoRow iconFamily={FontAwesome} iconName="tag" label="Leave Type" value={item.leaveTypeName} />
      </DetailCard>
    ));
  };

  const renderSalaryDetails = () => {
    if (!onBoardingData?.salaryData) return <EmptyState message="No salary details found" />;
    return (
      <SectionCard title="Salary Information">
        <InfoRow iconFamily={Ionicons} iconName="cash-outline" label="Current CTC" value={onBoardingData.salaryData.currentPackage} />
        <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="Last Increment" value={onBoardingData.salaryData.lastIncrementDate ? moment(onBoardingData.salaryData.lastIncrementDate).format('DD-MM-YYYY') : null} />
        <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="Next Increment" value={onBoardingData.salaryData.nextIncrementDate ? moment(onBoardingData.salaryData.nextIncrementDate).format('DD-MM-YYYY') : null} />
        <View style={styles.rowTwoColumns}>
          <InfoRow iconFamily={FontAwesome} iconName="check-circle" label="ESIC" value={onBoardingData.salaryData.isESIC ? "Yes" : "No"} />
          <InfoRow iconFamily={FontAwesome} iconName="check-circle" label="PF" value={onBoardingData.salaryData.isPF ? "Yes" : "No"} />
        </View>
      </SectionCard>
    );
  };

  const renderEducation = () => {
    if (!onBoardingData?.educationDetails?.length) return <EmptyState message="No education details found" />;
    return onBoardingData.educationDetails.map((item, index) => (
      <DetailCard key={index} title={`Education ${index + 1}`}>
        <InfoRow iconFamily={Ionicons} iconName="document-text-outline" label="Degree" value={item.degree} />
        <InfoRow iconFamily={Entypo} iconName="graduation-cap" label="University" value={item.university} />
        <View style={styles.rowTwoColumns}>
          <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="From" value={item.from ? moment(item.from).format('DD-MM-YYYY') : null} />
          <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="To" value={item.to ? moment(item.to).format('DD-MM-YYYY') : null} />
        </View>
        <InfoRow iconFamily={FontAwesome} iconName="percent" label="Percentage/Grade" value={item.number} />
        <InfoRow iconFamily={Entypo} iconName="book" label="Specification" value={item.specification} />
      </DetailCard>
    ));
  };

  const renderPastEmployment = () => {
    if (!onBoardingData?.employementDetails?.length) return <EmptyState message="No employment history found" />;
    return onBoardingData.employementDetails.map((item, index) => (
      <DetailCard key={index} title={`Employment ${index + 1}`}>
        <InfoRow iconFamily={Octicons} iconName="organization" label="Organization" value={item.organizationName} />
        <InfoRow iconFamily={Entypo} iconName="briefcase" label="Designation" value={item.designationName} />
        <View style={styles.rowTwoColumns}>
          <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="From" value={item.from ? moment(item.from).format('DD-MM-YYYY') : null} />
          <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="To" value={item.to ? moment(item.to).format('DD-MM-YYYY') : null} />
        </View>
        <InfoRow iconFamily={MaterialIcons} iconName="attach-money" label="Annual CTC" value={item.annualCTC} />
      </DetailCard>
    ));
  };

  const renderFamilyDetails = () => {
    if (!onBoardingData?.familyDetails?.length) return <EmptyState message="No family details found" />;
    return onBoardingData.familyDetails.map((item, index) => (
      <DetailCard key={index} title={`Family Member ${index + 1}`}>
        <InfoRow iconFamily={Ionicons} iconName="people-outline" label="Relationship" value={item.relation} />
        <InfoRow iconFamily={Ionicons} iconName="person-outline" label="Name" value={item.name} />
        <View style={styles.rowTwoColumns}>
          <InfoRow iconFamily={Ionicons} iconName="calendar-outline" label="Age" value={item.age} />
          <InfoRow iconFamily={Ionicons} iconName="call-outline" label="Mobile" value={item.contactNumber?.number ? `+91 ${item.contactNumber.number}` : null} />
        </View>
      </DetailCard>
    ));
  };

  const renderEmergencyContacts = () => {
    if (!onBoardingData?.emergencyContact?.length) return <EmptyState message="No emergency contacts found" />;
    return onBoardingData.emergencyContact.map((item, index) => (
      <DetailCard key={index} title={`Contact ${index + 1}`}>
        <InfoRow iconFamily={Ionicons} iconName="person-outline" label="Name" value={item.name} />
        <InfoRow iconFamily={Ionicons} iconName="people-outline" label="Relationship" value={item.relationship} />
        <InfoRow iconFamily={Ionicons} iconName="mail-outline" label="Email" value={item.email} />
        <InfoRow iconFamily={Ionicons} iconName="call-outline" label="Mobile" value={item.mobile?.number ? `+91 ${item.mobile.number}` : null} />
      </DetailCard>
    ));
  };

  const renderSocialLinks = () => {
    if (!onBoardingData?.socialLinks?.length) return <EmptyState message="No social links found" />;
    return onBoardingData.socialLinks.map((item, index) => (
      <DetailCard key={index} title={`Social Link ${index + 1}`}>
        <TouchableOpacity onPress={() => item.link && Linking.openURL(item.link)}>
          <InfoRow iconFamily={Entypo} iconName="link" label={item.name || "Platform"} value={item.link} />
        </TouchableOpacity>
      </DetailCard>
    ));
  };

  const renderDocuments = () => {
    if (!onBoardingData?.documentData?.length) return <EmptyState message="No documents found" />;
    return onBoardingData.documentData.map((item, index) => (
      <DetailCard key={index} title={`Document ${index + 1}`}>
        <InfoRow iconFamily={Entypo} iconName="document" label="Document Type" value={item.name} />
        <InfoRow iconFamily={Entypo} iconName="text-document" label="Document Number" value={item.number} />
        {item.filePath && (
          <View style={styles.documentContainer}>
            <Text style={styles.documentLabel}>Uploaded Document</Text>
            <Image source={{ uri: `${IMAGE_FILEPATH_URL}/${item.filePath}` }} style={styles.documentImage} />
          </View>
        )}
      </DetailCard>
    ));
  };

  const renderBankDetails = () => {
    if (!onBoardingData?.bankData?.length) return <EmptyState message="No bank details found" />;
    return onBoardingData.bankData.map((item, index) => (
      <DetailCard key={index} title={`Bank Account ${index + 1}`}>
        <InfoRow iconFamily={Ionicons} iconName="person-outline" label="Account Holder" value={item.bankholderName} />
        <InfoRow iconFamily={FontAwesome} iconName="bank" label="Bank Name" value={item.bankName} />
        <InfoRow iconFamily={FontAwesome} iconName="building" label="Branch" value={item.branchName} />
        <InfoRow iconFamily={FontAwesome} iconName="credit-card" label="Account Number" value={item.accountNumber} />
        <View style={styles.rowTwoColumns}>
          <InfoRow iconFamily={FontAwesome} iconName="code" label="IFSC Code" value={item.ifscCode} />
          <InfoRow iconFamily={FontAwesome} iconName="folder" label="Account Type" value={item.accountType} />
        </View>
        {item.filePath && (
          <View style={styles.documentContainer}>
            <Text style={styles.documentLabel}>Uploaded Document</Text>
            <Image source={{ uri: `${IMAGE_FILEPATH_URL}/${item.filePath}` }} style={styles.documentImage} />
          </View>
        )}
      </DetailCard>
    ));
  };

  const EmptyState = ({ message }) => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name="folder-open-outline" size={36} color={PRIMARY} />
      </View>
      <Text style={styles.emptyStateText}>{message}</Text>
      <Text style={styles.emptyStateHint}>Pull down to refresh</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={PRIMARY} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} tintColor={PRIMARY} />}
      >
        {/* Profile hero card */}
        <View style={styles.heroWrap}>
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              <Image
                source={displayUserData?.profileImage ? { uri: `${IMAGE_FILEPATH_URL}/${displayUserData.profileImage}` } : require('../../../assets/userIcon.jpeg')}
                style={styles.profileImage}
              />
              <TouchableOpacity onPress={pickAndUploadImage} style={styles.editIcon} activeOpacity={0.85}>
                <Feather name="camera" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName} numberOfLines={1}>
              {displayUserData?.fullName || 'Employee Name'}
            </Text>

            {!!onBoardingData?.designationData?.name && (
              <Text style={styles.profileRole} numberOfLines={1}>
                {onBoardingData.designationData.name}
                {onBoardingData?.departmentData?.name ? ` · ${onBoardingData.departmentData.name}` : ''}
              </Text>
            )}

            <View style={styles.profileChips}>
              <View style={styles.chip}>
                <Ionicons name="at-outline" size={12} color={PRIMARY_DARK} />
                <Text style={styles.chipText} numberOfLines={1}>{displayUserData?.userName || 'username'}</Text>
              </View>
              <View style={styles.chipDivider} />
              <View style={styles.chip}>
                <Ionicons name="mail-outline" size={12} color={PRIMARY_DARK} />
                <Text style={styles.chipText} numberOfLines={1}>{displayUserData?.email || 'email'}</Text>
              </View>
            </View>

            {!!onBoardingData?.generalInfo?.dateOfJoining && (
              <View style={styles.joinedPill}>
                <MaterialCommunityIcons name="briefcase-check-outline" size={12} color={SUCCESS} />
                <Text style={styles.joinedText}>
                  Joined {moment(onBoardingData.generalInfo.dateOfJoining).format('DD MMM YYYY')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('EmployeIcard')} style={styles.actionButton}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="id-card-outline" size={20} color={PRIMARY_DARK} />
            </View>
            <Text style={styles.actionButtonText}>I-Card</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('EmployeChangePass')} style={styles.actionButton}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#fff4e0' }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#e6a400" />
            </View>
            <Text style={styles.actionButtonText}>Password</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={() => setLogoutModalVisible(true)} style={styles.actionButton}>
            <View style={[styles.actionIconWrap, { backgroundColor: '#fdecec' }]}>
              <AntDesign name="logout" size={18} color={DANGER} />
            </View>
            <Text style={styles.actionButtonText}>Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent} style={styles.tabsScroll}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.85}
                style={[styles.tab, isActive && styles.activeTab]}
              >
                {renderTabIcon(tab, isActive)}
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {loading ? (
            <View style={styles.tabLoader}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.tabLoaderText}>Loading details…</Text>
            </View>
          ) : (
            <>
              {activeTab === 1 && renderPrimaryDetails()}
              {activeTab === 2 && renderLeaveDetails()}
              {activeTab === 3 && renderSalaryDetails()}
              {activeTab === 4 && renderEducation()}
              {activeTab === 5 && renderPastEmployment()}
              {activeTab === 6 && renderFamilyDetails()}
              {activeTab === 7 && renderEmergencyContacts()}
              {activeTab === 8 && renderSocialLinks()}
              {activeTab === 9 && renderDocuments()}
              {activeTab === 10 && renderBankDetails()}
            </>
          )}
        </View>
      </ScrollView>

      {/* Logout Modal */}
      <Modal animationType="fade" transparent visible={logoutModalVisible} onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <MaterialCommunityIcons name="logout" size={32} color={DANGER} />
            </View>
            <Text style={styles.modalTitle}>Log out?</Text>
            <Text style={styles.modalMessage}>You'll need to sign in again to access your account.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => setLogoutModalVisible(false)} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.9} onPress={() => { setLogoutModalVisible(false); handleLogout(); }} style={[styles.modalButton, styles.confirmButton]}>
                <AntDesign name="logout" size={14} color="#fff" />
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {(isLoading || loading) && (
        <View pointerEvents="none" style={styles.loaderOverlay}>
          <View style={styles.loaderPill}>
            <ActivityIndicator size="small" color={PRIMARY_DARK} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* ---- Header ---- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: PRIMARY,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },

  /* ---- Hero / profile card ---- */
  heroWrap: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    // shadowColor: PRIMARY_DARK,
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.08,
    // shadowRadius: 14,
    // elevation: 4,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: PRIMARY_TINT,
  },
  editIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: PRIMARY_DARK,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 19,
    fontFamily: 'Lato-Bold',
    color: TEXT_DARK,
    marginTop: 2,
    textAlign: 'center',
    maxWidth: '100%',
  },
  profileRole: {
    fontSize: 12.5,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
    marginTop: 4,
    textAlign: 'center',
  },
  profileChips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_TINT,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    maxWidth: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  chipDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#cdd6f5',
    marginHorizontal: 8,
  },
  chipText: {
    fontSize: 11.5,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
    flexShrink: 1,
  },
  joinedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e8f7ee',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 10,
  },
  joinedText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
    color: SUCCESS,
  },

  /* ---- Action buttons ---- */
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: SURFACE,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
  },

  /* ---- Tabs ---- */
  tabsScroll: {
    marginTop: 18,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  activeTab: {
    backgroundColor: PRIMARY_DARK,
    borderColor: PRIMARY_DARK,
    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    fontSize: 12.5,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
  },
  activeTabText: {
    color: '#fff',
  },

  /* ---- Tab content ---- */
  tabContent: {
    padding: 16,
    paddingTop: 12,
  },
  tabLoader: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  tabLoaderText: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
  },

  /* ---- Section / Detail cards ---- */
  sectionCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionAccent: {
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: PRIMARY_DARK,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
    color: TEXT_DARK,
    letterSpacing: 0.2,
  },
  detailCard: {
    backgroundColor: '#f9faff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6ecfb',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  detailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY_DARK,
  },
  detailTitle: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: PRIMARY_DARK,
  },

  /* ---- Info row ---- */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    flex: 1,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PRIMARY_TINT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
  },
  rowTwoColumns: {
    flexDirection: 'row',
    gap: 8,
  },
  documentContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  documentLabel: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: TEXT_MUTED,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  documentImage: {
    width: 96,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },

  /* ---- Empty state ---- */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY_TINT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 13.5,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
  },
  emptyStateHint: {
    fontSize: 11.5,
    fontFamily: 'Lato-Regular',
    color: TEXT_MUTED,
    marginTop: 4,
  },

  /* ---- Loader overlay ---- */
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },

  /* ---- Modal ---- */
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 28, 60, 0.55)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fdecec',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Lato-Bold',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 13,
    fontFamily: 'Lato-Regular',
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f3fa',
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontFamily: 'Lato-SemiBold',
    color: TEXT_DARK,
  },
  confirmButton: {
    backgroundColor: DANGER,
  },
  confirmButtonText: {
    fontSize: 13.5,
    fontFamily: 'Lato-SemiBold',
    color: '#fff',
  },
});
