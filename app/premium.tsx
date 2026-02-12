import {
  ArrowLeft,
  Crown,
  Zap,
  ShieldCheck,
  Sparkles,
  Lock,
  Heart,
  Clock,
  Check,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { ManageSubscriptionButton } from '@/components/premium/ManageSubscriptionButton';
import { StripeWebView } from '@/components/premium/StripeWebView';
import { api } from '@/services/api/client';
import { useAuthStore } from '@/store/auth';

const MONTHLY_PRICE = 20;
const ANNUAL_PRICE_PER_MONTH = 16;
const ANNUAL_TOTAL = ANNUAL_PRICE_PER_MONTH * 12;

const FEATURES = [
  {
    icon: Zap,
    iconColor: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.15)',
    title: 'Unlimited Posts',
    description: 'See unlimited posts in your My Interests feed without daily limits',
  },
  {
    icon: ShieldCheck,
    iconColor: '#f472b6',
    bgColor: 'rgba(244, 114, 182, 0.15)',
    title: 'Priority Support',
    description: 'Get faster response times and dedicated support from our team',
  },
  {
    icon: Sparkles,
    iconColor: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    title: 'Exclusive Badges',
    description: 'Show off your Premium status with exclusive badges on your profile',
  },
  {
    icon: Lock,
    iconColor: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.15)',
    title: 'Advanced Analytics',
    description: 'Get detailed insights into your posts and engagement metrics',
  },
  {
    icon: Heart,
    iconColor: '#f472b6',
    bgColor: 'rgba(244, 114, 182, 0.15)',
    title: 'Ad-Free Experience',
    description: 'Enjoy a clean, uninterrupted browsing experience without ads',
  },
  {
    icon: Clock,
    iconColor: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    title: 'Early Access',
    description: 'Be the first to try new features and provide feedback',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: "Yes, you can cancel your Premium subscription at any time. Your access will continue until the end of your billing period.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards, debit cards, and PayPal.',
  },
  {
    q: 'Will I be charged immediately?',
    a: "Yes, you'll be charged immediately upon subscribing. For annual plans, you'll be charged the full amount upfront.",
  },
];

const INCLUDES = [
  'Unlimited posts in My Interests',
  'Priority support',
  'Exclusive premium badges',
  'Ad-free experience',
];

export default function PremiumScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ canceled?: string }>();
  const profile = useAuthStore((s) => s.profile);
  const loadSession = useAuthStore((s) => s.loadSession);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<'monthly' | 'annual' | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);

  const isPremium = profile?.is_premium === true;
  const showCancelMessage = params.canceled === 'true';

  useEffect(() => {
    loadSession().finally(() => setLoading(false));
  }, [loadSession]);

  // Refetch profile when screen gains focus (e.g. returning from Stripe checkout/portal)
  // so subscription state (is_premium, etc.) stays in sync after payment or cancel.
  useFocusEffect(
    useCallback(() => {
      if (!loading) loadSession();
    }, [loadSession, loading])
  );

  const handleSubscribe = useCallback(async (plan: 'monthly' | 'annual') => {
    setCheckoutLoading(plan);
    try {
      const res = await api.createCheckoutSession(plan);
      if (res.error) throw new Error(res.error);
      if (res.data?.url) {
        setWebViewUrl(res.data.url);
        return;
      }
      throw new Error('No checkout URL received');
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'Failed to start checkout. Please try again.'
      );
    } finally {
      setCheckoutLoading(null);
    }
  }, []);

  const handleWebViewSuccess = useCallback(() => {
    // Refresh profile to get updated subscription state
    loadSession();
  }, [loadSession]);

  const handleWebViewCancel = useCallback(() => {
    // User canceled - no action needed, just close WebView
  }, []);

  const handleWebViewClose = useCallback(() => {
    setWebViewUrl(null);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#737373" />
        </View>
      </SafeAreaView>
    );
  }

  // Show WebView when URL is set
  if (webViewUrl) {
    return (
      <StripeWebView
        url={webViewUrl}
        onClose={handleWebViewClose}
        onSuccess={handleWebViewSuccess}
        onCancel={handleWebViewCancel}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {showCancelMessage && (
          <View style={styles.cancelBanner}>
            <Text style={styles.cancelText}>
              Payment was canceled. You can try again anytime.
            </Text>
          </View>
        )}

        {isPremium ? (
          <View style={styles.manageSection}>
            <View style={styles.badgeRow}>
              <PremiumBadge size="lg" />
              <Text style={styles.manageTitle}>Premium</Text>
            </View>
            <Text style={styles.manageSubtitle}>
              You're a Premium member. Manage your subscription, payment method, and billing in Stripe's secure portal.
            </Text>
            <ManageSubscriptionButton onOpenWebView={setWebViewUrl} />
            <Text style={styles.manageHint}>
              You can update your payment method, view invoices, or cancel your subscription there.
            </Text>
          </View>
        ) : (
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>
                Choose your <Text style={styles.heroAccent}>Premium</Text> plan
              </Text>
              <Text style={styles.heroSubtitle}>
                Unlock unlimited access to My Interests feed and exclusive features
              </Text>
            </View>

            {/* Billing toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                onPress={() => setSelectedPlan('monthly')}
                style={[styles.toggleBtn, selectedPlan === 'monthly' && styles.toggleBtnActive]}
                activeOpacity={0.8}>
                <Text style={[styles.toggleText, selectedPlan === 'monthly' && styles.toggleTextActive]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedPlan('annual')}
                style={[styles.toggleBtn, selectedPlan === 'annual' && styles.toggleBtnActive]}
                activeOpacity={0.8}>
                <Text style={[styles.toggleText, selectedPlan === 'annual' && styles.toggleTextActive]}>
                  Annual
                </Text>
                <View style={styles.offBadge}>
                  <Text style={styles.offBadgeText}>20% off</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Plan cards */}
            <View style={styles.planCards}>
              <View style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}>
                {selectedPlan === 'monthly' && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current Selection</Text>
                  </View>
                )}
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>${MONTHLY_PRICE}<Text style={styles.planPeriod}>/month</Text></Text>
                <Text style={styles.planNote}>Billed monthly</Text>
                <TouchableOpacity
                  onPress={() => handleSubscribe('monthly')}
                  disabled={!!checkoutLoading}
                  style={[styles.subscribeBtn, checkoutLoading === 'monthly' && styles.subscribeBtnDisabled]}
                  activeOpacity={0.8}>
                  {checkoutLoading === 'monthly' ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.subscribeBtnText}>Subscribe Monthly</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={[styles.planCard, selectedPlan === 'annual' && styles.planCardActive]}>
                {selectedPlan === 'annual' && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current Selection</Text>
                  </View>
                )}
                <View style={styles.bestValueWrap}>
                  <Crown size={14} color="#fff" strokeWidth={2} />
                </View>
                <Text style={styles.planName}>Annual</Text>
                <Text style={styles.planPrice}>${ANNUAL_PRICE_PER_MONTH}<Text style={styles.planPeriod}>/month</Text></Text>
                <Text style={styles.planNote}>Billed ${ANNUAL_TOTAL} annually</Text>
                <Text style={styles.planSave}>Save ${(MONTHLY_PRICE - ANNUAL_PRICE_PER_MONTH) * 12} per year</Text>
                <TouchableOpacity
                  onPress={() => handleSubscribe('annual')}
                  disabled={!!checkoutLoading}
                  style={[styles.subscribeBtn, checkoutLoading === 'annual' && styles.subscribeBtnDisabled]}
                  activeOpacity={0.8}>
                  {checkoutLoading === 'annual' ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.subscribeBtnText}>Subscribe Annually</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Both plans include */}
            <View style={styles.includes}>
              <Text style={styles.includesTitle}>Both plans include:</Text>
              {INCLUDES.map((item, i) => (
                <View key={i} style={styles.includesRow}>
                  <View style={styles.checkWrap}>
                    <Check size={16} color="#a78bfa" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.includesItem}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Features */}
            <Text style={styles.sectionTitle}>Everything you get with Premium</Text>
            <View style={styles.featuresGrid}>
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <View key={i} style={styles.featureCard}>
                    <View style={[styles.featureIconWrap, { backgroundColor: f.bgColor }]}>
                      <Icon size={24} color={f.iconColor} strokeWidth={2} />
                    </View>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.description}</Text>
                  </View>
                );
              })}
            </View>

            {/* FAQ */}
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <View style={styles.faqList}>
              {FAQ_ITEMS.map((item, i) => (
                <View key={i} style={styles.faqCard}>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <Text style={styles.faqAnswer}>{item.a}</Text>
                </View>
              ))}
            </View>

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginLeft: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },
  cancelBanner: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.5)',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  cancelText: { fontSize: 14, color: '#fbbf24', textAlign: 'center' },
  manageSection: { marginTop: 24, alignItems: 'center', maxWidth: 400, alignSelf: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  manageTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  manageSubtitle: {
    fontSize: 15,
    color: '#a3a3a3',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  manageHint: { fontSize: 13, color: '#737373', textAlign: 'center', marginTop: 16, paddingHorizontal: 16 },
  hero: { marginTop: 24, marginBottom: 8 },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroAccent: { color: '#c084fc' },
  heroSubtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#a3a3a3',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 4,
    marginTop: 24,
    marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#fff' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#737373' },
  toggleTextActive: { color: '#000' },
  offBadge: {
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(192, 132, 252, 0.3)',
    alignSelf: 'center',
  },
  offBadgeText: { fontSize: 11, fontWeight: '600', color: '#c084fc' },
  planCards: { gap: 16 },
  planCard: {
    padding: 24,
    paddingTop: 28,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#404040',
    backgroundColor: '#171717',
    position: 'relative',
  },
  planCardActive: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: '#a78bfa',
  },
  currentBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  bestValueWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#a78bfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  planPrice: { fontSize: 32, fontWeight: '700', color: '#fff' },
  planPeriod: { fontSize: 16, fontWeight: '400', color: '#737373' },
  planNote: { fontSize: 13, color: '#737373', marginTop: 4 },
  planSave: { fontSize: 13, color: '#c084fc', marginTop: 4, marginBottom: 8 },
  subscribeBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { fontSize: 16, fontWeight: '600', color: '#000' },
  includes: {
    marginTop: 28,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: 'rgba(38, 38, 38, 0.6)',
  },
  includesTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 14 },
  includesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  checkWrap: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(167, 139, 250, 0.2)', alignItems: 'center', justifyContent: 'center' },
  includesItem: { fontSize: 14, color: '#d4d4d4', flex: 1 },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  featuresGrid: { gap: 16 },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: 'rgba(38, 38, 38, 0.5)',
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 6 },
  featureDesc: { fontSize: 14, color: '#a3a3a3', lineHeight: 20 },
  faqList: { gap: 12, marginTop: 8 },
  faqCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: 'rgba(38, 38, 38, 0.5)',
  },
  faqQuestion: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 },
  faqAnswer: { fontSize: 14, color: '#a3a3a3', lineHeight: 20 },
  bottomSpacer: { height: 24 },
});
