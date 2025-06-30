import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

interface DashboardStatProps {
  label: string;
  value: number;
  comparisonValue: number;
  percentageChange: number;
  unit?: string;
  isLoading: boolean;
}

const DashboardStat: React.FC<DashboardStatProps> = ({
  label,
  value,
  comparisonValue,
  percentageChange,
  unit = '',
  isLoading,
}) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const isPositive = percentageChange >= 0;

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.primary }]}>
        {value.toLocaleString()}
        {unit}
      </Text>
      <View style={styles.comparisonContainer}>
        <View style={[styles.percentageBadge, { backgroundColor: isPositive ? 'rgba(52, 168, 83, 0.1)' : 'rgba(234, 67, 53, 0.1)' }]}>
          {isPositive ? (
            <ArrowUp size={14} color="#34A853" />
          ) : (
            <ArrowDown size={14} color="#EA4335" />
          )}
          <Text style={[styles.percentageText, { color: isPositive ? '#34A853' : '#EA4335' }]}>
            {Math.abs(percentageChange).toFixed(1)}%
          </Text>
        </View>
        <Text style={[styles.comparisonText, { color: colors.textSecondary }]}>
          vs {comparisonValue.toLocaleString()} last week
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  comparisonText: {
    fontSize: 12,
  },
});

export default DashboardStat; 