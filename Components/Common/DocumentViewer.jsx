import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, Platform, ToastAndroid, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import moment from 'moment';

import Style from '../../Style/Style';
import { fetchTemplateHtml, saveHtmlAsPdf, toPrintPreviewHtml } from '../../Utils/pdf';

function showToast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

/**
 * Full-screen preview of an invoice / receipt.
 *
 * The document is rendered by the server as HTML, shown here in a WebView and
 * printed to a PDF on demand — so it works whether or not the record is paid.
 */
export default function DocumentViewer({ visible, id, type, title, number, onClose, onUnauthorized }) {
  const insets = useSafeAreaInsets();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setHtml('');
    try {
      const result = await fetchTemplateHtml({ id, type, onUnauthorized });
      setHtml(result);
    } catch (e) {
      setError(e?.message || 'Could not load the document.');
    } finally {
      setLoading(false);
    }
  }, [id, type, onUnauthorized]);

  useEffect(() => {
    if (visible && id) load();
  }, [visible, id, load]);

  const handleDownload = async () => {
    if (!html || downloading) return;
    setDownloading(true);
    try {
      const label = type === 'invoice' ? 'Invoice' : 'Receipt';
      await saveHtmlAsPdf({
        html,
        baseName: `${label}_${number || ''}_${moment().format('DDMMYYYY')}`,
        fallbackName: label,
        onToast: showToast,
      });
    } catch (e) {
      showToast(`Failed to download PDF: ${e?.message || e}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} activeOpacity={0.7}>
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            {number ? <Text style={styles.headerSub} numberOfLines={1}>{number}</Text> : null}
          </View>
          <TouchableOpacity
            onPress={handleDownload}
            disabled={!html || downloading}
            style={[styles.headerBtn, { opacity: html && !downloading ? 1 : 0.4 }]}
            activeOpacity={0.7}
          >
            {downloading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name="download" size={19} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {loading ? (
            <View style={styles.centre}>
              <ActivityIndicator size="large" color={Style.headerBgColor} />
              <Text style={styles.centreText}>Generating document...</Text>
            </View>
          ) : error ? (
            <View style={styles.centre}>
              <Feather name="alert-circle" size={36} color="#c0392b" />
              <Text style={styles.centreText}>{error}</Text>
              <TouchableOpacity onPress={load} style={styles.retryBtn} activeOpacity={0.8}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: toPrintPreviewHtml(html) }}
              style={{ flex: 1, backgroundColor: '#fff' }}
              scalesPageToFit
              startInLoadingState
              renderLoading={() => (
                <View style={styles.centre}>
                  <ActivityIndicator size="large" color={Style.headerBgColor} />
                </View>
              )}
            />
          )}
        </View>

        {/* Download bar */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            onPress={handleDownload}
            disabled={!html || downloading}
            activeOpacity={0.8}
            style={[styles.downloadBtn, { backgroundColor: html && !downloading ? Style.headerBgColor : '#e0e0e0' }]}
          >
            {downloading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Feather name="download" size={17} color={html ? '#fff' : '#999'} />}
            <Text style={[styles.downloadText, { color: html && !downloading ? '#fff' : '#999' }]}>
              {downloading ? 'Downloading...' : `Download ${type === 'invoice' ? 'Invoice' : 'Receipt'} PDF`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Style.headerBgColor },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Lato-SemiBold' },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Lato-Medium', marginTop: 2 },
  body: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  centre: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 12 },
  centreText: {
    fontSize: 13,
    fontFamily: 'Lato-Medium',
    color: Style.secondryTextColor,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 22,
    height: 40,
    borderRadius: 10,
    backgroundColor: Style.headerBgColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  retryText: { fontSize: 13, fontFamily: 'Lato-SemiBold', color: '#fff' },
  footer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12 },
  downloadBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  downloadText: { fontSize: 14, fontFamily: 'Lato-SemiBold' },
});
