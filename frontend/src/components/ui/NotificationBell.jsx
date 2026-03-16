import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, X } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';
import { getNotificationStyle } from '../../lib/notificationStyles';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const {
    notifications,
    unreadCount,
    recentNotifications,
    todayNotifications,
    historyNotifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try { await markAsRead(notification.id); } 
      catch (err) { console.warn('[Notification] Could not mark as read:', err.message); }
    }
    if (notification.link) navigate(notification.link);
    setIsOpen(false);
  };

  const handleMarkAsRead = async (e, notificationId) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const formatTime = (timeAgo) => timeAgo || '';

  // Segregate notifications
  const recentNotifs = notifications.filter(n => n.timeAgo?.includes('min') || n.timeAgo === 'Ahora' || n.timeAgo?.includes('h'));
  const todayNotifs = notifications.filter(n => n.timeAgo?.includes('Ayer'));
  const otherNotifs = notifications.filter(n => !recentNotifs.includes(n) && !todayNotifs.includes(n));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-colors duration-200",
          isOpen ? "text-primary-400 bg-primary-500/10" : "text-gray-400 hover:text-white hover:bg-white/[0.08]"
        )}
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(198,42,185,0.5)] animate-in zoom-in duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <>
        {isOpen && (
          <div
            className="absolute right-0 top-[calc(100%+0.5rem)] w-[400px] max-h-[85vh] flex flex-col bg-background-dark/95 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_25px_80px_-12px_rgba(0,0,0,0.8)] z-50"
          >
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4 flex items-center justify-between">
              <h3 className="text-white font-medium text-xl tracking-wide">NOTIFICACIONES</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[13px] font-medium text-primary hover:text-white transition-colors"
                >
                  Marcar todo leído
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 custom-scrollbar px-6 pb-2">
              {loading ? (
                <div className="py-10 flex justify-center">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-medium">Estás al día</p>
                  <p className="text-sm text-gray-500 mt-1">No tienes nuevas notificaciones.</p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {/* Group Render Helper ommitted for brevity in replace call if needed, but I should keep structure */}
                  {[
                    { title: "Recientes", data: recentNotifs },
                    { title: "Hoy", data: todayNotifs },
                    { title: "Anteriores", data: otherNotifs }
                  ].map(group => group.data.length > 0 && (
                    <div key={group.title} className="space-y-1">
                      {group.title !== "Recientes" && (
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 pt-2 pb-1">
                          {group.title}
                        </p>
                      )}
                      {group.data.map(notification => {
                        const { icon: Icon } = getNotificationStyle(notification.type, notification.isRead);
                        return (
                          <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                              "relative p-4 rounded-2xl cursor-pointer transition-all duration-300 group border overflow-hidden",
                              notification.isRead 
                                ? "bg-surface/40 border-white/5 hover:bg-white/10 opacity-80" 
                                : "bg-surface-elevated/20 border-white/10 hover:bg-white/[0.15]"
                            )}
                          >
                            {!notification.isRead && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded-r-md shadow-glow-subtle" />
                            )}
                            <div className="flex gap-4 items-center">
                              {/* Icon / Image */}
                              {notification.imageUrl ? (
                                <img 
                                  src={notification.imageUrl} 
                                  alt={notification.productName || 'Producto'}
                                  className={cn("w-12 h-12 rounded-full object-cover flex-shrink-0 border-2", !notification.isRead ? "border-primary shadow-glow-subtle" : "border-border")}
                                />
                              ) : (
                                <div className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-[1.5px]",
                                  !notification.isRead 
                                    ? "border-primary shadow-glow-subtle bg-primary/5" 
                                    : "border-border bg-surface/30"
                                )}>
                                  <Icon 
                                    className={cn("w-5 h-5", !notification.isRead ? "text-primary" : "text-text-muted")} 
                                    strokeWidth={notification.isRead ? 1.5 : 2} 
                                  />
                                </div>
                              )}
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-[15px] transition-colors leading-tight", 
                                  !notification.isRead ? "text-white font-medium" : "text-gray-200 font-normal"
                                )}>
                                  {notification.title}
                                </p>
                                <p className="text-sm line-clamp-1 mt-1 text-gray-300">
                                  {notification.message}
                                </p>
                                <p className="text-[13px] text-gray-500 mt-1.5">
                                  {formatTime(notification.timeAgo)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                                {!notification.isRead && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(e, notification.id)}
                                    className="p-1.5 hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-400 rounded-lg transition-colors"
                                    title="Marcar leído"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDelete(e, notification.id)}
                                  className="p-1.5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 pb-6 pt-2">
              <Link
                to="/notificaciones"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full py-4 text-[15px] font-medium text-text-secondary bg-surface border border-white/5 rounded-[14px] hover:bg-surface-elevated transition-colors"
              >
                Ver todas las notificaciones
              </Link>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default NotificationBell;
