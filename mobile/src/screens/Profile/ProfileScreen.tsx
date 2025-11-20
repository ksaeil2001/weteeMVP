// Screen S-034: 프로필 화면
// Related feature: F-007 기본 프로필 및 설정
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { Card, ListItem, Button } from '../../components';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, layout, borderRadius } from '../../constants/spacing';

const ProfileScreen = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'TEACHER':
        return '선생님';
      case 'STUDENT':
        return '학생';
      case 'PARENT':
        return '학부모';
      default:
        return '사용자';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 정보</Text>
        </View>

        {/* Profile Card */}
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || '사용자'}</Text>
          <Text style={styles.userRole}>{getRoleLabel(user?.role)}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </Card>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>계정</Text>
          <Card variant="outlined">
            <ListItem
              title="프로필 수정"
              rightIcon={<Text style={styles.arrow}>›</Text>}
              onPress={() => console.log('Edit profile')}
            />
            <View style={styles.divider} />
            <ListItem
              title="비밀번호 변경"
              rightIcon={<Text style={styles.arrow}>›</Text>}
              onPress={() => console.log('Change password')}
            />
          </Card>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>설정</Text>
          <Card variant="outlined">
            <ListItem
              title="알림 설정"
              rightIcon={<Text style={styles.arrow}>›</Text>}
              onPress={() => console.log('Notification settings')}
            />
            <View style={styles.divider} />
            <ListItem
              title="앱 정보"
              subtitle="버전 1.0.0"
              rightIcon={<Text style={styles.arrow}>›</Text>}
              onPress={() => console.log('App info')}
            />
          </Card>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            variant="text"
            size="medium"
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileCard: {
    margin: layout.screenPaddingHorizontal,
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  avatarText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '600',
    color: colors.primary[600],
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  userRole: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    marginBottom: spacing[1],
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  menuSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing[2],
    paddingLeft: spacing[1],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: layout.listItemPadding,
  },
  arrow: {
    fontSize: 20,
    color: colors.gray[400],
  },
  logoutSection: {
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error.main,
    fontSize: typography.fontSize.md,
    fontWeight: '500',
  },
});

export default ProfileScreen;
