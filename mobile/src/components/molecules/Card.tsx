import React, { FC, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../constants/colors';
import { borderRadius, layout, shadows } from '../../constants/spacing';

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  onPress?: () => void;
  testID?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: FC<CardProps> = ({
  variant = 'default',
  onPress,
  testID,
  children,
  style,
}) => {
  const cardStyles = getCardStyles(variant);

  const CardContent = (
    <View style={[cardStyles.container, style]}>{children}</View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} testID={testID}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return <View testID={testID}>{CardContent}</View>;
};

const getCardStyles = (variant: string): { container: ViewStyle } => {
  const baseStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: layout.cardPadding,
  };

  const variantStyles: Record<string, ViewStyle> = {
    default: {},
    elevated: shadows.md,
    outlined: {
      borderWidth: 1,
      borderColor: colors.border.light,
    },
  };

  return {
    container: {
      ...baseStyle,
      ...variantStyles[variant],
    },
  };
};

export default Card;
