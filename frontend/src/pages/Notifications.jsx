import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, ArrowLeft, Filter } from 'lucide-react';
import { FadeInUp } from '../components/common/Animations';
import useNotifications from '../hooks/useNotifications';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui';
import { getNotificationStyle } from '../lib/notificationStyles';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [loading, setLoading] = useState(true);
  
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchNotifications(0, 50);
      setLoading(false);
    };
    loadData();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try { await markAsRead(notification.id); } 
      catch { /* ignore read errors */ }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try { await deleteNotification(notificationId); } 
    catch { /* ignore */ }
    await refreshNotifications();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const groupedNotifications = {
    recent: [],
    today: [],
    yesterday: [],
    older: []
  };

  filteredNotifications.forEach(n => {
    const timeAgo = n.timeAgo || '';
    if (timeAgo.includes('min') || timeAgo === 'Ahora' || timeAgo.includes('h')) {
      groupedNotifications.recent.push(n);
    } else if (timeAgo.includes('Ayer')) {
      groupedNotifications.yesterday.push(n);
    } else if (timeAgo.includes('/')) {
      groupedNotifications.older.push(n);
    } else {
      groupedNotifications.today.push(n);
    }
  });

  const renderNotificationGroup = (title, items) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 pl-2">
          {title}
        </h3>
        <div className="space-y-3">
          {items.map((notification, index) => {
            const { icon: Icon, classes } = getNotificationStyle(notification.type, notification.isRead);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "relative p-4 rounded-2xl flex items-start gap-4 cursor-pointer transition-all duration-300 group overflow-hidden border",
                  notification.isRead 
                    ? "bg-white/5 border-white/5 hover:bg-white/[0.08]" 
                    : "bg-white/[0.04] border-white/10 hover:border-white/20 hover:bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                )}
              >
                {/* Unread Glow Indicator */}
                {!notification.isRead && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-12 bg-primary-500 rounded-r-full shadow-[0_0_12px_rgba(198,42,185,0.8)]" />
                )}

                {/* Left Icon/Image */}
                {notification.imageUrl ? (
                  <div className={cn("relative rounded-xl overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-105", !notification.isRead && "ring-2 ring-primary-500/30")}>
                    <img 
                      src={notification.imageUrl} 
                      alt={notification.productName || 'Producto'}
                      className="w-14 h-14 object-cover"
                    />
                    {!notification.isRead && <div className="absolute inset-0 bg-primary-500/10" />}
                  </div>
                ) : (
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    classes.bg, classes.glow,
                    !notification.isRead && "group-hover:scale-110"
                  )}>
                    <Icon className={cn("w-6 h-6", classes.iconColor)} strokeWidth={1.5} />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className={cn(
                      "font-medium text-base truncate transition-colors duration-300",
                      notification.isRead ? "text-gray-400" : "text-white"
                    )}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500 font-mono tracking-tight shrink-0 mt-0.5">
                      {notification.timeAgo}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm mt-1 transition-colors duration-300",
                    notification.isRead ? "text-gray-500" : "text-gray-300"
                  )}>
                    {notification.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                      className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors shrink-0"
                      title="Marcar leído"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, notification.id)}
                    className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                    title="Eliminar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background-dark pt-24 pb-20 selection:bg-primary-500/30">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-primary-600/10 blur-[120px] pointer-events-none rounded-full" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header Section */}
        <FadeInUp>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h1 className="text-3xl font-display font-bold tracking-wide text-white">Notificaciones</h1>
                <p className="text-gray-400 text-sm mt-1">
                  {unreadCount > 0 
                    ? <span className="text-primary-400 font-medium">{unreadCount} nuevas</span>
                    : 'Todo está al día'}
                </p>
              </div>
            </div>

            {/* Actions & Filters */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              {/* Pills toggles */}
              <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 relative">
                {['all', 'unread'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors z-10",
                      filter === f ? "text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {f === 'all' ? 'Todas' : 'No leídas'}
                    {filter === f && (
                      <motion.div
                        layoutId="active-filter"
                        className="absolute inset-0 bg-white/10 rounded-lg -z-10 shadow-[inset_0_1px_rgba(255,255,255,0.1)]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 text-sm font-medium rounded-xl border border-primary-500/20 hover:border-primary-500/30 transition-all hover:shadow-[0_0_15px_rgba(198,42,185,0.3)] shrink-0"
                >
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Marcar leído</span>
                </button>
              )}
            </div>
          </div>
        </FadeInUp>

        {/* Notifications List */}
        <div className="relative">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 animate-pulse">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl shrink-0" />
                  <div className="space-y-3 flex-1 py-1">
                    <div className="h-4 bg-white/10 rounded-md w-1/3" />
                    <div className="h-3 bg-white/10 rounded-md w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <FadeInUp delay={0.1}>
              <div className="text-center py-24 px-4 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative bg-surface border border-white/10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl">
                    <Bell className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-xl font-display tracking-wide text-white mb-2">
                  {filter === 'unread' ? 'Cero notificaciones nuevas' : 'Bandeja vacía'}
                </h3>
                <p className="text-gray-500 text-sm max-w-[250px] mx-auto leading-relaxed">
                  {filter === 'unread' 
                    ? 'Has leído todas tus notificaciones. ¡Buen trabajo!' 
                    : 'Las novedades sobre tus pedidos y cuenta aparecerán aquí.'}
                </p>
              </div>
            </FadeInUp>
          ) : (
            <AnimatePresence mode="popLayout">
              {renderNotificationGroup('Recientes', groupedNotifications.recent)}
              {renderNotificationGroup('Ayer', groupedNotifications.yesterday)}
              {renderNotificationGroup('Anteriores', groupedNotifications.older)}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
