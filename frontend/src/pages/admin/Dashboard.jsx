import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Package as PackageIcon, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';
import { Badge, Skeleton } from '../../components/ui';
import api from '../../api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatusConfig = (status) => {
    const config = {
      PENDING: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pendiente', icon: Clock },
      CONFIRMED: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Confirmado', icon: CheckCircle },
      PROCESSING: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Procesando', icon: PackageIcon },
      SHIPPED: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Enviado', icon: Package },
      DELIVERED: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Entregado', icon: CheckCircle },
      CANCELLED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelado', icon: XCircle },
    };
    return config[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: status, icon: PackageIcon };
  };

  const statCards = stats ? [
    {
      title: 'Ingresos Totales',
      value: stats.totalRevenue ? `$${stats.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '$0.00',
      subtitle: 'Total histórico',
      icon: DollarSign,
      gradient: 'from-green-400 to-emerald-600',
      bgGradient: 'from-green-500/10 to-emerald-500/5',
    },
    {
      title: 'Ingresos de Hoy',
      value: stats.todayRevenue ? `$${stats.todayRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '$0.00',
      subtitle: new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }),
      icon: TrendingUp,
      gradient: 'from-amber-400 to-orange-600',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
    },
    {
      title: 'Pedidos Totales',
      value: stats.totalOrders || 0,
      subtitle: `${stats.pendingOrders || 0} pendientes`,
      icon: ShoppingCart,
      gradient: 'from-purple-400 to-pink-600',
      bgGradient: 'from-purple-500/10 to-pink-500/5',
    },
    {
      title: 'Productos',
      value: stats.totalProducts || 0,
      subtitle: `${stats.activeProducts || 0} activos`,
      icon: Package,
      gradient: 'from-cyan-400 to-blue-600',
      bgGradient: 'from-cyan-500/10 to-blue-500/5',
    },
    {
      title: 'Clientes',
      value: stats.totalUsers || 0,
      subtitle: 'Registrados',
      icon: Users,
      gradient: 'from-rose-400 to-red-600',
      bgGradient: 'from-rose-500/10 to-red-500/5',
    },
    {
      title: 'Stock Bajo',
      value: stats.lowStockProducts || 0,
      subtitle: ' productos',
      icon: Package,
      gradient: 'from-red-400 to-rose-600',
      bgGradient: 'from-red-500/10 to-rose-500/5',
      alert: (stats.lowStockProducts || 0) > 0,
    },
  ] : [];

  if (loading) {
    return (
      <div className="p-4 lg:p-8 bg-background-dark min-h-screen">
        <h1 className="text-2xl font-bold mb-8 text-white">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-surface rounded-2xl p-6 border border-border">
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-8 w-3/4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface rounded-2xl p-6 border border-border h-80">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="bg-surface rounded-2xl p-6 border border-border h-80">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-background-dark min-h-screen">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display tracking-wide text-white">DASHBOARD</h1>
            <p className="text-text-secondary text-sm mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-surface to-surface-elevated rounded-2xl border border-border shadow-lg">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Resumen General</p>
              <p className="text-sm font-semibold text-white">
                {stats?.deliveredOrders || 0} pedidos entregados
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid - Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div 
            key={i}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border p-6",
              "bg-gradient-to-br transition-colors duration-300",
              stat.bgGradient,
              stat.alert ? "ring-2 ring-red-500/50" : "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
            )}
          >
            {/* Background Icon */}
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <stat.icon className="w-32 h-32" />
            </div>
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-secondary text-sm font-medium">{stat.title}</span>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br", stat.gradient,
                  "shadow-lg"
                )}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold font-mono tracking-tight text-white mb-1">{stat.value}</p>
              <p className="text-xs text-text-secondary">{stat.subtitle}</p>
              
              {stat.alert && (
                <div className="mt-3 flex items-center gap-1 text-red-400 text-xs">
                  <ArrowDownRight className="w-3 h-3" />
                  <span>Requiere atención</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {[
          { status: 'PENDING', count: stats?.pendingOrders || 0, label: 'Pendientes' },
          { status: 'PROCESSING', count: (stats?.totalOrders || 0) - (stats?.pendingOrders || 0) - (stats?.shippedOrders || 0) - (stats?.deliveredOrders || 0), label: 'Procesando' },
          { status: 'SHIPPED', count: stats?.shippedOrders || 0, label: 'Enviados' },
          { status: 'DELIVERED', count: stats?.deliveredOrders || 0, label: 'Entregados' },
        ].map((item, i) => {
          const config = getStatusConfig(item.status);
          return (
            <div
              key={item.status}
              className={cn(
                "relative overflow-hidden rounded-xl p-4 border",
                config.color,
                "hover:scale-[1.02] transition-transform cursor-default"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs opacity-80">{item.label}</p>
                </div>
                <config.icon className="w-6 h-6 opacity-50" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sales Chart */}
      {stats?.dailySales && stats.dailySales.length > 0 && (
        <div 
          className="bg-surface rounded-2xl border border-border p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-white">Ventas de los últimos 7 días</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-text-secondary">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-text-secondary">Pedidos</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fa1c75" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fa1c75" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#432841" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8a7f89" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#8a7f89" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#8a7f89" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#301c2f', 
                    border: '1px solid #432841',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  labelStyle={{ color: '#c398bf', marginBottom: '4px' }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${Number(value).toLocaleString('es-MX')}` : value,
                    name === 'revenue' ? 'Ingresos' : 'Pedidos'
                  ]}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#fa1c75" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorOrders)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div 
          className="bg-surface rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-white">Pedidos Recientes</h2>
            </div>
            <span className="text-xs text-text-secondary bg-surface-elevated px-3 py-1 rounded-full">
              {stats?.recentOrders?.length || 0} pedidos
            </span>
          </div>
          <div className="divide-y divide-border">
            {stats?.recentOrders?.length > 0 ? (
              stats.recentOrders.slice(0, 5).map((order, i) => {
                const config = getStatusConfig(order.status);
                return (
                  <div 
                    key={i}
                    className="p-4 hover:bg-surface-elevated/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-medium text-white text-sm tracking-wider">{order.orderNumber}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium border",
                        config.color
                      )}>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-secondary truncate max-w-[150px]">{order.customerName}</p>
                      <p className="font-semibold text-white font-mono">${order.total?.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-text-muted" />
                </div>
                <p className="text-text-secondary">No hay pedidos recientes</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Top Products */}
        <div 
          className="bg-surface rounded-2xl border border-border overflow-hidden"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-white">Productos Más Vendidos</h2>
            </div>
            <span className="text-xs text-text-secondary bg-surface-elevated px-3 py-1 rounded-full">
              Top 5
            </span>
          </div>
          <div className="divide-y divide-border">
            {stats?.topProducts?.length > 0 ? (
              stats.topProducts.slice(0, 5).map((product, i) => (
                <div 
                  key={i}
                  className="p-4 hover:bg-surface-elevated/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30' :
                      i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                      i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                      'bg-surface-elevated text-text-secondary border border-border'
                    )}>
                      {i + 1}
                    </span>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center border border-border">
                        <Package className="w-6 h-6 text-text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{product.name}</p>
                      <p className="text-sm text-text-secondary">{product.totalSold} vendidos</p>
                    </div>
                    <span className="font-semibold text-primary font-mono text-sm">
                      ${product.revenue?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-text-muted" />
                </div>
                <p className="text-text-secondary">No hay datos de ventas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
