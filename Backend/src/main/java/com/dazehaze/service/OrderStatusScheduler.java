package com.dazehaze.service;

import com.dazehaze.entity.Order;
import com.dazehaze.entity.OrderStatusHistory;
import com.dazehaze.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler responsable de transiciones automáticas de estado de pedidos.
 *
 * Flujo de estados:
 * PENDING → (Stripe webhook) → CONFIRMED
 * CONFIRMED → (5 horas después, este scheduler) → PROCESSING
 * PROCESSING → (Admin manual) → SHIPPED
 * SHIPPED → (Admin manual) → DELIVERED
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderStatusScheduler {

    private final OrderRepository orderRepository;
    private final OrderNotificationService orderNotificationService;

    private static final long HOURS_UNTIL_PROCESSING = 5;

    /**
     * Se ejecuta cada 30 minutos.
     * Busca pedidos en estado CONFIRMED con más de 5 horas desde el pago
     * y los mueve automáticamente a PROCESSING.
     *
     * Cron: segundos minutos horas día mes díaSemana
     * "0 *\/30 * * * *" = cada 30 minutos exactos
     */
    @Scheduled(cron = "0 */30 * * * *")
    @Transactional
    public void promoteConfirmedToProcessing() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(HOURS_UNTIL_PROCESSING);

        List<Order> ordersToProcess = orderRepository.findByStatusAndPaidAtBefore(
                Order.OrderStatus.CONFIRMED,
                threshold);

        if (ordersToProcess.isEmpty()) {
            log.debug("Scheduler: No hay pedidos CONFIRMED pendientes de pasar a PROCESSING.");
            return;
        }

        log.info("Scheduler: {} pedido(s) serán promovidos de CONFIRMED a PROCESSING.", ordersToProcess.size());

        for (Order order : ordersToProcess) {
            try {
                Order.OrderStatus previousStatus = order.getStatus();

                order.setStatus(Order.OrderStatus.PROCESSING);

                // Registrar en historial
                OrderStatusHistory history = OrderStatusHistory.builder()
                        .order(order)
                        .previousStatus(previousStatus)
                        .newStatus(Order.OrderStatus.PROCESSING)
                        .notes("Cambio automático a PROCESSING tras " + HOURS_UNTIL_PROCESSING
                                + " horas de confirmación de pago.")
                        .changedBy("SYSTEM")
                        .build();
                order.getStatusHistory().add(history);

                orderRepository.save(order);

                // Notificar al cliente
                orderNotificationService.notifyStatusChanged(
                        order,
                        previousStatus,
                        Order.OrderStatus.PROCESSING);

                log.info("Scheduler: Pedido {} → PROCESSING (paidAt: {})",
                        order.getOrderNumber(), order.getPaidAt());

            } catch (Exception e) {
                log.error("Scheduler: Error al promover pedido {} a PROCESSING: {}",
                        order.getOrderNumber(), e.getMessage(), e);
            }
        }
    }
}
