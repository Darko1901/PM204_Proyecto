import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

const LAYOUT_PROPS = [
  'position', 'top', 'bottom', 'left', 'right',
  'flex', 'flexGrow', 'flexShrink', 'flexBasis',
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'alignSelf',
];

export default function ScalePressable({ children, onPress, style, disabled, ...props }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: true,
    }).start();
  };

  const flattened = StyleSheet.flatten(style) || {};
  const layoutStyle = {};
  const innerStyle = {};

  Object.keys(flattened).forEach(key => {
    if (LAYOUT_PROPS.includes(key)) {
      layoutStyle[key] = flattened[key];
      // Si tiene ancho/alto definidos en layout, el Pressable interno debe rellenar el 100% de la caja layout
      if (key === 'width' || key === 'height') {
        innerStyle[key] = '100%';
      }
    } else {
      innerStyle[key] = flattened[key];
    }
  });

  return (
    <Animated.View
      style={[
        layoutStyle,
        {
          transform: [{ scale: scaleAnim }],
          justifyContent: 'center',
          alignItems: 'center',
        }
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={[innerStyle, { alignSelf: 'stretch' }]}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
