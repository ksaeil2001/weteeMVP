import React, { FC, ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../constants/colors';
import { borderRadius, layout } from '../../constants/spacing';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'text' | 'icon';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onPress: () => void;
  children?: ReactNode;
  testID?: string;
  style?: ViewStyle;
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  onPress,
  children,
  testID,
  style,
}) => {
  const buttonStyles = getButtonStyles(variant, size, disabled);

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[buttonStyles.container, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary[500]}
        />
      ) : (
        <>
          {icon && <View style={buttonStyles.icon}>{icon}</View>}
          {children && (
            <Text style={buttonStyles.text}>
              {typeof children === 'string' ? children : children}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const getButtonStyles = (
  variant: string,
  size: string,
  disabled: boolean
): { container: ViewStyle; text: TextStyle; icon: ViewStyle } => {
  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  };

  const sizeStyles: Record<string, ViewStyle> = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    medium: {
      paddingVertical: layout.buttonPaddingVertical,
      paddingHorizontal: layout.buttonPaddingHorizontal,
    },
    large: {
      paddingVertical: layout.buttonPaddingVerticalLarge,
      paddingHorizontal: layout.buttonPaddingHorizontalLarge,
    },
  };

  const variantContainerStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: disabled ? colors.gray[300] : colors.primary[500],
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: disabled ? colors.gray[300] : colors.primary[500],
    },
    text: {
      backgroundColor: 'transparent',
    },
    icon: {
      backgroundColor: 'transparent',
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
  };

  const variantTextStyles: Record<string, TextStyle> = {
    primary: {
      color: disabled ? colors.gray[500] : colors.white,
    },
    secondary: {
      color: disabled ? colors.gray[400] : colors.primary[500],
    },
    text: {
      color: disabled ? colors.gray[400] : colors.primary[500],
    },
    icon: {
      color: disabled ? colors.gray[400] : colors.primary[500],
    },
  };

  const fontSizeMap: Record<string, number> = {
    small: 12,
    medium: 14,
    large: 16,
  };

  return {
    container: {
      ...baseContainer,
      ...sizeStyles[size],
      ...variantContainerStyles[variant],
    },
    text: {
      fontSize: fontSizeMap[size],
      fontWeight: '600',
      ...variantTextStyles[variant],
    },
    icon: {
      marginRight: 8,
    },
  };
};

export default Button;
