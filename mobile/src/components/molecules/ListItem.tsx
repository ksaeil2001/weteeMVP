import React, { FC, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, layout } from '../../constants/spacing';
import { Badge } from '../atoms/Badge';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  badge?: string;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onPress?: () => void;
  onLongPress?: () => void;
  testID?: string;
}

export const ListItem: FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  badge,
  badgeVariant = 'primary',
  onPress,
  onLongPress,
  testID,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      disabled={!onPress && !onLongPress}
      testID={testID}
    >
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge && (
            <Badge variant={badgeVariant} size="small">
              {badge}
            </Badge>
          )}
        </View>

        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.listItemPadding,
    backgroundColor: colors.white,
  },
  leftIcon: {
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  rightIcon: {
    marginLeft: spacing[3],
  },
});

export default ListItem;
