import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, Menu } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { typography } from '@/constants/font';
import { getHeaderLayout } from '@/utils/deviceUtils';
import Logo from './Logo';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  rightComponent?: React.ReactNode;
}

const headerLayout = getHeaderLayout();

export default function Header({
  title,
  showLogo = false,
  showBackButton = false,
  showMenuButton = false,
  onBackPress,
  onMenuPress,
  rightComponent,
}: HeaderProps) {
  return (
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity
            style={[styles.iconButton, { width: headerLayout.buttonSize, height: headerLayout.buttonSize }]}
            onPress={onBackPress}
          >
            <ArrowLeft size={headerLayout.iconSize} color={Colors.text} />
          </TouchableOpacity>
        )}
        
        {showMenuButton && (
          <TouchableOpacity
            style={[styles.iconButton, { width: headerLayout.buttonSize, height: headerLayout.buttonSize }]}
            onPress={onMenuPress}
          >
            <Menu size={headerLayout.iconSize} color={Colors.text} />
          </TouchableOpacity>
        )}
        
        {showLogo && (
          <Logo variant="small" style={{ marginLeft: showBackButton || showMenuButton ? headerLayout.spacing : 0 }} />
        )}
      </View>

      <View style={styles.centerSection}>
        {title && !showLogo && (
          <Text 
            style={[
              styles.title, 
              { 
                color: Colors.text,
                fontSize: headerLayout.fontSize,
              }
            ]} 
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </View>

      <View style={styles.rightSection}>
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: headerLayout.paddingHorizontal,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  title: {
    fontWeight: '600',
    fontFamily: typography.semibold,
    textAlign: 'center',
  },
});
