import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';
import { typography } from '@/constants/font';
import Logo from '@/components/common/Logo';
import Header from '@/components/common/Header';

export default function LogoDemo() {
  return (
    <View style={styles.container}>
      <Header 
        showLogo={true} 
        title="Logo Demo"
        showBackButton={true}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: Colors.text }]}>
          Logo Variants
        </Text>
        
        <View style={styles.logoSection}>
          <Text style={[styles.label, { color: Colors.textSecondary }]}>
            Full Logo (Auth Screen)
          </Text>
          <View style={[styles.logoContainer, { backgroundColor: Colors.surfaceVariant }]}>
            <Logo variant="full" />
          </View>
        </View>
        
        <View style={styles.logoSection}>
          <Text style={[styles.label, { color: Colors.textSecondary }]}>
            Small Logo (Headers)
          </Text>
          <View style={[styles.logoContainer, { backgroundColor: Colors.surfaceVariant }]}>
            <Logo variant="small" />
          </View>
        </View>
        
        <View style={styles.logoSection}>
          <Text style={[styles.label, { color: Colors.textSecondary }]}>
            Square Logo (Profile/Icons)
          </Text>
          <View style={[styles.logoContainer, { backgroundColor: Colors.surfaceVariant }]}>
            <Logo variant="square" />
          </View>
        </View>
        
        <View style={styles.logoSection}>
          <Text style={[styles.label, { color: Colors.textSecondary }]}>
            Logo with Tint Color
          </Text>
          <View style={[styles.logoContainer, { backgroundColor: '#002EDC' }]}>
            <Logo variant="small" tintColor="#FFFFFF" />
          </View>
        </View>
        
        <Text style={[styles.note, { color: Colors.textSecondary }]}>
          💡 To use your custom logo, add your logo files to /assets/images/ and 
          update the Logo component to use local assets instead of the remote URL.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: typography.semibold,
    marginBottom: 24,
    textAlign: 'center',
  },
  logoSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: typography.medium,
    marginBottom: 8,
  },
  logoContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  note: {
    fontSize: 14,
    fontFamily: typography.regular,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 8,
  },
});
