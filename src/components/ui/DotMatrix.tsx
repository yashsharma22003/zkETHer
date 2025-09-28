import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../styles/colors';

interface DotMatrixProps {
  pattern: 'header' | 'balance' | 'privacy' | 'network' | 'commitment' | 'merkle';
  size?: 'small' | 'medium' | 'large';
}

export default function DotMatrix({ pattern, size = 'medium' }: DotMatrixProps) {
  const animatedValues = useRef<Animated.Value[]>([]);
  
  // Header dots: exactly 3 breathing dots like wallet cards but bigger for zkETHer title
  if (pattern === 'header') {
    if (animatedValues.current.length === 0) {
      animatedValues.current = Array.from({ length: 3 }, () => new Animated.Value(0.4));
    }

    const scaleAnim = useRef(
      Array.from({ length: 3 }, () => new Animated.Value(0.8))
    ).current;

    useEffect(() => {
      const startAnimation = () => {
        // Opacity animation
        const opacityAnimations = animatedValues.current.map((animValue, index) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(index * 200), // Stagger each dot
              Animated.timing(animValue, {
                toValue: 1,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0.4,
                duration: 750,
                useNativeDriver: true,
              }),
            ])
          );
        });

        // Scale animation
        const scaleAnimations = scaleAnim.map((scaleValue, index) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(index * 200), // Stagger each dot
              Animated.timing(scaleValue, {
                toValue: 1.2,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(scaleValue, {
                toValue: 0.8,
                duration: 750,
                useNativeDriver: true,
              }),
            ])
          );
        });

        Animated.parallel([...opacityAnimations, ...scaleAnimations]).start();
      };

      startAnimation();

      return () => {
        animatedValues.current.forEach(animValue => animValue.stopAnimation());
        scaleAnim.forEach(scaleValue => scaleValue.stopAnimation());
      };
    }, []);

    // Bigger dots for zkETHer title (size medium/large), smaller for wallet cards (size small)
    const dotSize = size === 'small' ? 4 : 6;

    return (
      <View style={styles.headerContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.headerDot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                opacity: animatedValues.current[i],
                transform: [{ scale: scaleAnim[i] }],
              },
            ]}
          />
        ))}
      </View>
    );
  }

  // Balance dots: 20 dots in a grid pattern like PWA
  if (pattern === 'balance') {
    if (animatedValues.current.length === 0) {
      animatedValues.current = Array.from({ length: 20 }, () => new Animated.Value(0.6));
    }

    useEffect(() => {
      const startAnimation = () => {
        const animations = animatedValues.current.map((animValue, index) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(index * 100),
              Animated.timing(animValue, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0.6,
                duration: 3000,
                useNativeDriver: true,
              }),
            ])
          );
        });

        Animated.parallel(animations).start();
      };

      startAnimation();

      return () => {
        animatedValues.current.forEach(animValue => animValue.stopAnimation());
      };
    }, []);

    return (
      <View style={styles.balanceContainer}>
        {Array.from({ length: 20 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.balanceDot,
              {
                opacity: animatedValues.current[i],
              },
            ]}
          />
        ))}
      </View>
    );
  }

  // Privacy dots: 30 dots with some filled, some empty like PWA
  if (pattern === 'privacy') {
    if (animatedValues.current.length === 0) {
      animatedValues.current = Array.from({ length: 30 }, () => new Animated.Value(0.3));
    }

    useEffect(() => {
      const startAnimation = () => {
        const animations = animatedValues.current.map((animValue, index) => {
          const isFilled = index < Math.floor(30 * 0.67); // 67% filled
          if (isFilled) {
            return Animated.loop(
              Animated.sequence([
                Animated.delay(index * 100),
                Animated.timing(animValue, {
                  toValue: 1,
                  duration: 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(animValue, {
                  toValue: 0.3,
                  duration: 2000,
                  useNativeDriver: true,
                }),
              ])
            );
          }
          return Animated.timing(animValue, { toValue: 0.3, duration: 0, useNativeDriver: true });
        });

        Animated.parallel(animations).start();
      };

      startAnimation();

      return () => {
        animatedValues.current.forEach(animValue => animValue.stopAnimation());
      };
    }, []);

    return (
      <View style={styles.privacyContainer}>
        {Array.from({ length: 30 }).map((_, i) => {
          const isFilled = i < Math.floor(30 * 0.67);
          return (
            <Animated.View
              key={i}
              style={[
                styles.privacyDot,
                {
                  backgroundColor: isFilled ? colors.text.primary : 'transparent',
                  borderWidth: isFilled ? 0 : 1,
                  borderColor: colors.text.secondary,
                  opacity: isFilled ? animatedValues.current[i] : 0.3,
                },
              ]}
            />
          );
        })}
      </View>
    );
  }

  // Network dots: 7x7 grid with center dot and radiating animation like PWA
  if (pattern === 'network') {
    const gridSize = 7;
    const totalDots = gridSize * gridSize;
    
    if (animatedValues.current.length === 0) {
      animatedValues.current = Array.from({ length: totalDots }, () => new Animated.Value(0.3));
    }

    const scaleAnim = useRef(
      Array.from({ length: totalDots }, () => new Animated.Value(0.8))
    ).current;

    useEffect(() => {
      const startAnimation = () => {
        const opacityAnimations = animatedValues.current.map((animValue, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const centerRow = 3;
          const centerCol = 3;
          const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
          
          // Only animate dots within distance 3 from center
          if (distance > 3) {
            return Animated.timing(animValue, { toValue: 0, duration: 0, useNativeDriver: true });
          }

          return Animated.loop(
            Animated.sequence([
              Animated.delay(distance * 500), // Delay based on distance from center
              Animated.timing(animValue, {
                toValue: 1,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0.3,
                duration: 750,
                useNativeDriver: true,
              }),
            ])
          );
        });

        const scaleAnimations = scaleAnim.map((scaleValue, index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          const centerRow = 3;
          const centerCol = 3;
          const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
          
          if (distance > 3) {
            return Animated.timing(scaleValue, { toValue: 0.8, duration: 0, useNativeDriver: true });
          }

          return Animated.loop(
            Animated.sequence([
              Animated.delay(distance * 500),
              Animated.timing(scaleValue, {
                toValue: 1.2,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(scaleValue, {
                toValue: 0.8,
                duration: 750,
                useNativeDriver: true,
              }),
            ])
          );
        });

        Animated.parallel([...opacityAnimations, ...scaleAnimations]).start();
      };

      startAnimation();

      return () => {
        animatedValues.current.forEach(animValue => animValue.stopAnimation());
        scaleAnim.forEach(scaleValue => scaleValue.stopAnimation());
      };
    }, []);

    return (
      <View style={styles.networkContainer}>
        {Array.from({ length: totalDots }).map((_, i) => {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          const centerRow = 3;
          const centerCol = 3;
          const isCenter = row === centerRow && col === centerCol;
          const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
          
          if (distance > 3) {
            return <View key={i} style={styles.networkEmptySlot} />;
          }

          return (
            <Animated.View
              key={i}
              style={[
                styles.networkDot,
                {
                  backgroundColor: isCenter ? colors.accent : 
                    distance === 1 ? colors.text.primary : colors.text.secondary,
                  opacity: animatedValues.current[i],
                  transform: [{ scale: scaleAnim[i] }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  }

  // Commitment dots: 5x5 grid with staggered animation like PWA
  if (pattern === 'commitment') {
    if (animatedValues.current.length === 0) {
      animatedValues.current = Array.from({ length: 25 }, () => new Animated.Value(0.4));
    }

    const scaleAnim = useRef(
      Array.from({ length: 25 }, () => new Animated.Value(0.8))
    ).current;

    useEffect(() => {
      const startAnimation = () => {
        const opacityAnimations = animatedValues.current.map((animValue, index) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(index * 100), // Stagger each dot
              Animated.timing(animValue, {
                toValue: 1,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0.4,
                duration: 750,
                useNativeDriver: true,
              }),
            ])
          );
        });

        const scaleAnimations = scaleAnim.map((scaleValue, index) => {
          return Animated.loop(
            Animated.sequence([
              Animated.delay(index * 100),
              Animated.timing(scaleValue, {
                toValue: 1.2,
                duration: 750,
                useNativeDriver: true,
              }),
              Animated.timing(scaleValue, {
                toValue: 0.8,
                duration: 750,
                useNativeDriver: true,
              }),
            ])
          );
        });

        Animated.parallel([...opacityAnimations, ...scaleAnimations]).start();
      };

      startAnimation();

      return () => {
        animatedValues.current.forEach(animValue => animValue.stopAnimation());
        scaleAnim.forEach(scaleValue => scaleValue.stopAnimation());
      };
    }, []);

    return (
      <View style={styles.commitmentContainer}>
        {Array.from({ length: 25 }).map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.commitmentDot,
              {
                opacity: animatedValues.current[i],
                transform: [{ scale: scaleAnim[i] }],
              },
            ]}
          />
        ))}
      </View>
    );
  }

  // Merkle tree dots: Tree structure with center accent dot like PWA
  if (pattern === 'merkle') {
    if (animatedValues.current.length === 0) {
      animatedValues.current = Array.from({ length: 15 }, () => new Animated.Value(0.5));
    }

    const scaleAnim = useRef(
      Array.from({ length: 15 }, () => new Animated.Value(1))
    ).current;

    useEffect(() => {
      const startAnimation = () => {
        const opacityAnimations = animatedValues.current.map((animValue, index) => {
          const isTopDot = index === 0;
          const isMiddleDots = index >= 1 && index <= 2;
          const isBottomDots = index >= 3 && index <= 6;
          const isLeafDots = index >= 7;
          
          const delay = isTopDot ? 0 : isMiddleDots ? 500 : isBottomDots ? 1000 : 1500;
          
          return Animated.loop(
            Animated.sequence([
              Animated.delay(delay),
              Animated.timing(animValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0.5,
                duration: 1500,
                useNativeDriver: true,
              }),
            ])
          );
        });

        const scaleAnimations = scaleAnim.map((scaleValue, index) => {
          const isAccentDot = index === 10; // One of the leaf dots
          if (isAccentDot) {
            return Animated.loop(
              Animated.sequence([
                Animated.timing(scaleValue, {
                  toValue: 1.4,
                  duration: 750,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleValue, {
                  toValue: 0.8,
                  duration: 750,
                  useNativeDriver: true,
                }),
              ])
            );
          }
          return Animated.timing(scaleValue, { toValue: 1, duration: 0, useNativeDriver: true });
        });

        Animated.parallel([...opacityAnimations, ...scaleAnimations]).start();
      };

      startAnimation();

      return () => {
        animatedValues.current.forEach(animValue => animValue.stopAnimation());
        scaleAnim.forEach(scaleValue => scaleValue.stopAnimation());
      };
    }, []);

    return (
      <View style={styles.merkleContainer}>
        {/* Top level - 1 dot */}
        <View style={styles.merkleRow}>
          <Animated.View
            style={[
              styles.merkleDot,
              {
                opacity: animatedValues.current[0],
                transform: [{ scale: scaleAnim[0] }],
              },
            ]}
          />
        </View>
        
        {/* Second level - 2 dots */}
        <View style={styles.merkleRow}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.merkleDot,
                styles.merkleDotSecondary,
                {
                  opacity: animatedValues.current[1 + i],
                  transform: [{ scale: scaleAnim[1 + i] }],
                },
              ]}
            />
          ))}
        </View>
        
        {/* Third level - 4 dots */}
        <View style={styles.merkleRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.merkleDot,
                styles.merkleDotTertiary,
                {
                  opacity: animatedValues.current[3 + i],
                  transform: [{ scale: scaleAnim[3 + i] }],
                },
              ]}
            />
          ))}
        </View>
        
        {/* Bottom level - 8 dots */}
        <View style={styles.merkleRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.merkleDot,
                i === 3 ? styles.merkleDotAccent : styles.merkleDotLeaf,
                {
                  opacity: animatedValues.current[7 + i],
                  transform: [{ scale: scaleAnim[7 + i] }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Header dots: 3 small greyish dots
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.secondary, // Greyish color like PWA
  },
  
  // Balance dots: 20 dots in grid
  balanceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    gap: 2,
  },
  balanceDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.text.primary,
  },
  
  // Privacy dots: 30 dots in a row
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexWrap: 'wrap',
    maxWidth: 300,
  },
  privacyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  
  // Network dots: 7x7 grid with radiating animation
  networkContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 84, // 7 dots * 8px + 6 gaps * 4px
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkEmptySlot: {
    width: 8,
    height: 8,
    margin: 2,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 2,
  },
  
  // Commitment dots: 5x5 grid with staggered animation
  commitmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 60, // 5 dots * 8px + 4 gaps * 5px
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commitmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.primary,
    margin: 2.5,
  },
  
  // Merkle tree dots: Tree structure with animated levels
  merkleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  merkleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  merkleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.text.primary,
  },
  merkleDotSecondary: {
    backgroundColor: colors.text.secondary,
    opacity: 0.7,
  },
  merkleDotTertiary: {
    backgroundColor: colors.text.secondary,
    opacity: 0.5,
  },
  merkleDotLeaf: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.secondary,
    opacity: 0.5,
  },
  merkleDotAccent: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
