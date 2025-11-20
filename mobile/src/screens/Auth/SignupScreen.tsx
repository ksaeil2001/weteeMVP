// Screen S-004: 회원가입 화면
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
import { RouteProp } from '@react-navigation/native';
import { z } from 'zod';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Badge } from '../../components';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, layout, borderRadius } from '../../constants/spacing';

interface SignupScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, 'Signup'>;
  route: RouteProp<AuthStackParamList, 'Signup'>;
}

const signupSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(/[A-Za-z]/, '영문자를 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 포함해야 합니다'),
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  phone: z.string().regex(/^01[0-9]-\d{3,4}-\d{4}$/, '올바른 전화번호 형식을 입력해주세요'),
  role: z.enum(['TEACHER', 'STUDENT', 'PARENT']),
});

type Role = 'TEACHER' | 'STUDENT' | 'PARENT';

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation, route }) => {
  const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('TEACHER');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuthStore();

  const handleSignup = async () => {
    try {
      const data = { email, password, name, phone, role };
      signupSchema.parse(data);
      setErrors({});

      setIsLoading(true);

      const result = await register(data);

      if (result.success) {
        Alert.alert('환영합니다!', '회원가입이 완료되었습니다', [
          {
            text: '확인',
            onPress: () => {
              navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            },
          },
        ]);
      } else {
        Alert.alert('회원가입 실패', result.error || '다시 시도해주세요');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        Alert.alert('오류', '네트워크 연결을 확인해주세요');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    // 자동 하이픈 추가
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 3 && cleaned.length <= 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length > 7) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
    setPhone(formatted);
  };

  const roles: { value: Role; label: string }[] = [
    { value: 'TEACHER', label: '선생님' },
    { value: 'PARENT', label: '학부모' },
    { value: 'STUDENT', label: '학생' },
  ];

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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← 뒤로</Text>
            </TouchableOpacity>
            <Text style={styles.title}>회원가입</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.label}>회원 유형</Text>
            <View style={styles.roleButtons}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.roleButton,
                    role === r.value && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole(r.value)}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === r.value && styles.roleButtonTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
              testID="signup-email-input"
            />

            <Input
              type="password"
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder="8자 이상, 영문+숫자 조합"
              error={errors.password}
              testID="signup-password-input"
            />

            <Input
              type="text"
              label="이름"
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력해주세요"
              error={errors.name}
              testID="signup-name-input"
            />

            <Input
              type="tel"
              label="전화번호"
              value={phone}
              onChangeText={handlePhoneChange}
              placeholder="010-0000-0000"
              error={errors.phone}
              maxLength={13}
              testID="signup-phone-input"
            />
          </View>

          {/* Submit Button */}
          <View style={styles.buttonGroup}>
            <Button
              variant="primary"
              size="large"
              onPress={handleSignup}
              loading={isLoading}
              disabled={!email || !password || !name || !phone}
              testID="signup-submit-button"
            >
              가입하기
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              이미 계정이 있으신가요?{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('Login')}
              >
                로그인
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
    paddingVertical: spacing[4],
  },
  header: {
    marginBottom: spacing[6],
  },
  backButton: {
    fontSize: typography.fontSize.md,
    color: colors.primary[500],
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.text.primary,
  },
  roleSection: {
    marginBottom: spacing[6],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  roleButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  roleButton: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  roleButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  roleButtonTextActive: {
    color: colors.white,
  },
  formSection: {
    marginBottom: spacing[6],
  },
  buttonGroup: {
    marginBottom: spacing[6],
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  linkText: {
    color: colors.primary[500],
    fontWeight: '500',
  },
});

export default SignupScreen;
