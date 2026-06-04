import React, { useState, useEffect } from "react";
import { StatusBar, View, Text, TouchableOpacity, TextInput, Image, Animated, ToastAndroid, ActivityIndicator, LayoutAnimation, UIManager, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Style from "../../../Style/Style";
import { useDispatch, useSelector } from 'react-redux';
import { personalInfo } from "../../../Redux/Reducer/Client/Client.Reducer";
import moment from "moment";

import { AntDesign, Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView } from "react-native-gesture-handler";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

export default function MyDocuments({ navigation }) {

const dispatch = useDispatch();
const { isLoading, personalInfoData, error } = useSelector((state) => state.client);

const [expanded, setExpanded] = useState(false);
const [search, setSearch] = useState('');
const toggleExpand = () => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setExpanded(!expanded);
};

  const [scale] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const regCount = personalInfoData?.documentData?.length || 0;
  const finCount = personalInfoData?.financeData?.length || 0;

  const tiles = [
    {
      key: 'reg',
      title: 'Registration Documents',
      subtitle: 'KYC, IDs and registration proofs',
      count: regCount,
      icon: 'badge-account-horizontal-outline',
      iconLib: 'mc',
      bg: '#eef2ff',
      accent: Style.headerBgColor,
      route: 'RegDocument',
    },
    {
      key: 'fin',
      title: 'Financial Documents',
      subtitle: 'Year-wise financial records',
      count: finCount,
      icon: 'wallet-outline',
      iconLib: 'mc',
      bg: '#fff4e0',
      accent: '#e6a400',
      route: 'FinDocument',
    },
  ];

  const filteredTiles = tiles.filter(t =>
    !search.trim() || t.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex:1, backgroundColor:Style.headerBgColor }}>
      <StatusBar backgroundColor={Style.headerBgColor} barStyle='light-content' />

      <Animated.View style={{ paddingHorizontal:18, transform: [{ scale }] }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.75}>
            <AntDesign name="arrowleft" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Documents</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Notifikation')} style={styles.iconBtn} activeOpacity={0.75}>
            <Feather name="bell" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#94a0b8" style={{ marginLeft: 14 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search documents…"
            placeholderTextColor="#9aa3bf"
            style={styles.searchInput}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} style={{ paddingHorizontal: 12 }}>
              <Ionicons name="close-circle" size={18} color="#9aa3bf" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <View style={styles.body}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Text style={styles.bodyHeading}>Categories</Text>
            <Text style={styles.bodyHint}>Pick a category to view, upload or download documents.</Text>

            {isLoading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={Style.headerBgColor} />
                <Text style={styles.loaderText}>Loading your documents…</Text>
              </View>
            ) : filteredTiles.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIcon}>
                  <MaterialCommunityIcons name="folder-search-outline" size={32} color={Style.headerBgColor} />
                </View>
                <Text style={styles.emptyTitle}>No matches</Text>
                <Text style={styles.emptyHint}>Try a different search term.</Text>
              </View>
            ) : (
              filteredTiles.map((tile) => (
                <TouchableOpacity
                  key={tile.key}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate(tile.route)}
                  style={styles.tileCard}
                >
                  <View style={[styles.tileIconWrap, { backgroundColor: tile.bg }]}>
                    <MaterialCommunityIcons name={tile.icon} size={26} color={tile.accent} />
                  </View>

                  <View style={styles.tileTextWrap}>
                    <Text style={styles.tileTitle} numberOfLines={1}>{tile.title}</Text>
                    <Text style={styles.tileSubtitle} numberOfLines={1}>{tile.subtitle}</Text>
                    <View style={styles.tileMetaRow}>
                      <View style={[styles.countPill, { backgroundColor: tile.bg }]}>
                        <Text style={[styles.countPillText, { color: tile.accent }]}>
                          {tile.count} {tile.count === 1 ? 'doc' : 'docs'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.chevronWrap}>
                    <Feather name="chevron-right" size={20} color="#9aa3bf" />
                  </View>
                </TouchableOpacity>
              ))
            )}

            <View style={styles.infoCard}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#22a06b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Your documents are secure</Text>
                <Text style={styles.infoText}>Files are encrypted and only visible to you and your verifiers.</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'android' ? 8 : 0,
    paddingTop: 6,
    paddingBottom: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Lato-SemiBold',
    letterSpacing: 0.3,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 46,
    marginTop: 14,
    marginBottom: 16,
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
  body: {
    flex: 1,
    backgroundColor: Style.primaryBgColor,
    borderTopStartRadius: 22,
    borderTopEndRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  bodyHeading: {
    fontSize: 15,
    fontFamily: 'Lato-Bold',
    color: Style.headerBgColor,
    marginBottom: 4,
  },
  bodyHint: {
    fontSize: 12,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    marginBottom: 16,
  },
  tileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eef0fa',
    shadowColor: '#1f2440',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tileTextWrap: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 14,
    fontFamily: 'Lato-Bold',
    color: Style.headerBgColor,
  },
  tileSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Lato-Medium',
    color: '#7c84a3',
    marginTop: 2,
  },
  tileMetaRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countPillText: {
    fontSize: 11,
    fontFamily: 'Lato-SemiBold',
  },
  chevronWrap: {
    width: 24,
    alignItems: 'flex-end',
  },
  loaderWrap: {
    paddingVertical: 50,
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
    paddingVertical: 50,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#e8f7ee',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#cfeedd',
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 12.5,
    fontFamily: 'Lato-SemiBold',
    color: '#1c6c45',
  },
  infoText: {
    fontSize: 11,
    fontFamily: 'Lato-Medium',
    color: '#3a7d5b',
    marginTop: 2,
    lineHeight: 16,
  },
});
