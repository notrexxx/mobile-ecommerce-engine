import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, ActivityIndicator, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { lightTheme, darkTheme } from '../../src/theme/theme';
import StyledText from '../../src/components/StyledText';
import { supabase } from '../../src/utils/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();

  const [isLoading, setIsLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesHistory, setSalesHistory] = useState<{ label: string; value: number }[]>([]);

  const fetchDashboardData = async () => {
    try {
      const { data: stockData, error: stockError } = await supabase
        .from('products')
        .select('*')
        .lt('stock', 10)
        .order('stock', { ascending: true });
        
      if (!stockError && stockData) setLowStockProducts(stockData);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('totalAmount, createdAt')
        .order('createdAt', { ascending: false })
        .limit(50);

      if (!orderError && orderData) {
        const revenue = orderData.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
        setTotalRevenue(revenue);

        const analyticalData = orderData.slice(0, 6).map((order) => {
          const dateObj = new Date(order.createdAt);
          const formattedDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return { label: formattedDate, value: Number(order.totalAmount || 0) };
        }).reverse();

        while (analyticalData.length < 6) {
          analyticalData.unshift({ label: '-', value: 0 });
        }

        setSalesHistory(analyticalData);
      }
    } catch (error) {
      console.error("Dashboard calculation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const maxSaleValue = Math.max(...salesHistory.map(item => item.value), 1);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* HEADER & QUICK ACTIONS */}
      <View style={styles.headerContainer}>
        <View>
          <StyledText variant="h1">Command Center</StyledText>
          <StyledText variant="body" style={{ color: theme.subtext, marginTop: 8 }}>
            Store metrics and inventory control hub.
          </StyledText>
        </View>

        {/* 🚀 QUICK ACTION: ADD PRODUCT */}
        <TouchableOpacity 
          style={[styles.quickActionButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/(admin)/edit-product')}
        >
          <Ionicons name="add-circle" size={20} color={theme.background} />
          <StyledText variant="body" style={{ color: theme.background, fontWeight: '700', marginLeft: 8 }}>
            Add Product
          </StyledText>
        </TouchableOpacity>
      </View>

      {/* CORE METRIC BLOCK */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: '#34C75920' }]}>
            <Ionicons name="cash-outline" size={24} color="#34C759" />
          </View>
          <StyledText variant="caption" style={{ color: theme.subtext, marginTop: 12 }}>Total Revenue</StyledText>
          <StyledText variant="h2" style={{ marginTop: 4 }}>${totalRevenue.toFixed(2)}</StyledText>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: '#FF950020' }]}>
            <Ionicons name="warning-outline" size={24} color="#FF9500" />
          </View>
          <StyledText variant="caption" style={{ color: theme.subtext, marginTop: 12 }}>Action Required</StyledText>
          <StyledText variant="h2" style={{ marginTop: 4 }}>{lowStockProducts.length} Alerts</StyledText>
        </View>
      </View>

      {/* 🚀 BULLETPROOF NATIVE CHART ENGINE */}
      <View style={styles.section}>
        <StyledText variant="h3" style={styles.sectionTitle}>Recent Volume Performance</StyledText>
        <View style={[styles.chartContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.chartBarArea}>
            {salesHistory.map((item, index) => {
              const barHeightPercentage = `${Math.max((item.value / maxSaleValue) * 100, 6)}%`;
              return (
                <View key={index} style={styles.chartColumn}>
                  <View style={styles.barValueWrapper}>
                    {item.value > 0 && (
                      <StyledText variant="caption" style={styles.barValueText}>${Math.round(item.value)}</StyledText>
                    )}
                  </View>
                  <View style={[styles.chartBar, { height: barHeightPercentage as any, backgroundColor: theme.primary }]} />
                  <StyledText variant="caption" style={[styles.chartLabel, { color: theme.subtext }]} numberOfLines={1}>{item.label}</StyledText>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* DEDICATED INVENTORY WATCHLIST */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <StyledText variant="h3" style={styles.sectionTitle}>Inventory Watchlist</StyledText>
          {lowStockProducts.length > 0 && (
            <StyledText variant="caption" style={{ color: '#FF3B30', fontWeight: '700' }}>Critical</StyledText>
          )}
        </View>

        {lowStockProducts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#34C759" />
            <StyledText variant="body" style={{ color: theme.subtext, marginTop: 12 }}>All products are fully stocked.</StyledText>
          </View>
        ) : (
          lowStockProducts.map((product) => (
            <TouchableOpacity 
              key={product.id} 
              style={[styles.alertCard, { backgroundColor: theme.surface, borderColor: '#FF3B3030' }]}
              onPress={() => router.push('/(admin)/products')}
            >
              <View style={styles.alertImageContainer}>
                {product.imageUrl ? (
                  <Image source={{ uri: product.imageUrl }} style={styles.alertImage} contentFit="cover" />
                ) : (
                  <Ionicons name="cube-outline" size={24} color={theme.subtext} />
                )}
              </View>
              <View style={styles.alertInfo}>
                <StyledText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{product.name}</StyledText>
                <StyledText variant="caption" style={{ color: '#FF3B30', marginTop: 4 }}>Only {product.stock} units remaining</StyledText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
            </TouchableOpacity>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 100, maxWidth: 848, width: '100%', alignSelf: 'center' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  quickActionButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
  metricsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  metricCard: { flex: 1, padding: 20, borderRadius: 20, borderWidth: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 8 },
  emptyState: { padding: 32, borderRadius: 20, borderWidth: 1, alignItems: 'center', borderStyle: 'dashed' },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  alertImageContainer: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 16 },
  alertImage: { width: '100%', height: '100%' },
  alertInfo: { flex: 1, paddingRight: 16 },
  chartContainer: { padding: 20, borderRadius: 24, borderWidth: 1, width: '100%' },
  chartBarArea: { flexDirection: 'row', height: 240, justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 24 },
  chartColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '60%', maxWidth: 36, borderRadius: 6, minHeight: 4 },
  chartLabel: { fontSize: 11, marginTop: 8, textAlign: 'center', width: '100%' },
  barValueWrapper: { height: 20, justifyContent: 'center', marginBottom: 4 },
  barValueText: { fontSize: 10, fontWeight: '700', textAlign: 'center' }
});