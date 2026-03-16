package com.dazehaze.controller;

import com.dazehaze.dto.notification.NotificationDTO;
import com.dazehaze.entity.Notification;
import com.dazehaze.entity.User;
import com.dazehaze.repository.UserRepository;
import com.dazehaze.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private NotificationDTO mapToDTO(Notification notification) {
        String timeAgo = calculateTimeAgo(notification.getCreatedAt());
        
        return NotificationDTO.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .link(notification.getLink())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .orderId(notification.getOrderId())
                .orderNumber(notification.getOrderNumber())
                .imageUrl(notification.getImageUrl())
                .timeAgo(timeAgo)
                .build();
    }

    private String calculateTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "";
        
        LocalDateTime now = LocalDateTime.now();
        java.time.Duration duration = java.time.Duration.between(dateTime, now);
        
        long minutes = duration.toMinutes();
        long hours = duration.toHours();
        long days = duration.toDays();
        
        if (minutes < 1) {
            return "Ahora";
        } else if (minutes < 60) {
            return "Hace " + minutes + " min";
        } else if (hours < 24) {
            return "Hace " + hours + " h";
        } else if (days == 1) {
            return "Ayer";
        } else if (days < 7) {
            return "Hace " + days + " días";
        } else {
            return dateTime.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Page<Notification> notificationsPage = unreadOnly 
                ? notificationService.getUnreadNotifications(user.getId(), page, size)
                : notificationService.getNotifications(user.getId(), page, size);
        
        List<NotificationDTO> notifications = notificationsPage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications);
        response.put("currentPage", notificationsPage.getNumber());
        response.put("totalPages", notificationsPage.getTotalPages());
        response.put("totalElements", notificationsPage.getTotalElements());
        response.put("unreadCount", notificationService.getUnreadCount(user.getId()));
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<NotificationDTO>> getRecentNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Notification> notifications = notificationService.getRecentNotifications(user.getId());
        List<NotificationDTO> dtos = notifications.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/today")
    public ResponseEntity<List<NotificationDTO>> getTodayNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Notification> notifications = notificationService.getTodayNotifications(user.getId());
        List<NotificationDTO> dtos = notifications.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/history")
    public ResponseEntity<List<NotificationDTO>> getHistoryNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Notification> notifications = notificationService.getHistoryNotifications(user.getId());
        List<NotificationDTO> dtos = notifications.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Notification notification = notificationService.markAsRead(id, user.getId());
        if (notification == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(mapToDTO(notification));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        User user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().build();
        }
        
        notificationService.delete(id, user.getId());
        return ResponseEntity.ok().build();
    }
}
