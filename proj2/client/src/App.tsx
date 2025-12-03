import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerDashboard from './pages/CustomerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RestaurantDashboard from './pages/RestaurantDashboard';
import SignupPage from './pages/SignupPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="App">
              <Navbar />
              <main className="main-content">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  
                  {/* Protected routes */}
                  <Route 
                    path="/customer/*" 
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/restaurant/*" 
                    element={
                      <ProtectedRoute allowedRoles={['restaurant']}>
                        <RestaurantDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/delivery/*" 
                    element={
                      <ProtectedRoute allowedRoles={['delivery']}>
                        <DeliveryDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Redirect unknown routes to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;