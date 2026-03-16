package com.dazehaze.controller;

import com.dazehaze.dto.order.CancelOrderRequest;
import com.dazehaze.dto.order.CheckoutRequest;
import com.dazehaze.dto.order.OrderResponse;
import com.dazehaze.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final com.dazehaze.repository.UserRepository userRepository;

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            @Valid @RequestBody CheckoutRequest checkoutRequest) {
        Long userId = getUserId(userDetails);
        String sessionId = request.getHeader("X-Session-Id");
        OrderResponse order = orderService.createOrder(userId, sessionId, checkoutRequest);
        return new ResponseEntity<>(order, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable String orderNumber,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(orderService.getOrderByNumber(orderNumber, userId));
    }

    @PostMapping("/{orderNumber}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable String orderNumber,
            @Valid @RequestBody(required = false) CancelOrderRequest cancelRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        return ResponseEntity.ok(orderService.cancelOrder(orderNumber, userId, cancelRequest));
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null)
            return null;
        return userRepository.findByEmail(userDetails.getUsername())
                .map(com.dazehaze.entity.User::getId)
                .orElse(null);
    }
}
