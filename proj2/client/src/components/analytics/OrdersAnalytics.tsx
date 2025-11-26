import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import MetricCard from './shared/MetricCard';
import DateRangePicker from './shared/DateRangePicker';
import './OrdersAnalytics.css';

interface OrdersData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
  ordersOverTime: Array<{ date: string; orders: number; revenue: number }>;
  topItems: Array<{ name: string; orders: number; revenue: number }>;
  revenueByRestaurant: Array<{ restaurant: string; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number; color: string }>;
}

const OrdersAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrdersData | null>(null);

  useEffect(() => {
    fetchOrdersData();
  }, [timeRange]);

  const fetchOrdersData = async () => {
    setLoading(true);
    try {
      // API Endpoint: GET /api/analytics/orders?range={timeRange}
      // Expected Response: OrdersData shape as defined above
      const response = await fetch(`/api/analytics/orders?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching orders analytics:', error);
      // Using mock data for demonstration
      setData(getMockOrdersData());
    } finally {
      setLoading(false);
    }
  };

  const getMockOrdersData = (): OrdersData => ({
    totalOrders: 1247,
    totalRevenue: 45620,
    avgOrderValue: 36.58,
    completionRate: 94.2,
    ordersOverTime: [
      { date: '11/01', orders: 45, revenue: 1650 },
      { date: '11/08', orders: 52, revenue: 1920 },
      { date: '11/15', orders: 48, revenue: 1755 },
      { date: '11/22', orders: 61, revenue: 2230 },
    ],
    topItems: [
      { name: 'Margherita Pizza', orders: 156, revenue: 2340 },
      { name: 'Chicken Tikka', orders: 142, revenue: 2130 },
      { name: 'Caesar Salad', orders: 128, revenue: 1536 },
      { name: 'Beef Burger', orders: 119, revenue: 1785 },
      { name: 'Pad Thai', orders: 98, revenue: 1372 },
    ],
    revenueByRestaurant: [
      { restaurant: 'Pizza Palace', revenue: 8450 },
      { restaurant: 'Spice Haven', revenue: 7230 },
      { restaurant: 'Burger Barn', revenue: 6890 },
      { restaurant: 'Green Bowl', revenue: 5670 },
      { restaurant: 'Taco Fiesta', revenue: 4820 },
    ],
    ordersByStatus: [
      { status: 'Delivered', count: 1174, color: '#4caf50' },
      { status: 'In Progress', count: 43, color: '#2196f3' },
      { status: 'Cancelled', count: 30, color: '#f44336' },
    ],
  });

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="error">Failed to load analytics data</div>;
  }

  return (
    <div className="orders-analytics">
      <DateRangePicker value={timeRange} onChange={setTimeRange} />

      <div className="metrics-grid">
        <MetricCard
          title="Total Orders"
          value={data.totalOrders.toLocaleString()}
          icon="📦"
          trend="+12.5%"
          trendUp={true}
        />
        <MetricCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toLocaleString()}`}
          icon="💰"
          trend="+8.3%"
          trendUp={true}
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${data.avgOrderValue.toFixed(2)}`}
          icon="📊"
          trend="-2.1%"
          trendUp={false}
        />
        <MetricCard
          title="Completion Rate"
          value={`${data.completionRate}%`}
          icon="✅"
          trend="+1.8%"
          trendUp={true}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Orders & Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.ordersOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="orders"
                stroke="#667eea"
                strokeWidth={3}
                name="Orders"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#ffd700"
                strokeWidth={3}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Orders by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.ordersByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: any) => `${entry.status}: ${entry.count}`}
              >
                {data.ordersByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>Top Selling Menu Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topItems}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#667eea" name="Orders" />
              <Bar dataKey="revenue" fill="#ff6b6b" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>Revenue by Restaurant</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenueByRestaurant} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="restaurant" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#667eea" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default OrdersAnalytics;