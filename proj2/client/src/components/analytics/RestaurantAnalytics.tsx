import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import MetricCard from './shared/MetricCard';
import DateRangePicker from './shared/DateRangePicker';
import './RestaurantAnalytics.css';

interface RestaurantData {
  totalRestaurants: number;
  localLegends: number;
  avgRating: number;
  totalMenuItems: number;
  topRestaurants: Array<{
    name: string;
    cuisine: string;
    rating: number;
    orders: number;
    revenue: number;
    isLocalLegend: boolean;
  }>;
  ratingDistribution: Array<{ rating: string; count: number }>;
  menuPopularity: Array<{ category: string; orders: number }>;
  pointsAnalytics: Array<{
    restaurant: string;
    earned: number;
    redeemed: number;
  }>;
  performanceMetrics: Array<{
    metric: string;
    value: number;
  }>;
}

const RestaurantAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RestaurantData | null>(null);

  useEffect(() => {
    fetchRestaurantData();
  }, [timeRange]);

  const fetchRestaurantData = async () => {
    setLoading(true);
    try {
      // API Endpoint: GET /api/analytics/restaurants?range={timeRange}
      // Expected Response: RestaurantData shape as defined above
      const response = await fetch(`/api/analytics/restaurants?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching restaurant analytics:', error);
      setData(getMockRestaurantData());
    } finally {
      setLoading(false);
    }
  };

  const getMockRestaurantData = (): RestaurantData => ({
    totalRestaurants: 127,
    localLegends: 34,
    avgRating: 4.3,
    totalMenuItems: 1845,
    topRestaurants: [
      { name: 'Pizza Palace', cuisine: 'Italian', rating: 4.8, orders: 342, revenue: 12680, isLocalLegend: true },
      { name: 'Spice Haven', cuisine: 'Indian', rating: 4.7, orders: 318, revenue: 11240, isLocalLegend: true },
      { name: 'Burger Barn', cuisine: 'American', rating: 4.6, orders: 295, revenue: 10350, isLocalLegend: false },
      { name: 'Green Bowl', cuisine: 'Healthy', rating: 4.5, orders: 276, revenue: 9870, isLocalLegend: true },
      { name: 'Taco Fiesta', cuisine: 'Mexican', rating: 4.4, orders: 254, revenue: 8920, isLocalLegend: false },
    ],
    ratingDistribution: [
      { rating: '5.0', count: 28 },
      { rating: '4.5-4.9', count: 45 },
      { rating: '4.0-4.4', count: 38 },
      { rating: '3.5-3.9', count: 12 },
      { rating: '<3.5', count: 4 },
    ],
    menuPopularity: [
      { category: 'Pizza', orders: 456 },
      { category: 'Burgers', orders: 398 },
      { category: 'Asian', orders: 367 },
      { category: 'Salads', orders: 289 },
      { category: 'Desserts', orders: 234 },
      { category: 'Beverages', orders: 198 },
    ],
    pointsAnalytics: [
      { restaurant: 'Pizza Palace', earned: 12680, redeemed: 3450 },
      { restaurant: 'Spice Haven', earned: 11240, redeemed: 2890 },
      { restaurant: 'Burger Barn', earned: 10350, redeemed: 2560 },
      { restaurant: 'Green Bowl', earned: 9870, redeemed: 2120 },
      { restaurant: 'Taco Fiesta', earned: 8920, redeemed: 1980 },
    ],
    performanceMetrics: [
      { metric: 'Food Quality', value: 4.6 },
      { metric: 'Delivery Speed', value: 4.3 },
      { metric: 'Packaging', value: 4.5 },
      { metric: 'Value for Money', value: 4.2 },
      { metric: 'Customer Service', value: 4.4 },
    ],
  });

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="error">Failed to load analytics data</div>;
  }

  return (
    <div className="restaurant-analytics">
      <DateRangePicker value={timeRange} onChange={setTimeRange} />

      <div className="metrics-grid">
        <MetricCard
          title="Total Restaurants"
          value={data.totalRestaurants.toString()}
          icon="🍽️"
          trend="+3.2%"
          trendUp={true}
        />
        <MetricCard
          title="Local Legends"
          value={data.localLegends.toString()}
          icon="⭐"
          trend="+5.7%"
          trendUp={true}
        />
        <MetricCard
          title="Average Rating"
          value={data.avgRating.toFixed(1)}
          icon="🌟"
          trend="+0.2"
          trendUp={true}
        />
        <MetricCard
          title="Total Menu Items"
          value={data.totalMenuItems.toLocaleString()}
          icon="📋"
          trend="+12.5%"
          trendUp={true}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ffd700" name="Restaurants" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data.performanceMetrics}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 5]} />
              <Radar
                name="Average Score"
                dataKey="value"
                stroke="#667eea"
                fill="#667eea"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>Menu Category Popularity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.menuPopularity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#ff6b6b" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>Points Earned vs Redeemed</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.pointsAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="restaurant" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="earned" fill="#4caf50" name="Points Earned" />
              <Bar dataKey="redeemed" fill="#ff6b6b" name="Points Redeemed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="top-restaurants-card">
          <h3>🏆 Top Performing Restaurants</h3>
          <div className="restaurants-grid">
            {data.topRestaurants.map((restaurant, index) => (
              <div key={restaurant.name} className="restaurant-card">
                <div className="restaurant-rank">#{index + 1}</div>
                <div className="restaurant-header">
                  <h4>{restaurant.name}</h4>
                  {restaurant.isLocalLegend && (
                    <span className="local-legend-badge">Local Legend</span>
                  )}
                </div>
                <p className="restaurant-cuisine">{restaurant.cuisine}</p>
                <div className="restaurant-stats">
                  <div className="stat">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value rating">⭐ {restaurant.rating}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Orders</span>
                    <span className="stat-value">{restaurant.orders}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Revenue</span>
                    <span className="stat-value revenue">${restaurant.revenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantAnalytics;