// Screen S-001: 스플래시 화면
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

interface SplashScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'Splash'>;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await checkAuth();
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // 2초 후 이동 (스플래시 표시용)
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Main');
        } else {
          navigation.replace('Auth');
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>WeTee</Text>
      <Text style={styles.subtitle}>과외 관리의 모든 것</Text>
      <ActivityIndicator
        style={styles.loader}
        size="large"
        color={colors.primary[500]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  logo: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: '700',
    color: colors.primary[500],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: 48,
  },
  loader: {
    marginTop: 24,
  },
});

export default SplashScreen;
