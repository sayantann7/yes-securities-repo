import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '@/constants/Colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  animationDelay?: number;
}

export default function SkeletonLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style,
  animationDelay = 0 
}: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main pulse animation
    const pulseAnimation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
        delay: animationDelay,
      })
    );

    // Shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
        delay: animationDelay,
      })
    );

    pulseAnimation.start();
    shimmerAnimation.start();

    return () => {
      pulseAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [animatedValue, shimmerValue, animationDelay]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1.0, 0.6],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
  });

  return (
    <View style={[{ width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.skeleton,
          {
            width: '100%',
            height: '100%',
            borderRadius,
            opacity,
            backgroundColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});
