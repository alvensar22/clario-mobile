import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface StripeWebViewProps {
  url: string;
  onClose: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * WebView component for Stripe Checkout or Billing Portal.
 * Detects success/cancel URLs and calls callbacks accordingly.
 */
export function StripeWebView({ url, onClose, onSuccess, onCancel }: StripeWebViewProps) {
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: { url: string }) => {
    const currentUrl = navState.url;

    // Checkout success: /payment/success?session_id=...
    if (currentUrl.includes('/payment/success')) {
      onSuccess?.();
      onClose();
      return;
    }

    // Portal return or cancel: /premium?canceled=true or just /premium
    if (currentUrl.includes('/premium')) {
      if (currentUrl.includes('canceled=true')) {
        onCancel?.();
      } else {
        // Portal return - refresh to get updated subscription state
        onSuccess?.();
      }
      onClose();
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Stripe</Text>
        <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <X size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#737373" />
        </View>
      )}

      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeBtn: {
    padding: 8,
  },
  loadingWrap: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
