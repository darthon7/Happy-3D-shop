package com.dazehaze.service;

import com.dazehaze.entity.*;
import com.dazehaze.repository.NotificationRepository;
import com.dazehaze.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Notification create(Notification notification) {
        try {
            Notification saved = notificationRepository.save(notification);
            log.info("Notification created: {} for user {}", notification.getType(), notification.getUserId());
            return saved;
        } catch (Exception e) {
            log.error("Failed to create notification: type={}, userId={}, error={}",
                    notification.getType(), notification.getUserId(), e.getMessage());
            return null;
        }
    }

    @Transactional
    public Notification createForUser(Long userId, NotificationType type, String title, String message, String link) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        return create(notification);
    }

    @Transactional
    public Notification createForAdmin(NotificationType type, String title, String message, String link) {
        Notification notification = Notification.builder()
                .userId(null)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        return create(notification);
    }

    @Transactional
    public Notification createWithImage(Long userId, NotificationType type, String title, String message, String link,
            Long productId, String productName, String imageUrl) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .productId(productId)
                .productName(productName)
                .imageUrl(imageUrl)
                .build();
        return create(notification);
    }

    @Transactional
    public Notification createAdminWithImage(NotificationType type, String title, String message, String link,
            Long productId, String productName, String imageUrl) {
        Notification notification = Notification.builder()
                .userId(null)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .productId(productId)
                .productName(productName)
                .imageUrl(imageUrl)
                .build();
        return create(notification);
    }

    @Transactional
    public void notifyAllUsers(NotificationType type, String title, String message, String link,
            Long productId, String productName, String imageUrl) {

        List<User> allUsers = userRepository.findAll();

        List<Notification> notifications = allUsers.stream().map(user -> Notification.builder()
                .userId(user.getId())
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .productId(productId)
                .productName(productName)
                .imageUrl(imageUrl)
                .build()).toList();

        notificationRepository.saveAll(notifications);
        log.info("Broadcast notification created for {} users", notifications.size());
    }

    // Order-aware: creates a user notification with orderNumber and dedup check
    @Transactional
    public Notification createForUserOrder(Long userId, NotificationType type, String title, String message,
            String link, String orderNumber) {
        // Deduplicate: skip if identical notification already exists
        if (orderNumber != null
                && notificationRepository.existsByUserIdAndTypeAndOrderNumber(userId, type, orderNumber)) {
            log.info("Skipping duplicate notification: type={}, orderNumber={}, userId={}", type, orderNumber, userId);
            return null;
        }
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .orderNumber(orderNumber)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        return create(notification);
    }

    @Transactional
    public Notification createForUserOrderWithImage(Long userId, NotificationType type, String title, String message,
            String link, String orderNumber, Long productId, String productName, String imageUrl) {
        if (orderNumber != null
                && notificationRepository.existsByUserIdAndTypeAndOrderNumber(userId, type, orderNumber)) {
            log.info("Skipping duplicate notification: type={}, orderNumber={}, userId={}", type, orderNumber, userId);
            return null;
        }
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .orderNumber(orderNumber)
                .productId(productId)
                .productName(productName)
                .imageUrl(imageUrl)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        return create(notification);
    }

    // Order-aware: creates an admin notification with orderNumber and dedup check
    @Transactional
    public Notification createForAdminOrder(NotificationType type, String title, String message, String link,
            String orderNumber) {
        // Deduplicate: skip if identical notification already exists
        if (orderNumber != null
                && notificationRepository.existsByUserIdIsNullAndTypeAndOrderNumber(type, orderNumber)) {
            log.info("Skipping duplicate admin notification: type={}, orderNumber={}", type, orderNumber);
            return null;
        }
        Notification notification = Notification.builder()
                .userId(null)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .orderNumber(orderNumber)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        return create(notification);
    }

    @Transactional
    public Notification createForAdminOrderWithImage(NotificationType type, String title, String message, String link,
            String orderNumber, Long productId, String productName, String imageUrl) {
        if (orderNumber != null
                && notificationRepository.existsByUserIdIsNullAndTypeAndOrderNumber(type, orderNumber)) {
            log.info("Skipping duplicate admin notification: type={}, orderNumber={}", type, orderNumber);
            return null;
        }
        Notification notification = Notification.builder()
                .userId(null)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .orderNumber(orderNumber)
                .productId(productId)
                .productName(productName)
                .imageUrl(imageUrl)
                .priority(NotificationPriority.NORMAL)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        return create(notification);
    }

    @Transactional
    public Notification markAsRead(Long notificationId, Long userId) {
        // Try to find a user-specific notification first
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElse(null);

        // Fall back to broadcast notification (userId = 0)
        if (notification == null) {
            notification = notificationRepository.findByIdAndUserId(notificationId, 0L)
                    .orElse(null);
        }

        if (notification != null && !notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            log.info("Notification {} marked as read for user {}", notificationId, userId);
            return notificationRepository.save(notification);
        }
        return notification;
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        LocalDateTime now = LocalDateTime.now();

        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(now);
        }

        notificationRepository.saveAll(unreadNotifications);
        log.info("All notifications marked as read for user {}", userId);
    }

    @Transactional
    public void delete(Long notificationId, Long userId) {
        // Try to find a user-specific notification first
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElse(null);

        // Fall back to broadcast notification (userId = 0)
        if (notification == null) {
            notification = notificationRepository.findByIdAndUserId(notificationId, 0L)
                    .orElse(null);
        }

        if (notification != null) {
            notificationRepository.delete(notification);
            log.info("Notification {} deleted for user {}", notificationId, userId);
        }
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public long getAdminUnreadCount() {
        return notificationRepository.countByUserIdIsNullAndIsReadFalse();
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getRecentNotifications(Long userId) {
        LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);
        return notificationRepository.findRecentNotifications(userId, thirtyMinutesAgo);
    }

    public List<Notification> getTodayNotifications(Long userId) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        return notificationRepository.findTodayNotifications(userId, startOfDay);
    }

    public List<Notification> getHistoryNotifications(Long userId) {
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1).withHour(0).withMinute(0).withSecond(0);
        return notificationRepository.findHistoryNotifications(userId, yesterday);
    }

    public Page<Notification> getNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public Page<Notification> getUnreadNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable);
    }

    // Admin methods
    public List<Notification> getAdminNotifications() {
        return notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc();
    }

    public List<Notification> getUnreadAdminNotifications() {
        return notificationRepository.findByUserIdIsNullAndIsReadFalseOrderByCreatedAtDesc();
    }

    @Transactional
    public Notification markAdminNotificationAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);

        if (notification != null && notification.getUserId() == null && !notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            log.info("Admin notification {} marked as read", notificationId);
            return notificationRepository.save(notification);
        }
        return notification;
    }

    @Transactional
    public void markAllAdminNotificationsAsRead() {
        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdIsNullAndIsReadFalseOrderByCreatedAtDesc();
        LocalDateTime now = LocalDateTime.now();

        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(now);
        }

        notificationRepository.saveAll(unreadNotifications);
        log.info("All admin notifications marked as read");
    }
}
