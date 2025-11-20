// Screen S-003: 로그인 화면
// Related feature: F-001 회원가입 및 로그인
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { z } from 'zod';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input } from '../../components';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, layout } from '../../constants/spacing';

interface LoginScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
}

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
});

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();

  const handleLogin = async () => {
    try {
      // 클라이언트 검증
      loginSchema.parse({ email, password });
      setErrors({});

      setIsLoading(true);

      const result = await login(email, password);

      if (result.success) {
        // 네비게이션은 RootNavigator에서 isAuthenticated 상태로 처리
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        Alert.alert('로그인 실패', result.error || '다시 시도해주세요');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
        setErrors({
          email: fieldErrors.email?.[0],
          password: fieldErrors.password?.[0],
        });
      } else {
        Alert.alert('오류', '네트워크 연결을 확인해주세요');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ResetPassword');
  };

  const handleSignup = () => {
    navigation.navigate('Signup', { email });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>WeTee</Text>
            <Text style={styles.logoSubtitle}>과외 관리의 모든 것</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Input
              type="email"
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              error={errors.email}
              testID="login-email-input"
            />

            <Input
              type="password"
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="8자 이상 입력"
              error={errors.password}
              testID="login-password-input"
            />

            {/* 비밀번호 찾기 */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
            >
              <Text style={styles.linkText}>비밀번호를 잊으셨나요?</Text>
            </TouchableOpacity>
          </View>

          {/* 로그인 버튼 */}
          <View style={styles.buttonGroup}>
            <Button
              variant="primary"
              size="large"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!email || !password}
              testID="login-submit-button"
            >
              로그인
            </Button>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialLoginGroup}>
            <Button
              variant="secondary"
              size="large"
              onPress={() => Alert.alert('준비 중', '소셜 로그인은 준비 중입니다')}
              testID="google-login-button"
            >
              구글로 계속하기
            </Button>

            <Button
              variant="secondary"
              size="large"
              onPress={() => Alert.alert('준비 중', '소셜 로그인은 준비 중입니다')}
              testID="kakao-login-button"
              style={{ marginTop: spacing[3] }}
            >
              카카오로 계속하기
            </Button>
          </View>

          {/* Footer - 회원가입 링크 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              아직 계정이 없으신가요?{' '}
              <Text style={styles.linkText} onPress={handleSignup}>
                회원가입
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[8],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[10],
  },
  logo: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: '700',
    color: colors.primary[500],
  },
  logoSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing[2],
  },
  formSection: {
    marginBottom: spacing[6],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing[2],
  },
  linkText: {
    color: colors.primary[500],
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  buttonGroup: {
    marginBottom: spacing[6],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    paddingHorizontal: spacing[4],
    color: colors.text.hint,
    fontSize: typography.fontSize.sm,
  },
  socialLoginGroup: {
    marginBottom: spacing[8],
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default LoginScreen;
