// Screen S-005: 비밀번호 재설정 화면
// Related feature: F-001 회원가입 및 로그인
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { z } from 'zod';
import { AuthStackParamList } from '../../navigation/types';
import { authService } from '../../services/authService';
import { Button, Input } from '../../components';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, layout } from '../../constants/spacing';

interface ResetPasswordScreenProps {
  navigation: StackNavigationProp<AuthStackParamList, 'ResetPassword'>;
}

const emailSchema = z.string().email('올바른 이메일 형식을 입력해주세요');

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async () => {
    try {
      emailSchema.parse(email);
      setError(undefined);

      setIsLoading(true);

      await authService.resetPassword(email);

      setIsSent(true);
      Alert.alert(
        '이메일 전송 완료',
        '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else {
        Alert.alert('오류', '이메일 전송에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>비밀번호 재설정</Text>
            <Text style={styles.subtitle}>
              가입 시 사용한 이메일을 입력하시면{'\n'}
              비밀번호 재설정 링크를 보내드립니다.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Input
              type="email"
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              error={error}
              autoFocus
              testID="reset-email-input"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <Button
              variant="primary"
              size="large"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!email || isSent}
              testID="reset-submit-button"
            >
              {isSent ? '전송 완료' : '재설정 링크 받기'}
            </Button>

            <Button
              variant="text"
              size="medium"
              onPress={() => navigation.goBack()}
              style={{ marginTop: spacing[3] }}
            >
              로그인으로 돌아가기
            </Button>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingHorizontal,
    paddingVertical: spacing[8],
  },
  header: {
    marginBottom: spacing[8],
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  formSection: {
    marginBottom: spacing[6],
  },
  buttonGroup: {
    marginTop: 'auto',
  },
});

export default ResetPasswordScreen;
