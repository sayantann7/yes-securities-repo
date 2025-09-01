import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { notificationService, getUnreadNotificationCount } from '@/services/notificationService';
import { Notification } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Bell, CheckCircle2, Folder, File, AlertTriangle } from 'lucide-react-native';

function formatTime(ts: string) {
  try {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return diffMin + 'm ago';
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return diffH + 'h ago';
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return diffD + 'd ago';
    return d.toLocaleDateString();
  } catch { return ts; }
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const list = await notificationService.getNotifications();
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      const list = await notificationService.getNotifications();
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  const markOne = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    } catch (e) { console.error(e); }
  };

  const markAll = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch (e) { console.error(e); }
    finally { setMarkingAll(false); }
  };

  const openNotification = (n: Notification) => {
    // TODO: navigate to document/folder once navigation paths are defined
    if (!n.read) markOne(n.id);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAll} disabled={markingAll}>
            {markingAll ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.markAllText}>Mark all read</Text>}
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator size="large" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={<Text style={styles.emptyText}>No notifications</Text>}
          renderItem={({ item }) => {
            const icon = item.type === 'upload' ? <File size={20} color="#2d89fc" />
              : item.type === 'folder' ? <Folder size={20} color="#2d89fc" />
              : item.type === 'delete' ? <AlertTriangle size={20} color="#ff3b30" />
              : item.type === 'ping' ? <AlertTriangle size={20} color="#f39c12" />
              : <Bell size={20} color="#2d89fc" />;
            return (
              <TouchableOpacity style={[styles.item, !item.read && styles.unreadItem]} onPress={() => openNotification(item)}>
                <View style={styles.iconWrap}>{icon}</View>
                <View style={styles.body}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.title, !item.read && styles.unreadTitle]} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                  </View>
                  {!!item.message && <Text style={styles.message} numberOfLines={2}>{item.message}</Text>}
                  {!item.read && (
                    <TouchableOpacity style={styles.markBtn} onPress={() => markOne(item.id)}>
                      <CheckCircle2 size={16} color="#2d89fc" />
                      <Text style={styles.markBtnText}>Mark read</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  markAllBtn: { backgroundColor: '#2d89fc', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  markAllText: { color: '#fff', fontWeight: '600' },
  loadingWrap: { flex:1, alignItems:'center', justifyContent:'center' },
  emptyList: { flexGrow:1, alignItems:'center', justifyContent:'center' },
  emptyText: { opacity: 0.5 },
  item: { flexDirection:'row', paddingVertical:12, borderBottomWidth:1, borderColor:'rgba(0,0,0,0.06)' },
  unreadItem: { backgroundColor:'rgba(45,137,252,0.06)', borderRadius:12, paddingHorizontal:8 },
  iconWrap: { width:40, alignItems:'center', paddingTop:4 },
  body: { flex:1, paddingLeft:4 },
  rowBetween: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  title: { fontSize:16, fontWeight:'600' },
  unreadTitle: { color:'#2d89fc' },
  message: { fontSize:13, opacity:0.75 },
  time: { fontSize:11, opacity:0.5, marginLeft:8 },
  markBtn: { flexDirection:'row', alignItems:'center', gap:4, marginTop:6 },
  markBtnText: { color:'#2d89fc', fontSize:12, marginLeft:4 },
});
