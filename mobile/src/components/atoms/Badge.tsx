import React, { FC, ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, spacing } from '../../constants/spacing';

interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
  children: ReactNode;
  testID?: string;
}

export const Badge: FC<BadgeProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  testID,
}) => {
  const badgeStyles = getBadgeStyles(variant, size);

  return (
    <View style={badgeStyles.container} testID={testID}>
      <Text style={badgeStyles.text}>{children}</Text>
    </View>
  );
};

const getBadgeStyles = (
  variant: string,
  size: string
): { container: ViewStyle; text: TextStyle } => {
  const variantStyles: Record<string, { bg: string; text: string }> = {
    primary: {
      bg: colors.primary[100],
      text: colors.primary[700],
    },
    secondary: {
      bg: colors.gray[200],
      text: colors.gray[700],
    },
    success: {
      bg: colors.success.light,
      text: colors.success.dark,
    },
    warning: {
      bg: colors.warning.light,
      text: colors.warning.dark,
    },
    error: {
      bg: colors.error.light,
      text: colors.error.dark,
    },
    info: {
      bg: colors.info.light,
      text: colors.info.dark,
    },
  };

  const sizeStyles: Record<string, { padding: number; fontSize: number }> = {
    small: {
      padding: spacing[1],
      fontSize: typography.fontSize.xs,
    },
    medium: {
      padding: spacing[2],
      fontSize: typography.fontSize.sm,
    },
  };

  return {
    container: {
      backgroundColor: variantStyles[variant].bg,
      paddingHorizontal: sizeStyles[size].padding + 4,
      paddingVertical: sizeStyles[size].padding,
      borderRadius: borderRadius.md,
      alignSelf: 'flex-start',
    },
    text: {
      color: variantStyles[variant].text,
      fontSize: sizeStyles[size].fontSize,
      fontWeight: '600',
    },
  };
};

export default Badge;
