import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useColorScheme, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { BarChart, PieChart } from 'react-native-gifted-charts';

import { lightTheme, darkTheme } from '../../src/theme/theme';
import StyledText from '../../src/components/StyledText';
import { supabase } from '../../src/utils/supabase';
import { useAuth } from '../../src/context/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  const [isLoading, setIsLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  
  // Analytics State
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const { data: stockData } = await supabase.from('products').select('*').lt('stock', 10).order('stock', { ascending: true });
      if (stockData) setLowStockProducts(stockData);

      const { data: orderData } = await supabase.from('orders').select('totalAmount, createdAt, status').order('createdAt', { ascending: false }).limit(100);
      
      if (orderData) {
        setTotalRevenue(orderData.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0));
        
        // --- CHART 1: THE REVENUE & VOLUME OVERHAUL ---
        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d;
        }).reverse();

        // 🚀 Tracking BOTH revenue and count!
        const dailyStats: Record<string, { rev: number, count: number, dateObj: Date }> = {};
        const getLocalDateString = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        
        last7Days.forEach(d => {
          dailyStats[getLocalDateString(d)] = { rev: 0, count: 0, dateObj: d };
        });

        orderData.forEach(order => {
          const orderDate = new Date(order.createdAt);
          const localDateStr = getLocalDateString(orderDate);
          
          if (dailyStats[localDateStr]) {
            dailyStats[localDateStr].rev += Number(order.totalAmount || 0);
            dailyStats[localDateStr].count += 1; // 🚀 Tallying the sales count
          }
        });

        const barData = last7Days.map(d => {
          const stat = dailyStats[getLocalDateString(d)];
          return { 
            value: stat.rev, 
            label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
            frontColor: theme.primary,
            
            // 🚀 THE OVERHAUL: A beautiful, double-stacked label showing BOTH metrics!
            topLabelComponent: () => (
              <View style={{ width: 60, alignItems: 'center', marginBottom: 4 }}>
                {stat.rev > 0 || stat.count > 0 ? (
                  <>
                    <StyledText variant="caption" style={{ color: theme.text, fontSize: 10, fontWeight: '800' }}>
                      ${Math.round(stat.rev)}
                    </StyledText>
                    <StyledText variant="caption" style={{ color: theme.subtext, fontSize: 9, fontWeight: '600', marginTop: 2 }}>
                      {stat.count} {stat.count === 1 ? 'sale' : 'sales'}
                    </StyledText>
                  </>
                ) : null}
              </View>
            )
          };
        });
        setSalesData(barData);

        // --- CHART 2: FULFILLMENT STATUS ---
        let pending = 0, shipped = 0, delivered = 0;
        orderData.forEach(order => {
          if (order.status === 'pending') pending++;
          if (order.status === 'shipped') shipped++;
          if (order.status === 'delivered') delivered++;
        });

        setStatusData([
          { value: pending > 0 ? pending : 1, color: '#FF9500', text: 'Pending', realValue: pending },
          { value: shipped > 0 ? shipped : 1, color: '#007AFF', text: 'Shipped', realValue: shipped },
          { value: delivered > 0 ? delivered : 1, color: '#34C759', text: 'Delivered', realValue: delivered }
        ]);
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const handleLogout = async () => {
    if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await logout();
      Toast.show({ type: 'success', text1: 'Logged Out', text2: 'Securely signed out.' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Logout Failed', text2: error.message });
    }
  };

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  // 🚀 Gave it 50% headroom so the double-stacked label NEVER gets cut off
  const maxRevenue = Math.max(...salesData.map(d => d.value), 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View>
          <StyledText variant="h1">Command Center</StyledText>
          <StyledText variant="body" style={{ color: theme.subtext, marginTop: 8 }}>Store metrics and inventory control hub</StyledText>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.replace('/')} style={[styles.pillBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Ionicons name="storefront-outline" size={18} color={theme.text} />
            <StyledText variant="body" style={[styles.pillText, { color: theme.text }]}>Store</StyledText>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={[styles.pillBtn, { borderColor: theme.danger + '40', backgroundColor: theme.danger + '10' }]}>
            <Ionicons name="log-out-outline" size={18} color={theme.danger} />
            <StyledText variant="body" style={[styles.pillText, { color: theme.danger }]}>Logout</StyledText>
          </TouchableOpacity>
        </View>
      </View>

      {/* METRICS ROW */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: '#34C75920' }]}><Ionicons name="cash-outline" size={24} color="#34C759" /></View>
          <StyledText variant="caption" style={{ color: theme.subtext, marginTop: 12 }}>Total Revenue</StyledText>
          <StyledText variant="h2" style={{ marginTop: 4 }}>${totalRevenue.toFixed(2)}</StyledText>
        </View>
        <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.iconBox, { backgroundColor: '#FF950020' }]}><Ionicons name="warning-outline" size={24} color="#FF9500" /></View>
          <StyledText variant="caption" style={{ color: theme.subtext, marginTop: 12 }}>Action Required</StyledText>
          <StyledText variant="h2" style={{ marginTop: 4 }}>{lowStockProducts.length} Alerts</StyledText>
        </View>
      </View>

      {/* 🚀 CHART 1: THE OVERHAULED REVENUE & VOLUME CHART */}
      <View style={styles.section}>
        <StyledText variant="h3" style={styles.sectionTitle}>Daily Sales & Revenue</StyledText>
        <View style={[styles.chartWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          
          {/* 🚀 THE OVERHAULED LEGEND */}
          <View style={styles.barLegendContainer}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
              <StyledText variant="caption" style={{ color: theme.subtext, fontWeight: '600' }}>Bar Height = Gross Revenue (USD)</StyledText>
            </View>
            <View style={styles.legendRow}>
              <Ionicons name="pricetag-outline" size={14} color={theme.subtext} />
              <StyledText variant="caption" style={{ color: theme.subtext, fontWeight: '600' }}>Top Label = Volume (Number of Sales)</StyledText>
            </View>
          </View>

          <BarChart
            data={salesData}
            barWidth={28}
            spacing={24}
            roundedTop
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: theme.subtext, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: theme.subtext, fontSize: 11 }}
            noOfSections={4}
            maxValue={maxRevenue + (maxRevenue * 0.5)} 
            isAnimated
            animationDuration={800}
            rulesColor={theme.border}
            yAxisLabelPrefix="$"
          />
        </View>
      </View>

      {/* CHART 2: FULFILLMENT STATUS DONUT */}
      <View style={styles.section}>
        <StyledText variant="h3" style={styles.sectionTitle}>Operational Fulfillment</StyledText>
        <View style={[styles.donutWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <PieChart
            donut
            innerRadius={65}
            radius={90}
            data={statusData}
            isAnimated
            centerLabelComponent={() => (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <StyledText variant="h2">{statusData.reduce((a, b) => a + b.realValue, 0)}</StyledText>
                <StyledText variant="caption" style={{color: theme.subtext}}>Total Orders</StyledText>
              </View>
            )}
          />
          {/* Legend */}
          <View style={styles.legendContainer}>
            {statusData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <StyledText variant="body" style={{ color: theme.text }}>
                  {item.text}: <StyledText variant="body" style={{ fontWeight: '700' }}>{item.realValue}</StyledText>
                </StyledText>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* INVENTORY WATCHLIST */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <StyledText variant="h3" style={styles.sectionTitle}>Inventory Watchlist</StyledText>
          {lowStockProducts.length > 0 ? <StyledText variant="caption" style={{ color: '#FF3B30', fontWeight: '700' }}>Critical</StyledText> : null}
        </View>

        {lowStockProducts.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#34C759" />
            <StyledText variant="body" style={{ color: theme.subtext, marginTop: 12 }}>All products are fully stocked</StyledText>
          </View>
        ) : (
          lowStockProducts.map((product) => (
            <TouchableOpacity 
              key={product.id} 
              style={[styles.alertCard, { backgroundColor: theme.surface, borderColor: '#FF3B3030' }]} 
              onPress={() => router.push(`/(admin)/product-form?id=${product.id}` as any)}
            >
              <View style={styles.alertImageContainer}>
                {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.alertImage} contentFit="cover" /> : <Ionicons name="cube-outline" size={24} color={theme.subtext} />}
              </View>
              <View style={styles.alertInfo}>
                <StyledText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>{product.name}</StyledText>
                <StyledText variant="caption" style={{ color: '#FF3B30', marginTop: 4 }}>Only {product.stock} units remaining</StyledText>
              </View>
              <Ionicons name="create-outline" size={20} color={theme.primary} />
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
  content: { padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 100, maxWidth: 848, width: '100%', alignSelf: 'center' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  headerIcons: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  pillBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  pillText: { fontWeight: '700', fontSize: 13, marginLeft: 6 },
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
  chartWrapper: { padding: 20, borderRadius: 24, borderWidth: 1, width: '100%', paddingTop: 20, overflow: 'hidden' },
  donutWrapper: { padding: 24, borderRadius: 24, borderWidth: 1, width: '100%', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 24 },
  legendContainer: { justifyContent: 'center', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  barLegendContainer: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#33333330', gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});