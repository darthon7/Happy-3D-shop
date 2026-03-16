package com.dazehaze.service;

import com.dazehaze.dto.auth.AuthResponse;
import com.dazehaze.dto.auth.LoginRequest;
import com.dazehaze.dto.auth.RegisterRequest;
import com.dazehaze.entity.User;
import com.dazehaze.exception.EmailAlreadyExistsException;
import com.dazehaze.repository.UserRepository;
import com.dazehaze.security.JwtService;
import com.dazehaze.security.RateLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private UserDetailsService userDetailsService;
    @Mock
    private RateLimiter rateLimiter;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private UserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "jwtExpiration", 3600000L); // 1 hora

        testUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encoded_password")
                .firstName("Test")
                .lastName("User")
                .role(User.Role.CUSTOMER)
                .failedLoginAttempts(0)
                .build();

        mockUserDetails = mock(UserDetails.class);
    }

    @Test
    void register_ValidRequest_Success() {
        // Arrange
        RegisterRequest request = new RegisterRequest("Test", "User", "test@example.com", "password", "1234");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(mockUserDetails);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("access_token");
        when(jwtService.generateRefreshToken(any(UserDetails.class))).thenReturn("refresh_token");

        // Act
        AuthResponse response = authService.register(request);

        // Assert
        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        assertEquals("test@example.com", response.getUser().getEmail());

        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        // Arrange
        RegisterRequest request = new RegisterRequest("Test", "User", "exist@example.com", "password", "1234");
        when(userRepository.existsByEmail("exist@example.com")).thenReturn(true);

        // Act & Assert
        assertThrows(EmailAlreadyExistsException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_ValidCredentials_Success() {
        // Arrange
        LoginRequest request = new LoginRequest("test@example.com", "password");

        when(rateLimiter.isAllowed(anyString())).thenReturn(true);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(mockUserDetails);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn("access_token");

        // Act
        AuthResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(rateLimiter).reset(anyString());
    }

    @Test
    void login_InvalidCredentials_ThrowsExceptionAndRegistersAttempt() {
        // Arrange
        LoginRequest request = new LoginRequest("test@example.com", "wrong_pass");

        when(rateLimiter.isAllowed(anyString())).thenReturn(true);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad info"));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> authService.login(request));

        // Assert attempt was registered and saved
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void login_RateLimitExceeded_ThrowsException() {
        // Arrange
        LoginRequest request = new LoginRequest("test@example.com", "password");
        when(rateLimiter.isAllowed(anyString())).thenReturn(false);

        // Act & Assert
        Exception e = assertThrows(RuntimeException.class, () -> authService.login(request));
        assertTrue(e.getMessage().contains("Demasiados intentos"));
        verify(authenticationManager, never()).authenticate(any());
    }
}
