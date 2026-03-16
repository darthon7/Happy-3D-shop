package com.dazehaze.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // A direct mock of a 256-bit base64 secret key
        String secretKey = "VGhpc0lzQVNlY3JldEtleUZvclRlc3RpbmdKV1RzVGhhdE11c3RCZUF0TGVhc3QyNTZCaXRzTG9uZw==";

        ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 1000L * 60 * 60); // 1 hora
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 1000L * 60 * 60 * 24 * 7); // 7 dias

        testUser = new User("test@example.com", "password", Collections.emptyList());
    }

    @Test
    void generateToken_ReturnsValidToken() {
        // Act
        String token = jwtService.generateToken(testUser);

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
        // A valid JWT has 3 parts separated by dots
        assertEquals(3, token.split("\\.").length);
    }

    @Test
    void extractUsername_ReturnsCorrectUsername() {
        // Arrange
        String token = jwtService.generateToken(testUser);

        // Act
        String username = jwtService.extractUsername(token);

        // Assert
        assertEquals("test@example.com", username);
    }

    @Test
    void isTokenValid_WithValidToken_ReturnsTrue() {
        // Arrange
        String token = jwtService.generateToken(testUser);

        // Act
        boolean isValid = jwtService.isTokenValid(token, testUser);

        // Assert
        assertTrue(isValid);
    }

    @Test
    void isTokenValid_WithDifferentUser_ReturnsFalse() {
        // Arrange
        String token = jwtService.generateToken(testUser);
        UserDetails differentUser = new User("other@example.com", "password", Collections.emptyList());

        // Act
        boolean isValid = jwtService.isTokenValid(token, differentUser);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void isTokenValid_WithExpiredToken_ReturnsFalse() throws InterruptedException {
        // Arrange
        // Moficamos expiracion a 1 milisegundo para que expire de inmediato
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 1L);
        String token = jwtService.generateToken(testUser);

        // Act (esperamos un poco a que expire)
        Thread.sleep(5);

        // Assert
        // El parser lanzará io.jsonwebtoken.ExpiredJwtException si ya expiro
        assertThrows(io.jsonwebtoken.ExpiredJwtException.class, () -> jwtService.isTokenValid(token, testUser));
    }

    @Test
    void generateRefreshToken_ReturnsValidToken() {
        // Act
        String refreshToken = jwtService.generateRefreshToken(testUser);

        // Assert
        assertNotNull(refreshToken);
        assertFalse(refreshToken.isEmpty());
    }
}
