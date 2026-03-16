package com.dazehaze.service;

import com.dazehaze.dto.auth.AuthResponse;
import com.dazehaze.dto.auth.ForgotPasswordRequest;
import com.dazehaze.dto.auth.LoginRequest;
import com.dazehaze.dto.auth.RegisterRequest;
import com.dazehaze.dto.auth.ResetPasswordRequest;
import com.dazehaze.entity.User;
import com.dazehaze.exception.EmailAlreadyExistsException;
import com.dazehaze.repository.UserRepository;
import com.dazehaze.security.JwtService;
import com.dazehaze.security.RateLimiter;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final RateLimiter rateLimiter;
    private EmailService emailService;

    @Autowired(required = false)
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;
    private static final int PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 60;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        
        // Check if email already exists
        if (userRepository.existsByEmail(normalizedEmail)) {
            // Use generic error to avoid email enumeration
            throw new EmailAlreadyExistsException(
                    "No se pudo completar el registro. Verifica tus datos o intenta iniciar sesión.");
        }

        // Create new user
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(User.Role.CUSTOMER)
                .enabled(true)
                .emailVerified(false)
                .failedLoginAttempts(0)
                .build();

        User savedUser = userRepository.save(user);

        // Send welcome email
        if (emailService != null) {
            try {
                emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getFirstName());
            } catch (Exception e) {
                log.warn("Failed to send welcome email: {}", e.getMessage());
            }
        }

        // Generate tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return buildAuthResponse(savedUser, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Rate limiting check
        if (!rateLimiter.isAllowed("login:" + email)) {
            log.warn("Rate limit excedido para login de: {}", maskEmail(email));
            throw new RuntimeException("Demasiados intentos. Espere un momento antes de intentar nuevamente.");
        }

        // Check if account is locked
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && isAccountLocked(user)) {
            log.warn("Intento de login en cuenta bloqueada: {}", maskEmail(email));
            throw new RuntimeException(
                    "Cuenta bloqueada temporalmente. Intente en " + LOCK_DURATION_MINUTES + " minutos.");
        }

        try {
            // Authenticate user
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));

            // Login exitoso - resetear contadores
            if (user != null) {
                resetFailedAttempts(user);
            } else {
                user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));
            }
            rateLimiter.reset("login:" + email);

            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            log.info("Login exitoso para: {}", maskEmail(email));
            return buildAuthResponse(user, accessToken, refreshToken);

        } catch (BadCredentialsException e) {
            // Login fallido - incrementar contador
            if (user != null) {
                registerFailedAttempt(user);
            }
            throw e;
        }
    }

    public AuthResponse refreshToken(String refreshToken) {
        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String newAccessToken = jwtService.generateToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    // --- Account lockout helpers ---

    private boolean isAccountLocked(User user) {
        if (user.getLockedUntil() == null)
            return false;
        if (LocalDateTime.now().isAfter(user.getLockedUntil())) {
            // Lock expired, reset
            resetFailedAttempts(user);
            return false;
        }
        return true;
    }

    private void registerFailedAttempt(User user) {
        int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
        user.setFailedLoginAttempts(attempts);
        user.setLastFailedLogin(LocalDateTime.now());

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
            log.warn("Cuenta bloqueada por {} minutos para: {}", LOCK_DURATION_MINUTES, maskEmail(user.getEmail()));
        }

        userRepository.save(user);
    }

    private void resetFailedAttempts(User user) {
        if (user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            user.setLastFailedLogin(null);
            userRepository.save(user);
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@"))
            return "***";
        int atIndex = email.indexOf('@');
        if (atIndex <= 2)
            return "***" + email.substring(atIndex);
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration / 1000) // Convert to seconds
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .phone(user.getPhone())
                        .role(user.getRole().name())
                        .profileImageUrl(user.getProfileImageUrl())
                        .build())
                .build();
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        log.info("Password reset requested for: {}", maskEmail(email));

        log.info("EmailService is: {}", emailService != null ? "INITIALIZED" : "NULL");

        if (emailService == null) {
            log.warn("Email service not configured. Password reset is disabled.");
            return;
        }

        var userOpt = userRepository.findByEmail(email);
        log.info("User found: {}", userOpt.isPresent());

        userOpt.ifPresent(user -> {
            log.info("Generating reset token for user: {}", maskEmail(email));
            String token = generateResetToken();
            user.setResetPasswordToken(token);
            user.setResetPasswordExpires(LocalDateTime.now().plusMinutes(PASSWORD_RESET_TOKEN_EXPIRY_MINUTES));
            userRepository.save(user);

            try {
                log.info("Calling sendPasswordResetEmail...");
                emailService.sendPasswordResetEmail(email, token);
                log.info("Password reset email sent to: {}", maskEmail(email));
            } catch (Exception e) {
                log.error("Failed to send password reset email", e);
            }
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getToken();
        log.info("Password reset attempt with token");

        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Token de recuperación inválido"));

        if (user.getResetPasswordExpires() == null ||
                user.getResetPasswordExpires().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El token de recuperación ha expirado");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpires(null);
        userRepository.save(user);

        log.info("Password successfully reset for user: {}", maskEmail(user.getEmail()));
    }

    private String generateResetToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
