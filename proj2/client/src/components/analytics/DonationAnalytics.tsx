import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import MetricCard from './shared/MetricCard';
import DateRangePicker from './shared/DateRangePicker';
import './DonationAnalytics.css';

interface DonationData {
  totalMealsDonated: number;
  totalImpact: number;
  avgDonationsPerOrder: number;
  participatingRestaurants: number;
  donationsOverTime: Array<{ date: string; meals: number; cumulative: number }>;
  topContributors: Array<{
    restaurant: string;
    meals: number;
    percentage: number;
    isLocalLegend: boolean;
  }>;
  impactByCategory: Array<{ category: string; meals: number; value: number }>;
  monthlyGrowth: Array<{ month: string; donations: number; growth: number }>;
}

const DonationAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DonationData | null>(null);

  useEffect(() => {
    fetchDonationData();
  }, [timeRange]);

  const fetchDonationData = async () => {
    setLoading(true);
    try {
      // API Endpoint: GET /api/analytics/donations?range={timeRange}
      // Expected Response: DonationData shape as defined above
      const response = await fetch(`/api/analytics/donations?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching donation analytics:', error);
      setData(getMockDonationData());
    } finally {
      setLoading(false);
    }
  };

  const getMockDonationData = (): DonationData => ({
    totalMealsDonated: 3847,
    totalImpact: 38470,
    avgDonationsPerOrder: 3.08,
    participatingRestaurants: 89,
    donationsOverTime: [
      { date: '11/01', meals: 280, cumulative: 3287 },
      { date: '11/08', meals: 310, cumulative: 3597 },
      { date: '11/15', meals: 295, cumulative: 3892 },
      { date: '11/22', meals: 342, cumulative: 4234 },
    ],
    topContributors: [
      { restaurant: 'Pizza Palace', meals: 542, percentage: 14.1, isLocalLegend: true },
      { restaurant: 'Spice Haven', meals: 487, percentage: 12.7, isLocalLegend: true },
      { restaurant: 'Green Bowl', meals: 423, percentage: 11.0, isLocalLegend: true },
      { restaurant: 'Burger Barn', meals: 398, percentage: 10.3, isLocalLegend: false },
      { restaurant: 'Taco Fiesta', meals: 356, percentage: 9.3, isLocalLegend: false },
    ],
    impactByCategory: [
      { category: 'Local Legends', meals: 1840, value: 18400 },
      { category: 'Regular Restaurants', meals: 2007, value: 20070 },
    ],
    monthlyGrowth: [
      { month: 'Aug', donations: 2980, growth: 8.2 },
      { month: 'Sep', donations: 3245, growth: 8.9 },
      { month: 'Oct', donations: 3567, growth: 9.9 },
      { month: 'Nov', donations: 3847, growth: 7.8 },
    ],
  });

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="error">Failed to load analytics data</div>;
  }

  return (
    <div className="donation-analytics">
      <DateRangePicker value={timeRange} onChange={setTimeRange} />

      <div className="impact-banner">
        <div className="impact-icon">💝</div>
        <div className="impact-content">
          <h2>Social Impact Dashboard</h2>
          <p>
            Through the Meal-for-a-Meal program, Hungry Wolf has donated{' '}
            <strong>{data.totalMealsDonated.toLocaleString()} meals</strong> to those in need.
            Together, we're making a difference!
          </p>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Total Meals Donated"
          value={data.totalMealsDonated.toLocaleString()}
          icon="🍽️"
          trend="+7.8%"
          trendUp={true}
        />
        <MetricCard
          title="Total Impact Value"
          value={`$${data.totalImpact.toLocaleString()}`}
          icon="💰"
          trend="+7.8%"
          trendUp={true}
        />
        <MetricCard
          title="Avg per Order"
          value={data.avgDonationsPerOrder.toFixed(2)}
          icon="📊"
          trend="+2.1%"
          trendUp={true}
        />
        <MetricCard
          title="Participating Restaurants"
          value={data.participatingRestaurants.toString()}
          icon="🤝"
          trend="+4.7%"
          trendUp={true}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card full-width">
          <h3>Meals Donated Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.donationsOverTime}>
              <defs>
                <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4caf50" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="meals"
                stroke="#4caf50"
                fillOpacity={1}
                fill="url(#colorMeals)"
                name="Weekly Meals"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#ff6b6b"
                strokeWidth={3}
                name="Cumulative Total"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Monthly Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="donations" fill="#667eea" name="Donations" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="growth"
                stroke="#ffd700"
                strokeWidth={3}
                name="Growth %"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Impact by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.impactByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="meals" fill="#4caf50" name="Meals Donated" />
              <Bar dataKey="value" fill="#ffd700" name="Value ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="top-contributors-card">
          <h3>🏆 Top Contributing Restaurants</h3>
          <div className="contributors-list">
            {data.topContributors.map((contributor, index) => (
              <div key={contributor.restaurant} className="contributor-item">
                <div className="contributor-rank">
                  <span className={`rank-badge rank-${index + 1}`}>#{index + 1}</span>
                </div>
                <div className="contributor-info">
                  <div className="contributor-header">
                    <h4>{contributor.restaurant}</h4>
                    {contributor.isLocalLegend && (
                      <span className="local-legend-badge">Local Legend</span>
                    )}
                  </div>
                  <div className="contributor-stats">
                    <div className="stat">
                      <span className="meals-count">{contributor.meals.toLocaleString()}</span>
                      <span className="stat-label">meals donated</span>
                    </div>
                    <div className="stat">
                      <span className="percentage">{contributor.percentage}%</span>
                      <span className="stat-label">of total</span>
                    </div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${contributor.percentage * 7}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationAnalytics;