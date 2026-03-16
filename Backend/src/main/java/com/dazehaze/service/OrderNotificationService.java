package com.dazehaze.service;

import com.dazehaze.entity.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationService {

    private final NotificationService notificationService;
    private EmailService emailService;

    @Autowired(required = false)
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    @Transactional
    public void notifyOrderCreated(Order order) {
        try {
            String customerName = getCustomerName(order);
            String orderNumber = order.getOrderNumber();

            // Notificación al cliente (with dedup)
            notificationService.createForUserOrder(
                    order.getUser().getId(),
                    NotificationType.ORDER_CREATED,
                    "Pedido recibido",
                    "Tu pedido #" + orderNumber + " ha sido recibido. Total: $" + order.getTotal().setScale(2),
                    "/pedido/" + orderNumber,
                    orderNumber);

            // Notificación al admin (with dedup)
            notificationService.createForAdminOrder(
                    NotificationType.NEW_ORDER,
                    "Nuevo pedido",
                    "Nuevo pedido #" + orderNumber + " de " + customerName + " - $" + order.getTotal().setScale(2),
                    "/admin/pedidos",
                    orderNumber);

            // Send order confirmation email
            sendOrderConfirmationEmail(order);

            log.info("Notifications sent for new order: {}", orderNumber);
        } catch (Exception e) {
            log.error("Failed to send order created notifications: {}", e.getMessage());
        }
    }

    @Transactional
    public void notifyPaymentConfirmed(Order order) {
        try {
            String customerName = getCustomerName(order);
            String orderNumber = order.getOrderNumber();

            // Notificación al cliente (with dedup)
            notificationService.createForUserOrder(
                    order.getUser().getId(),
                    NotificationType.PAYMENT_CONFIRMED,
                    "Pago confirmado",
                    "Tu pago de $" + order.getTotal().setScale(2) + " ha sido confirmado. Tu pedido #" + orderNumber
                            + " está siendo preparado.",
                    "/pedido/" + orderNumber,
                    orderNumber);

            // Notificación al admin (with dedup)
            notificationService.createForAdminOrder(
                    NotificationType.PAYMENT_RECEIVED,
                    "Pago recibido",
                    "Pago de $" + order.getTotal().setScale(2) + " recibido de " + customerName + " (Pedido #"
                            + orderNumber
                            + ")",
                    "/admin/pedidos",
                    orderNumber);

            log.info("Payment confirmed notifications sent for order: {}", orderNumber);
        } catch (Exception e) {
            log.error("Failed to send payment confirmed notifications: {}", e.getMessage());
        }
    }

    @Transactional
    public void notifyStatusChanged(Order order, Order.OrderStatus oldStatus, Order.OrderStatus newStatus) {
        try {
            Long userId = order.getUser() != null ? order.getUser().getId() : null;
            if (userId == null) {
                log.warn("Cannot send status notification - order {} has no user", order.getOrderNumber());
                return;
            }

            String orderNumber = order.getOrderNumber();

            // Skip CONFIRMED notification if it was just paid (notifyPaymentConfirmed
            // already handles this)
            if (newStatus == Order.OrderStatus.CONFIRMED && oldStatus == Order.OrderStatus.PENDING) {
                log.info("Skipping CONFIRMED notification - payment notification already sent for order: {}",
                        orderNumber);
                return;
            }

            switch (newStatus) {
                case CONFIRMED:
                    notificationService.createForUserOrder(
                            userId,
                            NotificationType.ORDER_CONFIRMED,
                            "Pedido confirmado",
                            "Tu pedido #" + orderNumber + " ha sido confirmado y será preparado pronto.",
                            "/pedido/" + orderNumber,
                            orderNumber);
                    break;

                case PROCESSING:
                    notificationService.createForUserOrder(
                            userId,
                            NotificationType.ORDER_PROCESSING,
                            "Pedido en preparación",
                            "Tu pedido #" + orderNumber + " está siendo preparado con cariño ✨",
                            "/pedido/" + orderNumber,
                            orderNumber);
                    break;

                case SHIPPED:
                    String trackingInfo = "";
                    if (order.getTrackingNumber() != null && order.getCarrier() != null) {
                        trackingInfo = " - " + order.getCarrier() + ": " + order.getTrackingNumber();
                    }
                    notificationService.createForUserOrder(
                            userId,
                            NotificationType.ORDER_SHIPPED,
                            "Pedido enviado 🚀",
                            "Tu pedido #" + orderNumber + " ha sido enviado" + trackingInfo
                                    + ". ¡Muy pronto estará en tus manos!",
                            "/pedido/" + orderNumber,
                            orderNumber);
                    sendShippingNotificationEmail(order, "SHIPPED");
                    break;

                case IN_TRANSIT:
                    notificationService.createForUserOrder(
                            userId,
                            NotificationType.ORDER_IN_TRANSIT,
                            "Pedido en tránsito 📦",
                            "Tu pedido #" + orderNumber + " está en camino a tu dirección.",
                            "/pedido/" + orderNumber,
                            orderNumber);
                    sendShippingNotificationEmail(order, "IN_TRANSIT");
                    break;

                case DELIVERED:
                    notificationService.createForUserOrder(
                            userId,
                            NotificationType.ORDER_DELIVERED,
                            "Pedido entregado ✓",
                            "Tu pedido #" + orderNumber + " ha sido entregado. ¡Gracias por tu compra!",
                            "/pedido/" + orderNumber,
                            orderNumber);
                    sendShippingNotificationEmail(order, "DELIVERED");
                    break;

                case CANCELLED:
                    notificationService.createForUserOrder(
                            userId,
                            NotificationType.ORDER_CANCELLED,
                            "Pedido cancelado",
                            "Tu pedido #" + orderNumber + " ha sido cancelado. Si tienes dudas, contáctanos.",
                            "/pedido/" + orderNumber,
                            orderNumber);

                    // Notificación al admin (with dedup)
                    notificationService.createForAdminOrder(
                            NotificationType.ORDER_CANCELLED_BY_USER,
                            "Pedido cancelado",
                            "Pedido #" + orderNumber + " cancelado por " + getCustomerName(order),
                            "/admin/pedidos",
                            orderNumber);
                    break;

                default:
                    log.debug("No notification configured for status: {}", newStatus);
                    break;
            }

            log.info("Status change notification sent for order {}: {} -> {}", orderNumber, oldStatus, newStatus);
        } catch (Exception e) {
            log.error("Failed to send status change notifications: {}", e.getMessage());
        }
    }

    @Transactional
    public void notifyOrderRefunded(Order order) {
        try {
            Long userId = order.getUser() != null ? order.getUser().getId() : null;
            if (userId == null)
                return;

            String orderNumber = order.getOrderNumber();

            notificationService.createForUserOrder(
                    userId,
                    NotificationType.ORDER_REFUNDED,
                    "Reembolso procesado",
                    "El reembolso de $" + order.getTotal().setScale(2) + " para tu pedido #" + orderNumber
                            + " ha sido procesado.",
                    "/pedido/" + orderNumber,
                    orderNumber);

            log.info("Refund notification sent for order: {}", orderNumber);
        } catch (Exception e) {
            log.error("Failed to send refund notification: {}", e.getMessage());
        }
    }

    @Transactional
    public void notifyOrderCancelled(Order order) {
        try {
            Long userId = order.getUser() != null ? order.getUser().getId() : null;
            String orderNumber = order.getOrderNumber();
            boolean wasRefunded = order.getPaymentStatus() == Order.PaymentStatus.REFUNDED;

            // In-app notification for customer
            if (userId != null) {
                String message = "Tu pedido #" + orderNumber + " ha sido cancelado.";
                if (wasRefunded) {
                    message += " El reembolso de $" + order.getTotal().setScale(2)
                            + " será procesado en 3-5 días hábiles.";
                }
                notificationService.createForUserOrder(
                        userId,
                        NotificationType.ORDER_CANCELLED,
                        "Pedido cancelado",
                        message,
                        "/pedido/" + orderNumber,
                        orderNumber);
            }

            // Admin notification
            notificationService.createForAdminOrder(
                    NotificationType.ORDER_CANCELLED_BY_USER,
                    "Pedido cancelado por cliente",
                    "El cliente canceló el pedido #" + orderNumber
                            + (wasRefunded ? " — reembolso emitido automáticamente" : ""),
                    "/admin/pedidos",
                    orderNumber);

            // Send cancellation email
            sendCancellationEmail(order, wasRefunded);

            log.info("Cancellation notifications sent for order: {}", orderNumber);
        } catch (Exception e) {
            log.error("Failed to send cancellation notification: {}", e.getMessage());
        }
    }

    private void sendCancellationEmail(Order order, boolean wasRefunded) {
        if (emailService == null) {
            log.warn("EmailService not available for cancellation notification");
            return;
        }
        try {
            String email = getCustomerEmail(order);
            if (email == null)
                return;

            String customerName = getCustomerName(order);
            String subject = "Pedido #" + order.getOrderNumber() + " cancelado";
            String refundNote = wasRefunded
                    ? "<p>El reembolso de <strong>" + formatPrice(order.getTotal())
                            + "</strong> ha sido procesado y aparecerá en tu estado de cuenta en 3-5 días hábiles.</p>"
                    : "";
            String body = "<p>Hola " + customerName + ",</p>"
                    + "<p>Tu pedido <strong>#" + order.getOrderNumber()
                    + "</strong> ha sido cancelado correctamente.</p>"
                    + refundNote
                    + "<p>Si tienes alguna pregunta, no dudes en contactarnos.</p>"
                    + "<p>¡Gracias por tu preferencia!</p>";

            emailService.sendSimpleEmail(email, subject, body);
            log.info("Cancellation email sent for order: {}", order.getOrderNumber());
        } catch (Exception e) {
            log.error("Failed to send cancellation email: {}", e.getMessage());
        }
    }

    @Transactional
    public void notifyLowStock(ProductVariant variant) {
        try {
            Product product = variant.getProduct();
            int threshold = product.getLowStockThreshold() != null ? product.getLowStockThreshold() : 5;

            notificationService.createForAdmin(
                    NotificationType.LOW_STOCK,
                    "Stock bajo ⚠️",
                    "Stock bajo: " + product.getName() + " (" + variant.getSize() + ", " + variant.getColor()
                            + ") - Solo quedan " + variant.getStock() + " unidades",
                    "/admin/productos");

            log.info("Low stock notification sent for variant: {}/{} - {} units",
                    product.getName(), variant.getSize(), variant.getStock());
        } catch (Exception e) {
            log.error("Failed to send low stock notification: {}", e.getMessage());
        }
    }

    @Transactional
    public void notifyOutOfStock(ProductVariant variant) {
        try {
            Product product = variant.getProduct();

            notificationService.createForAdmin(
                    NotificationType.OUT_OF_STOCK,
                    "Producto agotado ❌",
                    "AGOTADO: " + product.getName() + " (" + variant.getSize() + ", " + variant.getColor() + ")",
                    "/admin/productos");

            log.info("Out of stock notification sent for variant: {}/{}",
                    product.getName(), variant.getSize());
        } catch (Exception e) {
            log.error("Failed to send out of stock notification: {}", e.getMessage());
        }
    }

    private String getCustomerName(Order order) {
        if (order.getUser() != null) {
            User user = order.getUser();
            if (user.getFirstName() != null && user.getLastName() != null) {
                return user.getFirstName() + " " + user.getLastName();
            }
            return user.getEmail();
        }
        return "Cliente";
    }

    private void sendOrderConfirmationEmail(Order order) {
        if (emailService == null) {
            log.warn("EmailService not available for order confirmation");
            return;
        }

        try {
            String email = getCustomerEmail(order);
            if (email == null) {
                log.warn("No email found for order: {}", order.getOrderNumber());
                return;
            }

            String firstName = getCustomerName(order);
            String total = formatPrice(order.getTotal());
            String shippingAddress = getShippingAddress(order);
            String carrier = order.getCarrier() != null ? order.getCarrier() : "Estándar";

            emailService.sendOrderConfirmationEmail(email, order.getOrderNumber(), firstName, total, shippingAddress,
                    carrier);
            log.info("Order confirmation email sent for order: {}", order.getOrderNumber());
        } catch (Exception e) {
            log.error("Failed to send order confirmation email: {}", e.getMessage());
        }
    }

    private void sendShippingNotificationEmail(Order order, String status) {
        if (emailService == null) {
            log.warn("EmailService not available for shipping notification");
            return;
        }

        try {
            String email = getCustomerEmail(order);
            if (email == null) {
                log.warn("No email found for order: {}", order.getOrderNumber());
                return;
            }

            String firstName = getCustomerName(order);
            String trackingNumber = order.getTrackingNumber();
            String carrier = order.getCarrier();

            emailService.sendShippingNotificationEmail(email, order.getOrderNumber(), status, trackingNumber, carrier,
                    firstName);
            log.info("Shipping notification email sent for order: {} status: {}", order.getOrderNumber(), status);
        } catch (Exception e) {
            log.error("Failed to send shipping notification email: {}", e.getMessage());
        }
    }

    private String getCustomerEmail(Order order) {
        if (order.getUser() != null && order.getUser().getEmail() != null) {
            return order.getUser().getEmail();
        }
        if (order.getGuestEmail() != null && !order.getGuestEmail().isEmpty()) {
            return order.getGuestEmail();
        }
        return null;
    }

    private String getShippingAddress(Order order) {
        if (order.getShippingAddress() != null) {
            Address addr = order.getShippingAddress();
            return addr.getStreet() + ", " + addr.getCity() + ", " + addr.getState() + " " + addr.getPostalCode();
        }
        return "No especificada";
    }

    private String formatPrice(BigDecimal price) {
        if (price == null)
            return "$0.00";
        NumberFormat formatter = NumberFormat.getCurrencyInstance(new Locale("es", "MX"));
        return formatter.format(price);
    }
}
