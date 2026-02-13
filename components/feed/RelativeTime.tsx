import { useEffect, useState } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { formatRelativeTime } from '@/utils/relativeTime';

interface RelativeTimeProps {
  isoDate: string;
  style?: TextStyle;
}

export function RelativeTime({ isoDate, style }: RelativeTimeProps) {
  const [label, setLabel] = useState(() => formatRelativeTime(isoDate));

  useEffect(() => {
    const update = () => setLabel(formatRelativeTime(isoDate));
    update();
    const id = setInterval(update, 30 * 1000);
    return () => clearInterval(id);
  }, [isoDate]);

  return <Text style={[styles.text, style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  text: { color: '#737373', fontSize: 13 },
});
