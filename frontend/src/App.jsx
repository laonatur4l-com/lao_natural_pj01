import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';

// Admin (Owner) pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ImportProducts from './pages/admin/ImportProducts';
import CategoryManagement from './pages/admin/CategoryManagement';
import ProductCatalog from './pages/admin/ProductCatalog';
import SellHistory from './pages/admin/SellHistory';
import Reports from './pages/admin/Reports';
import TotalRevenue from './pages/admin/TotalRevenue';
import EmployeeSalesReport from './pages/admin/EmployeeSalesReport';
import PromotionsManagement from './pages/admin/PromotionsManagement';

// Employee pages
import EmployeeLayout from './pages/employee/EmployeeLayout';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProducts from './pages/employee/EmployeeProducts';
import EmployeeOrders from './pages/employee/EmployeeOrders';
import EmployeeBanners from './pages/employee/EmployeeBanners';
import EmployeeDistributors from './pages/employee/EmployeeDistributors';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Admin Portal — Owner only (no Navbar/Footer) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="users/employees" element={<UserManagement />} />
                <Route path="users/customers" element={<UserManagement />} />
                <Route path="product-catalog" element={<ProductCatalog />} />
                <Route path="promotions" element={<PromotionsManagement />} />
                <Route path="sell-history" element={<SellHistory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="total-revenue" element={<TotalRevenue />} />
                <Route path="employee-sales" element={<EmployeeSalesReport />} />
              </Route>

              {/* Employee Portal — Employee + Owner (no Navbar/Footer) */}
              <Route
                path="/employee"
                element={
                  <ProtectedRoute allowedRoles={['employee', 'owner']}>
                    <EmployeeLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<EmployeeDashboard />} />
                <Route path="products" element={<EmployeeProducts />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="orders" element={<EmployeeOrders />} />
                <Route path="import-products" element={<ImportProducts />} />
                <Route path="promotions" element={<PromotionsManagement />} />
                <Route path="sell-history" element={<SellHistory />} />
                <Route path="reports" element={<Reports />} />
                <Route path="banners" element={<EmployeeBanners />} />
                <Route path="distributors" element={<EmployeeDistributors />} />
              </Route>

              {/* Public & Customer Routes (with Navbar/Footer) */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <main className="flex-grow">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={
                          <ProtectedRoute allowedRoles={['user', 'owner', 'employee']}>
                            <Checkout />
                          </ProtectedRoute>
                        } />
                        <Route path="/order/:id" element={
                          <ProtectedRoute allowedRoles={['user', 'owner', 'employee']}>
                            <OrderDetail />
                          </ProtectedRoute>
                        } />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={
                          <ProtectedRoute allowedRoles={['user', 'owner', 'employee']}>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                }
              />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
