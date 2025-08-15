import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface DeviceInfo {
  isAndroid: boolean;
  isIOS: boolean;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  isTablet: boolean;
  statusBarHeight: number;
  safeAreaPadding: number;
}

export const getDeviceInfo = (): DeviceInfo => {
  const isAndroid = Platform.OS === 'android';
  const isIOS = Platform.OS === 'ios';
  
  // Screen size classifications
  const isSmallScreen = screenHeight < 600 || screenWidth < 350;
  const isMediumScreen = screenHeight >= 600 && screenHeight < 800;
  const isLargeScreen = screenHeight >= 800;
  const isTablet = screenWidth >= 768 || (screenWidth >= 600 && screenHeight >= 800);
  
  // Status bar height calculation
  const getStatusBarHeight = () => {
    if (isIOS) {
      return screenHeight > 800 ? 44 : 20; // iPhone X+ vs older iPhones
    }
    return StatusBar.currentHeight || 24; // Android
  };
  
  const statusBarHeight = getStatusBarHeight();
  
  // Safe area padding for different devices
  const getSafeAreaPadding = () => {
    if (isIOS) {
      return screenHeight > 800 ? 20 : 10; // iPhone X+ vs older iPhones
    }
    return isSmallScreen ? 10 : 15; // Android small vs larger
  };
  
  return {
    isAndroid,
    isIOS,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
    statusBarHeight,
    safeAreaPadding: getSafeAreaPadding(),
  };
};

export const getResponsiveValue = (
  smallValue: number,
  mediumValue: number,
  largeValue: number
): number => {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isSmallScreen) return smallValue;
  if (deviceInfo.isMediumScreen) return mediumValue;
  return largeValue;
};

export const getLogoSize = () => {
  const deviceInfo = getDeviceInfo();
  
  if (deviceInfo.isAndroid) {
    if (deviceInfo.isSmallScreen) {
      return {
        width: Math.min(screenWidth * 0.7, 200),
        height: Math.min(screenHeight * 0.06, 50),
      };
    }
    return {
      width: Math.min(screenWidth * 0.8, 280),
      height: Math.min(screenHeight * 0.08, 70),
    };
  }
  
  // iOS
  return {
    width: Math.min(screenWidth * 0.85, 320),
    height: 80,
  };
};

export const getCenteringLayout = () => {
  const deviceInfo = getDeviceInfo();
  
  return {
    shouldCenterVertically: !deviceInfo.isSmallScreen,
    formSpacing: deviceInfo.isSmallScreen ? 20 : 
                 deviceInfo.isMediumScreen ? 30 : 40,
    containerPadding: deviceInfo.isSmallScreen ? 20 : 
                      deviceInfo.isMediumScreen ? 25 : 30,
  };
};

export const getHeaderLayout = () => {
  const deviceInfo = getDeviceInfo();
  
  return {
    paddingHorizontal: deviceInfo.isSmallScreen ? 12 : 
                       deviceInfo.isMediumScreen ? 16 : 20,
    buttonSize: deviceInfo.isSmallScreen ? 36 : 40,
    iconSize: deviceInfo.isSmallScreen ? 18 : 20,
    fontSize: deviceInfo.isSmallScreen ? 20 : 24,
    spacing: deviceInfo.isSmallScreen ? 8 : 12,
  };
};

export default {
  getDeviceInfo,
  getResponsiveValue,
  getLogoSize,
  getCenteringLayout,
  getHeaderLayout,
};
