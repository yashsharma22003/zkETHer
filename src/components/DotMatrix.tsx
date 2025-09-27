import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../styles/colors';

interface DotMatrixProps {
  pattern: 'header' | 'balance' | 'privacy' | 'merkle' | 'network';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export default function DotMatrix({ 
  pattern, 
  size = 'md', 
  animated = true 
}: DotMatrixProps) {
  const getDotCount = () => {
    switch (pattern) {
      case 'header': return 3;
      case 'balance': return 20;
      case 'privacy': return 30;
      case 'merkle': return 15;
      case 'network': return 7;
      default: return 5;
    }
  };

  const getDotSize = () => {
    switch (size) {
      case 'sm': return 4;
      case 'md': return 8;
      case 'lg': return 12;
    }
  };

  const AnimatedDot = ({ index, delay = 0 }: { index: number; delay?: number }) => {
    const opacity = useRef(new Animated.Value(0.4)).current;
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
      if (animated) {
        const animate = () => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(opacity, {
                toValue: 1,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0.4,
                duration: 750,
                useNativeDriver: true,
              }),
            ]),
            { iterations: -1 }
          ).start();

          Animated.loop(
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 1.2,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 0.8,
                duration: 750,
                useNativeDriver: true,
              }),
            ]),
            { iterations: -1 }
          ).start();
        };

        const timer = setTimeout(animate, delay);
        return () => clearTimeout(timer);
      }
    }, [animated, delay, opacity, scale]);

    return (
      <Animated.View
        style={[
          styles.dot,
          {
            width: getDotSize(),
            height: getDotSize(),
            opacity: animated ? opacity : 0.8,
            transform: animated ? [{ scale }] : [],
          },
        ]}
      />
    );
  };

  const renderHeaderDots = () => (
    <View style={styles.headerContainer}>
      {Array.from({ length: getDotCount() }).map((_, i) => (
        <AnimatedDot key={i} index={i} delay={i * 200} />
      ))}
    </View>
  );

  const renderBalanceDots = () => (
    <View style={styles.balanceContainer}>
      {Array.from({ length: getDotCount() }).map((_, i) => (
        <AnimatedDot key={i} index={i} delay={i * 100} />
      ))}
    </View>
  );

  switch (pattern) {
    case 'header': return renderHeaderDots();
    case 'balance': return renderBalanceDots();
    default: return renderHeaderDots();
  }
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.text.primary,
    borderRadius: 50,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    maxWidth: 300,
  },
});
