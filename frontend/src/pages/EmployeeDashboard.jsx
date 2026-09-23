import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatCurrency, formatId } from '../utils/formatters';

function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only owner or employee
    if (!user || (user.role !== 'owner' && user.role !== 'employee')) {
      navigate('/dashboard');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/read.php');
        if (res.data && res.data.data) {
          setOrders(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load total orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, navigate]);

  const updateStatus = async (id, newStatus) => {
    try {
      await api.put('/orders/update_status.php', { id, status: newStatus });
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Failed to update status");
    }
  };

  if (!user || (user.role !== 'owner' && user.role !== 'employee')) return null;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-12 min-h-[60vh]">
      <div className="flex justify-between items-end mb-12 border-b border-[#E8DCC4] pb-6">
        <div>
          <h1 className="text-4xl font-serif text-dark mb-2">Employee Portal</h1>
          <p className="text-gray-500 font-light tracking-wide">Manage store operations</p>
        </div>
        <button onClick={() => navigate('/products')} className="text-sm uppercase tracking-widest text-primary hover:text-dark transition">
          View Storefront
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar */}
        <div className="font-serif">
          <ul className="space-y-4 text-lg">
             <li><button onClick={() => navigate('/employee-dashboard')} className="text-dark border-b border-dark pb-1 text-left w-full font-medium">Manage Orders</button></li>
             <li><button onClick={() => navigate('/admin/products')} className="text-gray-400 hover:text-dark transition text-left w-full">Manage Products</button></li>
             <li><a href="#" className="text-gray-400 hover:text-dark transition">Customer Details</a></li>
          </ul>
        </div>
        
        {/* Main Content Area */}
        <div className="col-span-1 lg:col-span-3">
          <h2 className="text-xl font-serif mb-6 text-dark uppercase tracking-widest flex justify-between items-center">
            <span>All Orders</span>
          </h2>

          {loading ? (
             <p className="text-gray-500">Loading orders...</p>
          ) : (
            <div className="overflow-x-auto border border-[#E8DCC4] bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FDFBF7] text-xs uppercase tracking-widest text-gray-500 border-b border-[#E8DCC4]">
                    <th className="p-4 font-normal">Order #</th>
                    <th className="p-4 font-normal">Customer</th>
                    <th className="p-4 font-normal">Date</th>
                    <th className="p-4 font-normal">Total</th>
                    <th className="p-4 font-normal">Status</th>
                    <th className="p-4 font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DCC4] text-sm text-dark">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium">
                        <Link to={`/order/${order.id}`} className="hover:underline text-[#8A9A5B] font-semibold">{formatId('ORD', order.id)}</Link>
                        {order.payment_screenshot && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100" title="Slip uploaded">
                             Slip
                          </span>
                        )}
                      </td>
                      <td className="p-4">{order.customer_name} <br/><span className="text-xs text-gray-400">{order.customer_email}</span></td>
                      <td className="p-4">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="p-4">{formatCurrency(order.total_price)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs uppercase tracking-widest ${
                          order.status === 'received' ? 'bg-green-50 text-green-700 border border-green-100' :
                          order.status === 'sending' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          order.status === 'prepare' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="bg-[#FDFBF7] border border-[#E8DCC4] text-xs p-2 uppercase tracking-widest focus:outline-none focus:border-primary"
                        >
                          <option value="pending_payment">Pending Payment</option>
                          <option value="prepare">Prepare</option>
                          <option value="sending">Sending</option>
                          <option value="received">Received</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && <div className="p-8 text-center text-gray-500">No orders found.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
