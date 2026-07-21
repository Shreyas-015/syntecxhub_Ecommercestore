import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./hooks/useCart";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AddressProvider } from "./context/AddressContext";
import { PaymentProvider } from "./context/PaymentContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { GuestRoute } from "./components/auth/GuestRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { Layout } from "./components/layout/Layout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { FullPageSkeletonLoader } from "./components/common/Skeleton";

// Lazy-loaded Page Components
const Home = lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts").then(m => ({ default: m.AdminProducts })));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories").then(m => ({ default: m.AdminCategories })));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders").then(m => ({ default: m.AdminOrders })));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers").then(m => ({ default: m.AdminCustomers })));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory").then(m => ({ default: m.AdminInventory })));
const Shop = lazy(() => import("./pages/Shop").then(m => ({ default: m.Shop })));
const ProductDetails = lazy(() => import("./pages/ProductDetails").then(m => ({ default: m.ProductDetails })));
const About = lazy(() => import("./pages/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("./pages/Contact").then(m => ({ default: m.Contact })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Register").then(m => ({ default: m.Register })));
const Profile = lazy(() => import("./pages/Profile").then(m => ({ default: m.Profile })));
const Orders = lazy(() => import("./pages/Orders").then(m => ({ default: m.Orders })));
const OrderDetails = lazy(() => import("./pages/OrderDetails").then(m => ({ default: m.OrderDetails })));
const Checkout = lazy(() => import("./pages/Checkout").then(m => ({ default: m.Checkout })));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess").then(m => ({ default: m.OrderSuccess })));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess").then(m => ({ default: m.PaymentSuccess })));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure").then(m => ({ default: m.PaymentFailure })));
const Wishlist = lazy(() => import("./pages/Wishlist").then(m => ({ default: m.Wishlist })));
const Cart = lazy(() => import("./pages/Cart").then(m => ({ default: m.Cart })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AddressProvider>
          <WishlistProvider>
            <CartProvider>
              <PaymentProvider>
                <BrowserRouter>
                <Suspense fallback={<FullPageSkeletonLoader />}>
                  <Routes>
                    {/* Protected Admin Console Routes */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminLayout />
                        </AdminRoute>
                      }
                    >
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="categories" element={<AdminCategories />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="inventory" element={<AdminInventory />} />
                    </Route>

                    {/* Customer-facing Storefront Layout */}
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="product/:id" element={<ProductDetails />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    
                    {/* Guest-only Auth Routes */}
                    <Route 
                      path="login" 
                      element={
                        <GuestRoute>
                          <Login />
                        </GuestRoute>
                      } 
                    />
                    <Route 
                      path="register" 
                      element={
                        <GuestRoute>
                          <Register />
                        </GuestRoute>
                      } 
                    />
                    
                    {/* Protected Account Routes */}
                    <Route 
                      path="profile" 
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="orders" 
                      element={
                        <ProtectedRoute>
                          <Orders />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="orders/:id" 
                      element={
                        <ProtectedRoute>
                          <OrderDetails />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="checkout" 
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="order-success/:orderId" 
                      element={
                        <ProtectedRoute>
                          <OrderSuccess />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="payment-success/:orderId" 
                      element={
                        <ProtectedRoute>
                          <PaymentSuccess />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="payment-failure/:orderId" 
                      element={
                        <ProtectedRoute>
                          <PaymentFailure />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="wishlist" 
                      element={
                        <ProtectedRoute>
                          <Wishlist />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="settings" 
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Shopping Cart Dedicated Route */}
                    <Route path="cart" element={<Cart />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </PaymentProvider>
        </CartProvider>
        </WishlistProvider>
      </AddressProvider>
    </AuthProvider>
  </ToastProvider>
  );
}
