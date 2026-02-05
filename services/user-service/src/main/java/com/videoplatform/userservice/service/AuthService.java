package com.videoplatform.userservice.service;

import com.videoplatform.userservice.dto.*;
import com.videoplatform.userservice.entity.User;
import com.videoplatform.userservice.repository.UserRepository;
import com.videoplatform.userservice.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        
        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        
        // Create new user
        User user = User.builder()
            .email(request.getEmail())
            .username(request.getUsername())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .role(User.UserRole.USER)
            .status(User.UserStatus.ACTIVE)
            .emailVerified(false)
            .build();
        
        user = userRepository.save(user);
        log.info("New user registered: {}", user.getUsername());
        
        // Generate tokens
        String token = tokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());
        
        return AuthResponse.builder()
            .token(token)
            .refreshToken(refreshToken)
            .expiresIn(tokenProvider.getJwtExpiration())
            .user(mapToUserDto(user))
            .build();
    }
    
    @Transactional
    public AuthResponse login(AuthRequest request) {
        // Find user by email or username
        User user = userRepository.findByEmailOrUsername(request.getIdentifier())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        // Check if user is active
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new RuntimeException("Account is not active");
        }
        
        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        
        log.info("User logged in: {}", user.getUsername());
        
        // Generate tokens
        String token = tokenProvider.generateToken(user.getId(), user.getUsername(), user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());
        
        return AuthResponse.builder()
            .token(token)
            .refreshToken(refreshToken)
            .expiresIn(tokenProvider.getJwtExpiration())
            .user(mapToUserDto(user))
            .build();
    }
    
    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .fullName(user.getFullName())
            .bio(user.getBio())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole())
            .status(user.getStatus())
            .emailVerified(user.getEmailVerified())
            .lastLoginAt(user.getLastLoginAt())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
}