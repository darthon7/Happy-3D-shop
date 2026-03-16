package com.dazehaze.service;

import com.dazehaze.dto.order.CheckoutRequest;
import com.dazehaze.dto.order.OrderResponse;
import com.dazehaze.entity.*;
import com.dazehaze.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

        @Mock
        private OrderRepository orderRepository;
        @Mock
        private CartRepository cartRepository;
        @Mock
        private CartService cartService;
        @Mock
        private AddressRepository addressRepository;
        @Mock
        private ProductVariantRepository productVariantRepository;
        @Mock
        private CouponRepository couponRepository;
        @Mock
        private ShippingService shippingService;
        @Mock
        private OrderNotificationService orderNotificationService;
        @Mock
        private StripePaymentService stripePaymentService;
        @Mock
        private EnviaShippingService enviaShippingService;

        @InjectMocks
        private OrderService orderService;

        private User testUser;
        private Cart testCart;
        private ProductVariant testVariant;
        private CheckoutRequest testRequest;

        @BeforeEach
        void setUp() {
                testUser = User.builder().id(1L).email("test@example.com").build();

                Product product = Product.builder()
                                .id(1L)
                                .name("Test Product")
                                .basePrice(new BigDecimal("100.00"))
                                .images(new ArrayList<>())
                                .build();
                product.setCurrentPrice(new BigDecimal("100.00"));

                testVariant = ProductVariant.builder()
                                .id(1L)
                                .product(product)
                                .sku("SKU-123")
                                .stock(10) // 10 initial stock
                                .priceAdjustment(BigDecimal.ZERO)
                                .build();

                CartItem item = CartItem.builder()
                                .id(1L)
                                .productVariant(testVariant)
                                .quantity(2)
                                .build();

                testCart = Cart.builder()
                                .id(1L)
                                .user(testUser)
                                .items(List.of(item))
                                .build();

                testRequest = CheckoutRequest.builder()
                                .shippingStreet("123 Test St")
                                .shippingCity("Test City")
                                .shippingPostalCode("12345")
                                .shippingCountry("MX")
                                .sameAsShipping(true)
                                .shippingCost(new BigDecimal("150.00"))
                                .paymentMethod(CheckoutRequest.PaymentMethod.STRIPE)
                                .build();
        }

        @Test
        void createOrder_ValidCart_Success() {
                // Arrange
                when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
                when(addressRepository.findByUserId(1L)).thenReturn(new ArrayList<>());
                when(addressRepository.save(any(Address.class))).thenAnswer(i -> {
                        Address addr = i.getArgument(0);
                        addr.setId(1L);
                        return addr;
                });

                when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
                        Order o = i.getArgument(0);
                        o.setId(1L);
                        o.setOrderNumber("ORD-123");
                        return o;
                });

                // Act
                OrderResponse response = orderService.createOrder(1L, "session123", testRequest);

                // Assert
                assertNotNull(response);
                assertEquals("ORD-123", response.getOrderNumber());
                assertEquals("STRIPE", response.getPaymentMethod());
                assertEquals(new BigDecimal("150.00"), response.getShippingCost());

                // 2 items * $100 = $200 subtotal. + $150 shipping = $350 total
                // Note: Cart getTotal() adds tax. Here we mock it via Cart inner logic, which
                // multiplies (Subtotal-discount)*1.16
                // Actually, Cart.subtotal is $200. $200 + 16% tax = $232. + $150 shipping =
                // $382
                assertEquals(new BigDecimal("382.00").compareTo(response.getTotal()), 0);

                // Verify stock was reduced
                assertEquals(8, testVariant.getStock());
                verify(productVariantRepository, times(1)).save(testVariant);

                // Verify services were called
                verify(cartService).clearCart(1L, "session123");
                verify(orderNotificationService).notifyOrderCreated(any(Order.class));
        }

        @Test
        void createOrder_EmptyCart_ThrowsException() {
                // Arrange
                testCart.setItems(new ArrayList<>());
                when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));

                // Act & Assert
                Exception e = assertThrows(RuntimeException.class,
                                () -> orderService.createOrder(1L, "session123", testRequest));
                assertEquals("Cart is empty", e.getMessage());
                verify(orderRepository, never()).save(any());
        }

        @Test
        void createOrder_InsufficientStock_ThrowsException() {
                // Arrange
                testVariant.setStock(1); // Only 1 in stock, cart asks for 2
                when(cartRepository.findByUserId(1L)).thenReturn(Optional.of(testCart));
                when(addressRepository.findByUserId(1L)).thenReturn(new ArrayList<>());
                when(addressRepository.save(any(Address.class))).thenReturn(new Address());

                // Act & Assert
                Exception e = assertThrows(RuntimeException.class,
                                () -> orderService.createOrder(1L, "session123", testRequest));
                assertTrue(e.getMessage().contains("Insufficient stock"));

                // Ensure nothing was saved or cleared
                verify(orderRepository, never()).save(any());
                verify(cartService, never()).clearCart(any(), any());
        }

        @Test
        void cancelOrder_ValidOrder_RestoresStockAndChangesStatus() {
                // Arrange
                Order testOrder = Order.builder()
                                .id(1L)
                                .orderNumber("ORD-123")
                                .user(testUser)
                                .status(Order.OrderStatus.PENDING)
                                .paymentStatus(Order.PaymentStatus.PENDING)
                                .paymentMethod(Order.PaymentMethod.STRIPE)
                                .items(new ArrayList<>())
                                .build();

                OrderItem orderItem = OrderItem.builder()
                                .productVariant(testVariant)
                                .quantity(2)
                                .build();
                testOrder.getItems().add(orderItem);

                when(orderRepository.findByOrderNumber("ORD-123")).thenReturn(Optional.of(testOrder));

                // Act
                OrderResponse response = orderService.cancelOrder("ORD-123", 1L, null);

                // Assert
                assertEquals("CANCELLED", response.getStatus());
                assertEquals(12, testVariant.getStock()); // 10 initial + 2 restored

                verify(productVariantRepository, times(1)).save(testVariant);
                verify(orderRepository, times(1)).save(testOrder);
        }
}
