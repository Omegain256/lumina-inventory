import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import Transfers from './pages/Transfers';
import Categories from './pages/Products/Categories';
import Brands from './pages/Products/Brands';
import Units from './pages/Products/Units';
import AddProduct from './pages/Products/AddProduct';
import ProductList from './pages/Products/ProductList';
import PurchasesReturns from './pages/Inventory/PurchasesReturns';
import Customers from './pages/Stakeholders/Customers';
import Suppliers from './pages/Stakeholders/Suppliers';
import NewSale from './pages/POS/NewSale';
import Repairs from './pages/Services/Repairs';
import ReportsDashboard from './pages/Reports/ReportsDashboard';
import CommissionReport from './pages/Reports/CommissionReport';
import Workshift from './pages/Reports/Workshift';
import Shops from './pages/Inventory/Shops';
import Warehouses from './pages/Inventory/Warehouses';
import Settings from './pages/Settings/Settings';
import StockMovementSummary from './pages/Reports/StockMovementSummary';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

const RoleRoute = ({ children, requiredRole }) => {
  const { isAdmin, isManager, loading } = useAuth();
  if (loading) return null;

  if (requiredRole === 'admin' && !isAdmin) return <Navigate to="/" />;
  if (requiredRole === 'manager' && !isManager) return <Navigate to="/" />;

  return children;
};

// Temp placeholder component
const Placeholder = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <div className="glass-panel p-12 text-center max-w-md w-full animate-in fade-in zoom-in duration-500">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 mb-4">{title}</h1>
      <p className="text-white/50">Module coming soon.</p>
    </div>
  </div>
);

const IndexRoute = () => {
  const { isAdmin, isManager, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin && !isManager) return <Navigate to="/pos" />;
  return <Dashboard />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<IndexRoute />} />

        {/* Products & POS */}
        <Route path="pos" element={<NewSale />} />
        <Route path="products/add" element={<RoleRoute requiredRole="manager"><AddProduct /></RoleRoute>} />
        <Route path="products/categories" element={<RoleRoute requiredRole="manager"><Categories /></RoleRoute>} />
        <Route path="products/units" element={<RoleRoute requiredRole="manager"><Units /></RoleRoute>} />
        <Route path="products/brands" element={<RoleRoute requiredRole="manager"><Brands /></RoleRoute>} />

        {/* Inventory */}
        <Route path="products" element={<ProductList />} />
        <Route path="shops" element={<RoleRoute requiredRole="manager"><Shops /></RoleRoute>} />
        <Route path="warehouses" element={<RoleRoute requiredRole="manager"><Warehouses /></RoleRoute>} />
        <Route path="purchases" element={<RoleRoute requiredRole="manager"><PurchasesReturns /></RoleRoute>} />
        <Route path="transfers" element={<RoleRoute requiredRole="manager"><Transfers /></RoleRoute>} />

        {/* Reports unified dashboard */}
        <Route path="reports/pnl" element={<RoleRoute requiredRole="manager"><ReportsDashboard /></RoleRoute>} />
        <Route path="reports/sales" element={<RoleRoute requiredRole="manager"><ReportsDashboard /></RoleRoute>} />
        <Route path="reports/cashflow" element={<RoleRoute requiredRole="manager"><ReportsDashboard /></RoleRoute>} />
        <Route path="reports/workshift" element={<Workshift />} />
        <Route path="reports/expenses" element={<RoleRoute requiredRole="manager"><ReportsDashboard /></RoleRoute>} />
        <Route path="reports/employees" element={<RoleRoute requiredRole="manager"><ReportsDashboard /></RoleRoute>} />
        <Route path="reports/commission" element={<CommissionReport />} />
        <Route path="reports/stock-movement" element={<RoleRoute requiredRole="manager"><StockMovementSummary /></RoleRoute>} />

        {/* Stakeholders */}
        <Route path="stakeholders/customers" element={<Customers />} />
        <Route path="stakeholders/suppliers" element={<RoleRoute requiredRole="admin"><Suppliers /></RoleRoute>} />

        {/* Services */}
        <Route path="repairs" element={<Repairs />} />

        {/* Settings (Unified) */}
        <Route path="settings/*" element={<RoleRoute requiredRole="manager"><Settings /></RoleRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
