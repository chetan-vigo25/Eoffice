import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import BASE_URL from "../../Urls/DomainUrl";

export default function NotificationBell({ navigation, iconSize = 22, iconColor = "#fff", containerStyle }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchUnread();
    }, [])
  );

  const fetchUnread = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    // Mirror Notifikation.jsx: a notification is read if the server marked it
    // read OR the user read it locally (persisted under LOCAL_READ_IDS).
    let localReadIds = new Set();
    try {
      const saved = await AsyncStorage.getItem("LOCAL_READ_IDS");
      if (saved) localReadIds = new Set(JSON.parse(saved));
    } catch (e) {}

    const headers = new Headers();
    headers.append("Authorization", "Bearer " + token);
    headers.append("Content-Type", "application/json");
    fetch(`${BASE_URL}/client/notification/history`, { method: "POST", headers, redirect: "follow" })
      .then(r => r.json())
      .then(result => {
        if (result.statusCode === 200) {
          const count = (result.data || []).filter(
            n => !(localReadIds.has(n._id) || n.status === "read")
          ).length;
          setUnreadCount(count);
        }
      })
      .catch(() => {});
  };

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Notifikation")}
      style={[{ width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" }, containerStyle]}
      activeOpacity={0.75}
    >
      <Feather name="bell" size={iconSize} color={iconColor} />
      {unreadCount > 0 && (
        <View style={{
          position: "absolute",
          top: 2, right: 0,
          minWidth: 16, height: 16,
          borderRadius: 8,
          backgroundColor: "#ef4444",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 5,
        }}>
          <Text style={{ fontSize: 8, fontFamily: "Lato-SemiBold", color: "#fff", lineHeight: 11 }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
