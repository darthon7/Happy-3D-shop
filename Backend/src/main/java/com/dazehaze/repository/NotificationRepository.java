package com.dazehaze.repository;

import com.dazehaze.entity.Notification;
import com.dazehaze.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

        // Notificaciones no leídas de un usuario (incluye broadcasts con userId = 0)
        @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) AND n.isRead = false ORDER BY n.createdAt DESC")
        List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(@Param("userId") Long userId);

        // Conteo no leídas (incluye broadcasts)
        @Query("SELECT COUNT(n) FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) AND n.isRead = false")
        long countByUserIdAndIsReadFalse(@Param("userId") Long userId);

        // Notificaciones admin no leídas (userId = null)
        long countByUserIdIsNullAndIsReadFalse();

        // Notificaciones por tipo
        @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) AND n.type = :type ORDER BY n.createdAt DESC")
        List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(@Param("userId") Long userId,
                        @Param("type") NotificationType type);

        // Notificaciones últimas 30 minutos
        @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) AND n.createdAt > :since ORDER BY n.createdAt DESC")
        List<Notification> findRecentNotifications(@Param("userId") Long userId, @Param("since") LocalDateTime since);

        // Notificaciones de hoy
        @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) AND n.createdAt > :startOfDay ORDER BY n.createdAt DESC")
        List<Notification> findTodayNotifications(@Param("userId") Long userId,
                        @Param("startOfDay") LocalDateTime startOfDay);

        // Notificaciones anteriores (más de 24 horas)
        @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) AND n.createdAt <= :yesterdayStart ORDER BY n.createdAt DESC")
        List<Notification> findHistoryNotifications(@Param("userId") Long userId,
                        @Param("yesterdayStart") LocalDateTime yesterdayStart);

        // Notificaciones paginadas
        @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) ORDER BY n.createdAt DESC")
        Page<Notification> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

        // Notificaciones no leídas paginadas
        @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId = 0) AND n.isRead = false ORDER BY n.createdAt DESC")
        Page<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(@Param("userId") Long userId,
                        Pageable pageable);

        // Para admin - todas las notificaciones admin
        List<Notification> findByUserIdIsNullOrderByCreatedAtDesc();

        // Notificaciones admin no leídas
        List<Notification> findByUserIdIsNullAndIsReadFalseOrderByCreatedAtDesc();

        // Por ID y usuario
        Optional<Notification> findByIdAndUserId(Long id, Long userId);

        // Deduplication: check if a notification already exists for
        // user+type+orderNumber
        boolean existsByUserIdAndTypeAndOrderNumber(Long userId, NotificationType type, String orderNumber);

        // Deduplication for admin notifications (userId is null)
        boolean existsByUserIdIsNullAndTypeAndOrderNumber(NotificationType type, String orderNumber);
}
