import React, { useState } from 'react';
import { Image, View, StyleSheet, ActivityIndicator } from 'react-native';
import { getDeviceInfo } from '@/utils/deviceUtils';

interface LogoProps {
  variant?: 'full' | 'small' | 'square';
  style?: any;
  tintColor?: string;
}

const deviceInfo = getDeviceInfo();

export default function Logo({ variant = 'full', style, tintColor }: LogoProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getLogoSource = () => {
    // You can replace these with local assets when you add them
    switch (variant) {
      case 'small':
        return { uri: 'https://yesinvest.in/UploadImages/default-source/media/newlogo.png' };
      case 'square':
        return { uri: 'https://yesinvest.in/UploadImages/default-source/media/newlogo.png' };
      case 'full':
      default:
        return { uri: 'https://yesinvest.in/UploadImages/default-source/media/newlogo.png' };
    }
  };

  const getLogoStyle = () => {
    const baseStyle = {
      ...styles.logo,
      tintColor: tintColor,
    };

    switch (variant) {
      case 'small':
        return {
          ...baseStyle,
          width: deviceInfo.isSmallScreen ? 100 : 120,
          height: deviceInfo.isSmallScreen ? 25 : 30,
        };
      case 'square':
        return {
          ...baseStyle,
          width: deviceInfo.isSmallScreen ? 40 : 50,
          height: deviceInfo.isSmallScreen ? 40 : 50,
        };
      case 'full':
      default:
        return {
          ...baseStyle,
          width: deviceInfo.isSmallScreen ? 200 : 280,
          height: deviceInfo.isSmallScreen ? 50 : 70,
        };
    }
  };

  // For local assets, use this instead:
  // const getLocalLogoSource = () => {
  //   switch (variant) {
  //     case 'small':
  //       return require('@/assets/images/logo-small.png');
  //     case 'square':
  //       return require('@/assets/images/logo-square.png');
  //     case 'full':
  //     default:
  //       return require('@/assets/images/logo.png');
  //   }
  // };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={getLogoSource()}
        // source={getLocalLogoSource()} // Use this for local assets
        style={getLogoStyle()}
        resizeMode="contain"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      {loading && !error && (
        <View style={[styles.loadingOverlay, getLogoStyle()]}>
          <ActivityIndicator size="small" color="#002EDC" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});
