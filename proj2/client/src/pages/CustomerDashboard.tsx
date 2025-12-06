// // import React from 'react';
// // import { Routes, Route } from 'react-router-dom';
// // import { useAuth } from '../contexts/AuthContext';
// // import { useQuery } from '@tanstack/react-query';
// // import { api } from '../services/api';
// // import CustomerHome from '../components/customer/CustomerHome';
// // import RestaurantList from '../components/customer/RestaurantList';
// // import Cart from '../components/customer/Cart';
// // import Orders from '../components/customer/Orders';
// // import Quests from '../components/customer/Quests';
// // import Profile from '../components/customer/Profile';
// // import Wishlist from '../components/customer/Wishlist';
// // import Subscription from '../components/customer/Subscription';
// // import './Dashboard.css';

// // const CustomerDashboard: React.FC = () => {
// //   const { user } = useAuth();

// //   const { data: points } = useQuery({
// //     queryKey: ['customerPoints', user?.id],
// //     queryFn: async () => {
// //       const response = await api.get(`/points?customerId=${user?.id}`);
// //       return response.data.points;
// //     },
// //     enabled: !!user
// //   });

// //   const { data: orders } = useQuery({
// //     queryKey: ['customerOrders', user?.id],
// //     queryFn: async () => {
// //       const response = await api.get(`/orders/customer?customerId=${user?.id}`);
// //       return response.data.orders;
// //     },
// //     enabled: !!user
// //   });

// //   return (
// //     <div className="dashboard">
// //       <div className="dashboard-header">
// //         <h1>Welcome back, {user?.profile?.name || 'Customer'}! 🐺</h1>
// //         <div className="dashboard-stats">
// //           <div className="stat-card">
// //             <div className="stat-icon">⭐</div>
// //             <div className="stat-content">
// //               <div className="stat-number">{points?.availablePoints || 0}</div>
// //               <div className="stat-label">Points Available</div>
// //             </div>
// //           </div>
// //           <div className="stat-card">
// //             <div className="stat-icon">📦</div>
// //             <div className="stat-content">
// //               <div className="stat-number">{orders?.length || 0}</div>
// //               <div className="stat-label">Total Orders</div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="dashboard-content">
// //         <Routes>
// //           <Route path="/" element={<CustomerHome />} />
// //           <Route path="/restaurants" element={<RestaurantList />} />
// //           <Route path="/cart" element={<Cart />} />
// //           <Route path="/orders" element={<Orders />} />
// //           <Route path="/quests" element={<Quests />} />
// //           <Route path="/profile" element={<Profile />} />
// //           <Route path="/wishlist" element={<Wishlist />} />
// //           <Route path="/subscription" element={<Subscription />} />
// //         </Routes>
// //       </div>
// //     </div>
// //   );
// // };

// // export default CustomerDashboard;



// import React from 'react';
// import { Routes, Route } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { useQuery } from '@tanstack/react-query';
// import { api } from '../services/api';
// import CustomerHome from '../components/customer/CustomerHome';
// import RestaurantList from '../components/customer/RestaurantList';
// import Cart from '../components/customer/Cart';
// import Orders from '../components/customer/Orders';
// import Quests from '../components/customer/Quests';
// import Profile from '../components/customer/Profile';
// import Wishlist from '../components/customer/Wishlist';
// import Subscription from '../components/customer/Subscription';
// import './Dashboard.css';

// const CustomerDashboard: React.FC = () => {
//   const { user } = useAuth();

//   const { data: points } = useQuery({
//     queryKey: ['customerPoints', user?.id],
//     queryFn: async () => {
//       try {
//         const response = await api.get(`/points?customerId=${user?.id}`);
//         return response.data.points;
//       } catch (error) {
//         console.error('Error fetching points:', error);
//         return { availablePoints: 0 }; // Return default value on error
//       }
//     },
//     enabled: !!user,
//     retry: 1,
//     staleTime: 30000, // Cache for 30 seconds
//   });

//   const { data: orders } = useQuery({
//     queryKey: ['customerOrders', user?.id],
//     queryFn: async () => {
//       try {
//         const response = await api.get(`/orders/customer?customerId=${user?.id}`);
//         return response.data.orders;
//       } catch (error) {
//         console.error('Error fetching orders:', error);
//         return []; // Return empty array on error
//       }
//     },
//     enabled: !!user,
//     retry: 1,
//     staleTime: 30000, // Cache for 30 seconds
//   });

//   return (
//     <div className="dashboard">
//       <div className="dashboard-header">
//         <h1>Welcome back, {user?.profile?.name || 'Customer'}! 🐺</h1>
//         <div className="dashboard-stats">
//           <div className="stat-card">
//             <div className="stat-icon">⭐</div>
//             <div className="stat-content">
//               <div className="stat-number">{points?.availablePoints || 0}</div>
//               <div className="stat-label">Points Available</div>
//             </div>
//           </div>
//           <div className="stat-card">
//             <div className="stat-icon">📦</div>
//             <div className="stat-content">
//               <div className="stat-number">{orders?.length || 0}</div>
//               <div className="stat-label">Total Orders</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="dashboard-content">
//         <Routes>
//           <Route path="/" element={<CustomerHome />} />
//           <Route path="restaurants" element={<RestaurantList />} />
//           <Route path="cart" element={<Cart />} />
//           <Route path="orders" element={<Orders />} />
//           <Route path="quests" element={<Quests />} />
//           <Route path="profile" element={<Profile />} />
//           <Route path="wishlist" element={<Wishlist />} />
//           <Route path="subscription" element={<Subscription />} />
//         </Routes>
//       </div>
//     </div>
//   );
// };

// export default CustomerDashboard;

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import CustomerHome from '../components/customer/CustomerHome';
import RestaurantList from '../components/customer/RestaurantList';
import Cart from '../components/customer/Cart';
import Orders from '../components/customer/Orders';
import Quests from '../components/customer/Quests';
import Profile from '../components/customer/Profile';
import Wishlist from '../components/customer/Wishlist';
import Subscription from '../components/customer/Subscription';
import './Dashboard.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>⚠️ Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', marginTop: '10px' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
const LoadingFallback = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
    <p>Loading...</p>
  </div>
);

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();

  console.log('🎯 CustomerDashboard rendering');
  console.log('👤 User:', user);

  const { data: points } = useQuery({
    queryKey: ['customerPoints', user?.id],
    queryFn: async () => {
      try {
        console.log('📡 Fetching points for user:', user?.id);
        const response = await api.get(`/points?customerId=${user?.id}`);
        console.log('✅ Points received:', response.data.points);
        return response.data.points;
      } catch (error: any) {
        console.error('❌ Error fetching points:', error);
        return { availablePoints: 0 };
      }
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 30000,
  });

  const { data: orders } = useQuery({
    queryKey: ['customerOrders', user?.id],
    queryFn: async () => {
      try {
        console.log('📡 Fetching orders for user:', user?.id);
        const response = await api.get(`/orders/customer?customerId=${user?.id}`);
        console.log('✅ Orders received:', response.data.orders);
        return response.data.orders;
      } catch (error: any) {
        console.error('❌ Error fetching orders:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 30000,
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.profile?.name || 'Customer'}! 🐺</h1>
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-number">{points?.availablePoints || 0}</div>
              <div className="stat-label">Points Available</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-number">{Array.isArray(orders) ? orders.length : 0}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={
                <ErrorBoundary>
                  <CustomerHome />
                </ErrorBoundary>
              } />
              <Route path="restaurants" element={
                <ErrorBoundary>
                  <RestaurantList />
                </ErrorBoundary>
              } />
              <Route path="cart" element={
                <ErrorBoundary>
                  <Cart />
                </ErrorBoundary>
              } />
              <Route path="orders" element={
                <ErrorBoundary>
                  <Orders />
                </ErrorBoundary>
              } />
              <Route path="quests" element={
                <ErrorBoundary>
                  <Quests />
                </ErrorBoundary>
              } />
              <Route path="profile" element={
                <ErrorBoundary>
                  <Profile />
                </ErrorBoundary>
              } />
              <Route path="wishlist" element={
                <ErrorBoundary>
                  <Wishlist />
                </ErrorBoundary>
              } />
              <Route path="subscription" element={
                <ErrorBoundary>
                  <Subscription />
                </ErrorBoundary>
              } />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default CustomerDashboard;