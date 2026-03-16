import {
  Bell,
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  RefreshCcw,
  AlertTriangle,
  ShoppingBag,
  Clock,
  Sparkles,
  RotateCcw,
  XCircle,
} from "lucide-react";

export const getNotificationStyle = (type, isRead) => {
  const baseConfig = {
    ORDER_CREATED: { icon: Package, color: "blue" },
    PAYMENT_CONFIRMED: { icon: CreditCard, color: "emerald" },
    ORDER_CONFIRMED: { icon: CheckCircle, color: "emerald" },
    ORDER_PROCESSING: { icon: Clock, color: "amber" },
    ORDER_SHIPPED: { icon: Truck, color: "indigo" },
    ORDER_DELIVERED: { icon: CheckCircle, color: "emerald" },
    ORDER_CANCELLED: { icon: XCircle, color: "rose" },
    ORDER_REFUNDED: { icon: RefreshCcw, color: "orange" },
    NEW_ORDER: { icon: ShoppingBag, color: "fuchsia" },
    PAYMENT_RECEIVED: { icon: CreditCard, color: "emerald" },
    LOW_STOCK: { icon: AlertTriangle, color: "amber" },
    OUT_OF_STOCK: { icon: XCircle, color: "rose" },
    ORDER_CANCELLED_BY_USER: { icon: XCircle, color: "rose" },
    NEW_PRODUCT: { icon: Sparkles, color: "primary" },
    PRODUCT_RESTOCKED: { icon: RotateCcw, color: "emerald" },
  };

  const config = baseConfig[type] || { icon: Bell, color: "zinc" };
  const { icon, color } = config;

  // Si está leído, reducimos el impacto visual drásticamente.
  // Si no está leído, aplicamos gradients sutiles y glows.
  const styleClasses = isRead
    ? {
        bg: `bg-white/5 border border-white/5 text-${color}-500/50`,
        iconColor: `text-${color}-500/50`,
        glow: "",
      }
    : {
        bg: `bg-${color}-500/10 border border-${color}-500/20 text-${color}-400 shadow-[inset_0_0_12px_rgba(0,0,0,0.2)]`,
        iconColor: `text-${color}-400`,
        glow: `shadow-[0_0_12px_var(--tw-shadow-color)] shadow-${color}-500/30`,
      };

  return {
    icon,
    classes: styleClasses,
  };
};
