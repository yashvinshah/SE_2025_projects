import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import './CustomerAnalytics.css';

interface CustomerData {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  avgOrdersPerCustomer: number;
  topCustomers: Array<{
    name: string;
    email: string;
    orders: number;
    points: number;
    totalSpent: number;
  }>;
  customerActivity: Array<{ month: string; active: number; inactive: number }>;
  pointsDistribution: Array<{ range: string; customers: number }>;
  customerSegments: Array<{ segment: string; count: number; color: string }>;
}

const CustomerAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CustomerData | null>(null);

  useEffect(() => {
    fetchCustomerData();
  }, [timeRange]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // API Endpoint: GET /api/analytics/customers?range={timeRange}
      // Expected Response: CustomerData shape as defined above
      const response = await fetch(`/api/analytics/customers?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching customer analytics:', error);
      setData(getMockCustomerData());
    } finally {
      setLoading(false);
    }
  };

  const getMockCustomerData = (): CustomerData => ({
    totalCustomers: 3542,
    activeCustomers: 2847,
    newCustomers: 284,
    avgOrdersPerCustomer: 8.3,
    topCustomers: [
      { name: 'Sarah Johnson', email: 's***@email.com', orders: 47, points: 8520, totalSpent: 1680 },
      { name: 'Mike Chen', email: 'm***@email.com', orders: 42, points: 7340, totalSpent: 1510 },
      { name: 'Emma Davis', email: 'e***@email.com', orders: 38, points: 6890, totalSpent: 1420 },
      { name: 'James Wilson', email: 'j***@email.com', orders: 35, points: 6120, totalSpent: 1290 },
      { name: 'Lisa Anderson', email: 'l***@email.com', orders: 33, points: 5780, totalSpent: 1180 },
    ],
    customerActivity: [
      { month: 'Aug', active: 2340, inactive: 980 },
      { month: 'Sep', active: 2520, inactive: 890 },
      { month: 'Oct', active: 2710, inactive: 820 },
      { month: 'Nov', active: 2847, inactive: 695 },
    ],
    pointsDistribution: [
      { range: '0-1000', customers: 1240 },
      { range: '1000-3000', customers: 1050 },
      { range: '3000-5000', customers: 680 },
      { range: '5000-10000', customers: 420 },
      { range: '10000+', customers: 152 },
    ],
    customerSegments: [
      { segment: 'VIP (10+ orders)', count: 892, color: '#ffd700' },
      { segment: 'Regular (5-10 orders)', count: 1456, color: '#667eea' },
      { segment: 'Occasional (2-4 orders)', count: 878, color: '#ff6b6b' },
      { segment: 'New (1 order)', count: 316, color: '#4caf50' },
    ],
  });

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!data) {
    return <div className="error">Failed to load analytics data</div>;
  }

  return (
    <div className="customer-analytics">
      <DateRangePicker value={timeRange} onChange={setTimeRange} />

      <div className="metrics-grid">
        <MetricCard
          title="Total Customers"
          value={data.totalCustomers.toLocaleString()}
          icon="👥"
          trend="+8.7%"
          trendUp={true}
        />
        <MetricCard
          title="Active Customers"
          value={data.activeCustomers.toLocaleString()}
          icon="✨"
          trend="+5.2%"
          trendUp={true}
        />
        <MetricCard
          title="New This Month"
          value={data.newCustomers.toLocaleString()}
          icon="🆕"
          trend="+12.3%"
          trendUp={true}
        />
        <MetricCard
          title="Avg Orders/Customer"
          value={data.avgOrdersPerCustomer.toFixed(1)}
          icon="📈"
          trend="+3.1%"
          trendUp={true}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Customer Activity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.customerActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" fill="#4caf50" name="Active" stackId="a" />
              <Bar dataKey="inactive" fill="#e0e0e0" name="Inactive" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Customer Segments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.customerSegments}
                dataKey="count"
                nameKey="segment"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: any) => `${entry.count}`}
              >
                {data.customerSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full-width">
          <h3>Points Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.pointsDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="customers" fill="#667eea" name="Customers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="top-customers-card">
          <h3>🏆 Top Customers by Orders & Points</h3>
          <div className="customers-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Points</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((customer, index) => (
                  <tr key={customer.email}>
                    <td className="rank">
                      <span className={`rank-badge rank-${index + 1}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <div className="customer-name">{customer.name}</div>
                        <div className="customer-email">{customer.email}</div>
                      </div>
                    </td>
                    <td className="orders-count">{customer.orders}</td>
                    <td className="points-count">{customer.points.toLocaleString()}</td>
                    <td className="spent-amount">${customer.totalSpent.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalytics;