// Screen S-041: 알림 센터 화면
// Related feature: F-008 필수 알림 시스템
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, Badge } from '../../components';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, layout } from '../../constants/spacing';

// Mock notifications
const mockNotifications = [
  {
    id: '1',
    type: 'lesson',
    title: '수업 알림',
    message: '오늘 14:00에 김민수 학생 수학 수업이 있습니다.',
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    id: '2',
    type: 'payment',
    title: '정산 알림',
    message: '11월 수업료 정산이 완료되었습니다.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
  },
  {
    id: '3',
    type: 'attendance',
    title: '출결 알림',
    message: '이지은 학생이 오늘 수업에 결석했습니다.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isRead: true,
  },
];

const NotificationCenterScreen = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: API 호출
    setTimeout(() => setRefreshing(false), 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, 'a h:mm', { locale: ko });
    }
    if (isYesterday(date)) {
      return '어제';
    }
    return format(date, 'M월 d일', { locale: ko });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return '📚';
      case 'payment':
        return '💰';
      case 'attendance':
        return '✅';
      default:
        return '🔔';
    }
  };

  const renderNotification = ({ item }: { item: typeof mockNotifications[0] }) => (
    <TouchableOpacity
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <Card
        variant={item.isRead ? 'outlined' : 'elevated'}
        style={item.isRead ? styles.notificationCard : [styles.notificationCard, styles.unreadCard]}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIcon}>
            <Text style={styles.iconText}>{getTypeIcon(item.type)}</Text>
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.titleRow}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              {!item.isRead && (
                <View style={styles.unreadDot} />
              )}
            </View>
            <Text style={styles.notificationMessage}>{item.message}</Text>
            <Text style={styles.notificationTime}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>알림</Text>
          {unreadCount > 0 && (
            <Badge variant="error" size="small">
              {unreadCount}
            </Badge>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() =>
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
              )
            }
          >
            <Text style={styles.readAllButton}>모두 읽음</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>알림이 없습니다</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
  },
  readAllButton: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    fontWeight: '500',
  },
  listContent: {
    padding: layout.screenPaddingHorizontal,
    gap: spacing[3],
  },
  notificationCard: {
    marginBottom: spacing[2],
  },
  unreadCard: {
    backgroundColor: colors.primary[50],
  },
  notificationHeader: {
    flexDirection: 'row',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  iconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing[2],
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.hint,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[16],
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.text.hint,
  },
});

export default NotificationCenterScreen;
