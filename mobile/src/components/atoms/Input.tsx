import React, { FC, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, layout, spacing } from '../../constants/spacing';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  autoFocus?: boolean;
  testID?: string;
}

export const Input: FC<InputProps> = ({
  type = 'text',
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  autoFocus = false,
  testID,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const keyboardType: KeyboardTypeOptions =
    type === 'email'
      ? 'email-address'
      : type === 'number'
      ? 'numeric'
      : type === 'tel'
      ? 'phone-pad'
      : 'default';

  const secureTextEntry = type === 'password' && !isPasswordVisible;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.errorBorder,
          disabled && styles.disabled,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            multiline && { height: numberOfLines * 24, textAlignVertical: 'top' },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
        />

        {type === 'password' && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
          >
            <Text style={styles.eyeIconText}>
              {isPasswordVisible ? '👁' : '👁‍🗨'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {maxLength && !error && (
        <Text style={styles.charCount}>
          {value.length} / {maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: layout.inputGap,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    paddingHorizontal: layout.inputPaddingHorizontal,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    paddingVertical: layout.inputPaddingVertical,
  },
  focused: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  errorBorder: {
    borderColor: colors.error.main,
  },
  disabled: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  eyeIcon: {
    padding: spacing[2],
  },
  eyeIconText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error.main,
    marginTop: spacing[1],
  },
  charCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.hint,
    marginTop: spacing[1],
    textAlign: 'right',
  },
});

export default Input;
