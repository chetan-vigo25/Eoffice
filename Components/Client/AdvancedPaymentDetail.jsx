import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, StyleSheet, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import moment from 'moment';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import Style from '../../Style/Style';

function formatAmount(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN');
}

function Row({ label, value, isLast, valueColor }) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor }]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

export default function AdvancedPaymentDetail({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { reciptData } = route.params || {};

  const paymentObj  = reciptData?.paymentOBJ;
  const status      = reciptData?.status ?? paymentObj?.status;
  const isSuccess   = !status || status === 'captured';
  const isCancelled = status === 'cancelled';
  const isFailed    = status === 'failed';
  const screenBg    = isSuccess ? Style.paySuccessbgColor : isCancelled ? '#7f8c8d' : '#c0392b';

  const amount      = paymentObj?.notes?.amount
    ?? (paymentObj?.amount ? paymentObj.amount / 100 : null)
    ?? reciptData?.grandTotal
    ?? reciptData?.amount;
  const txnId       = reciptData?.razorpayPaymentId ?? paymentObj?.id;
  const orderId     = reciptData?.razorpayOrderId ?? paymentObj?.order_id;
  const method      = paymentObj?.method;
  const bank        = paymentObj?.bank;
  const email       = paymentObj?.email;
  const contact     = paymentObj?.contact;
  const currency    = paymentObj?.currency ?? 'INR';
  const createdAt   = paymentObj?.created_at
    ? paymentObj.created_at
    : reciptData?.createdAt
    ? moment(reciptData.createdAt).format('DD MMM YYYY, hh:mm A')
    : null;
  const naration      = reciptData?.naration ?? reciptData?.description ?? paymentObj?.description;
  const failureMsg    = reciptData?.message;
  const paidTo        = reciptData?.paidTo?.fullName;
  const receiptURL    = reciptData?.invoiceURL ?? reciptData?.receiptURL;

  const handleDownload = () => {
    if (receiptURL) {
      Linking.openURL(receiptURL).catch(() => {});
    }
  };

  const statusLabel = isSuccess ? 'Success' : isCancelled ? 'Cancelled' : 'Failed';
  const statusColor = isSuccess ? '#23a26d' : '#e74c3c';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBg }}>
      <StatusBar backgroundColor={screenBg} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AntDesign name="arrowleft" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
      >
        {/* Animation / Icon + Label */}
        <View style={styles.successSection}>
          {isSuccess ? (
            <LottieView
              autoPlay
              style={{ width: '100%', height: 130, backgroundColor: 'transparent' }}
              source={require('../../assets/success.json')}
            />
          ) : (
            <View style={styles.statusIconWrap}>
              <MaterialIcons
                name={isCancelled ? 'cancel' : 'error'}
                size={80}
                color="rgba(255,255,255,0.9)"
              />
            </View>
          )}
          <Text style={styles.successLabel}>
            {isSuccess ? 'Advance Payment Successful!' : isCancelled ? 'Payment Cancelled' : 'Payment Failed'}
          </Text>
          {amount != null && (
            <Text style={styles.successAmount}>₹ {formatAmount(amount)}</Text>
          )}
        </View>

        {/* Detail Card */}
        <View style={styles.card}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Feather name="file-text" size={16} color={Style.headerBgColor} />
            <Text style={styles.cardHeaderText}>Payment Details</Text>
          </View>

          {txnId      && <Row label="Transaction ID"  value={txnId} />}
          {orderId    && <Row label="Order ID"        value={orderId} />}
          {createdAt  && <Row label="Payment Date"    value={createdAt} />}
          {method     && <Row label="Payment Method"  value={method.charAt(0).toUpperCase() + method.slice(1)} />}
          {bank       && <Row label="Bank"            value={bank} />}
          {email      && <Row label="Email"           value={email} />}
          {contact    && <Row label="Contact"         value={contact} />}
          {paidTo     && <Row label="Paid To"         value={paidTo} />}
          {naration   && <Row label="Narration"       value={naration} />}
          {failureMsg && <Row label="Reason"          value={failureMsg} valueColor="#e74c3c" />}
          {amount != null && (
            <>
              <Row label="Currency" value={currency} />
              <Row label="Amount"   value={`₹ ${formatAmount(amount)}`} valueColor={Style.headerBgColor} />
            </>
          )}
          <Row
            label="Status"
            value={statusLabel}
            valueColor={statusColor}
            isLast
          />
        </View>

        {/* Download Button — success only */}
        {isSuccess && receiptURL && (
          <TouchableOpacity onPress={handleDownload} style={styles.downloadBtn} activeOpacity={0.8}>
            <MaterialIcons name="file-download" size={20} color={Style.paySuccessbgColor} />
            <Text style={styles.downloadBtnText}>Download Receipt</Text>
          </TouchableOpacity>
        )}

        {/* Retry Button — failed/cancelled */}
        {!isSuccess && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.doneBtn, { backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 12 }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.doneBtnText, { color: '#fff' }]}>Try Again</Text>
          </TouchableOpacity>
        )}

        {/* Done Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.doneBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    color: '#fff',
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIconWrap: {
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successLabel: {
    fontSize: 16,
    fontFamily: 'Lato-Medium',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  successAmount: {
    fontSize: 28,
    fontFamily: 'Lato-Bold',
    color: '#fff',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f5ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f4',
  },
  cardHeaderText: {
    fontSize: 14,
    fontFamily: 'Lato-SemiBold',
    color: Style.headerBgColor,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: '#8a8fa8',
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: 'Lato-SemiBold',
    color: '#1a1a2e',
    flex: 1,
    textAlign: 'right',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  downloadBtnText: {
    fontSize: 15,
    fontFamily: 'Lato-SemiBold',
    color: Style.paySuccessbgColor,
  },
  doneBtn: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    color: Style.headerBgColor,
  },
});
