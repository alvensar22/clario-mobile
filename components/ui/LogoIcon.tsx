import { View, StyleSheet } from 'react-native';

interface LogoIconProps {
  size?: number;
  color?: string;
}

export function LogoIcon({ size = 32, color = '#fff' }: LogoIconProps) {
  const outer = size;
  const inner = size / 4;
  return (
    <View
      style={[
        styles.outer,
        { width: outer, height: outer, borderRadius: outer / 2, borderColor: color },
      ]}>
      <View
        style={[
          styles.inner,
          { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  inner: {},
});
