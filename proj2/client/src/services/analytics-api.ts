/**
 * Analytics API Service
 * 
 * This file contains API calls for fetching analytics data.
 * Backend endpoints need to be implemented to return data in the specified shapes.
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
async function fetchAnalytics<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add auth token if required
      // 'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Orders Analytics API
export interface OrdersAnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  completionRate: number;
  ordersOverTime: Array<{ date: string; orders: number; revenue: number }>;
  topItems: Array<{ name: string; orders: number; revenue: number }>;
  revenueByRestaurant: Array<{ restaurant: string; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number; color: string }>;
}

/**
 * GET /api/analytics/orders?range={week|month|year}
 * 
 * Expected Response Shape:
 * {
 *   totalOrders: number,
 *   totalRevenue: number,
 *   avgOrderValue: number,
 *   completionRate: number (percentage),
 *   ordersOverTime: [{ date: "MM/DD", orders: number, revenue: number }],
 *   topItems: [{ name: string, orders: number, revenue: number }],
 *   revenueByRestaurant: [{ restaurant: string, revenue: number }],
 *   ordersByStatus: [{ status: string, count: number, color: string }]
 * }
 */
export async function getOrdersAnalytics(range: 'week' | 'month' | 'year'): Promise<OrdersAnalyticsData> {
  return fetchAnalytics<OrdersAnalyticsData>(`/analytics/orders?range=${range}`);
}

// Customer Analytics API
export interface CustomerAnalyticsData {
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

/**
 * GET /api/analytics/customers?range={week|month|year}
 * 
 * Expected Response Shape:
 * {
 *   totalCustomers: number,
 *   activeCustomers: number,
 *   newCustomers: number,
 *   avgOrdersPerCustomer: number,
 *   topCustomers: [{ name, email, orders, points, totalSpent }],
 *   customerActivity: [{ month, active, inactive }],
 *   pointsDistribution: [{ range, customers }],
 *   customerSegments: [{ segment, count, color }]
 * }
 */
export async function getCustomerAnalytics(range: 'week' | 'month' | 'year'): Promise<CustomerAnalyticsData> {
  return fetchAnalytics<CustomerAnalyticsData>(`/analytics/customers?range=${range}`);
}

// Restaurant Analytics API
export interface RestaurantAnalyticsData {
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
  pointsAnalytics: Array<{ restaurant: string; earned: number; redeemed: number }>;
  performanceMetrics: Array<{ metric: string; value: number }>;
}

/**
 * GET /api/analytics/restaurants?range={week|month|year}
 * 
 * Expected Response Shape:
 * {
 *   totalRestaurants: number,
 *   localLegends: number,
 *   avgRating: number,
 *   totalMenuItems: number,
 *   topRestaurants: [{ name, cuisine, rating, orders, revenue, isLocalLegend }],
 *   ratingDistribution: [{ rating, count }],
 *   menuPopularity: [{ category, orders }],
 *   pointsAnalytics: [{ restaurant, earned, redeemed }],
 *   performanceMetrics: [{ metric, value }]
 * }
 */
export async function getRestaurantAnalytics(range: 'week' | 'month' | 'year'): Promise<RestaurantAnalyticsData> {
  return fetchAnalytics<RestaurantAnalyticsData>(`/analytics/restaurants?range=${range}`);
}

// Donation Analytics API
export interface DonationAnalyticsData {
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

/**
 * GET /api/analytics/donations?range={week|month|year}
 * 
 * Expected Response Shape:
 * {
 *   totalMealsDonated: number,
 *   totalImpact: number (dollar value),
 *   avgDonationsPerOrder: number,
 *   participatingRestaurants: number,
 *   donationsOverTime: [{ date, meals, cumulative }],
 *   topContributors: [{ restaurant, meals, percentage, isLocalLegend }],
 *   impactByCategory: [{ category, meals, value }],
 *   monthlyGrowth: [{ month, donations, growth }]
 * }
 */
export async function getDonationAnalytics(range: 'week' | 'month' | 'year'): Promise<DonationAnalyticsData> {
  return fetchAnalytics<DonationAnalyticsData>(`/analytics/donations?range=${range}`);
}