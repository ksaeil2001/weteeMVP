import React, { FC, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

interface HeaderAction {
  icon: ReactNode;
  onPress: () => void;
  badge?: number;
  testID?: string;
}

interface HeaderProps {
  type?: 'default' | 'large';
  title?: string | ReactNode;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
}

export const Header: FC<HeaderProps> = ({
  type = 'default',
  title,
  leftAction,
  rightActions = [],
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.content, type === 'large' && styles.large]}>
        {/* Left Action */}
        <View style={styles.leftSection}>
          {leftAction && (
            <TouchableOpacity
              onPress={leftAction.onPress}
              style={styles.action}
              testID={leftAction.testID}
            >
              {leftAction.icon}
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View style={styles.center}>
          {typeof title === 'string' ? (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            title
          )}
        </View>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={styles.action}
              testID={action.testID}
            >
              {action.icon}
              {action.badge !== undefined && action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {action.badge > 99 ? '99+' : action.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: spacing[4],
  },
  large: {
    height: 72,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  action: {
    padding: spacing[2],
    position: 'relative',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error.main,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});

export default Header;
