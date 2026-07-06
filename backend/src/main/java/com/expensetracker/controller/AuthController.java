package com.expensetracker.controller;

import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder encoder;
    @Autowired private JwtUtil jwtUtil;

    @GetMapping("/")
    public String home() { return "XpenseIQ API is running ✅"; }

    // ── POST /register ────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<Map<String,String>> register(@RequestBody Map<String,String> body) {
        String name = body.get("name"), email = body.get("email"), password = body.get("password");

        if (name == null || name.trim().isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message","Name is required"));
        if (email == null || email.trim().isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message","Email is required"));
        if (password == null || password.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("message","Password must be at least 6 characters"));
        if (userRepo.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("message","Email already registered"));

        User user = new User();
        user.setName(name.trim()); user.setEmail(email.trim());
        user.setPassword(encoder.encode(password));
        userRepo.save(user);

        return ResponseEntity.status(201).body(Map.of("message","User registered successfully"));
    }

    // ── POST /login ───────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<Map<String,Object>> login(@RequestBody Map<String,String> body) {
        String email = body.get("email"), password = body.get("password");

        if (email == null || password == null)
            return ResponseEntity.badRequest().body(Map.of("message","Email and password are required"));

        Optional<User> opt = userRepo.findByEmail(email);
        if (opt.isEmpty() || !encoder.matches(password, opt.get().getPassword()))
            return ResponseEntity.status(401).body(Map.of("message","Invalid email or password"));

        User user  = opt.get();
        String tok = jwtUtil.generateToken(user.getId(), user.getEmail());

        Map<String,Object> userMap = new HashMap<>();
        userMap.put("id", user.getId()); userMap.put("name", user.getName()); userMap.put("email", user.getEmail());

        Map<String,Object> res = new HashMap<>();
        res.put("message","Login successful"); res.put("token", tok); res.put("user", userMap);
        return ResponseEntity.ok(res);
    }
}
