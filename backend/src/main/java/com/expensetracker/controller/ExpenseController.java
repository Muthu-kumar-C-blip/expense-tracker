package com.expensetracker.controller;

import com.expensetracker.model.Expense;
import com.expensetracker.model.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/expenses")
@CrossOrigin(origins = "*")
public class ExpenseController {

    @Autowired private ExpenseRepository expenseRepo;
    @Autowired private UserRepository userRepo;

    private Long uid(Authentication auth) { return (Long) auth.getPrincipal(); }

    // ── GET /expenses ─────────────────────────────
    @GetMapping
    public ResponseEntity<List<Map<String,Object>>> getAll(Authentication auth) {
        List<Map<String,Object>> result = new ArrayList<>();
        expenseRepo.findByUserIdOrderByIdDesc(uid(auth)).forEach(e -> result.add(toMap(e)));
        return ResponseEntity.ok(result);
    }

    // ── POST /expenses ────────────────────────────
    @PostMapping
    public ResponseEntity<Map<String,String>> add(@RequestBody Map<String,Object> body, Authentication auth) {
        var err = validate(body);
        if (err != null) return err;

        User user = userRepo.findById(uid(auth)).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("message","Unauthorized"));

        Expense e = new Expense();
        e.setTitle(body.get("title").toString().trim());
        e.setAmount(new BigDecimal(body.get("amount").toString()));
        e.setCategory(body.get("category").toString());
        e.setExpenseDate(LocalDate.parse(body.get("expense_date").toString().substring(0, 10)));
        e.setUser(user);
        expenseRepo.save(e);

        return ResponseEntity.status(201).body(Map.of("message","Expense added successfully"));
    }

    // ── PUT /expenses/{id} ────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Map<String,String>> update(@PathVariable Long id,
                                                      @RequestBody Map<String,Object> body,
                                                      Authentication auth) {
        var err = validate(body);
        if (err != null) return err;

        var opt = expenseRepo.findByIdAndUserId(id, uid(auth));
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","Expense not found or unauthorized"));

        Expense e = opt.get();
        e.setTitle(body.get("title").toString().trim());
        e.setAmount(new BigDecimal(body.get("amount").toString()));
        e.setCategory(body.get("category").toString());
        e.setExpenseDate(LocalDate.parse(body.get("expense_date").toString()));
        expenseRepo.save(e);

        return ResponseEntity.ok(Map.of("message","Expense updated successfully"));
    }

    // ── DELETE /expenses/{id} ─────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String,String>> delete(@PathVariable Long id, Authentication auth) {
        var opt = expenseRepo.findByIdAndUserId(id, uid(auth));
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","Expense not found or unauthorized"));
        expenseRepo.delete(opt.get());
        return ResponseEntity.ok(Map.of("message","Expense deleted successfully"));
    }

    // ── Helpers ───────────────────────────────────
    private ResponseEntity<Map<String,String>> validate(Map<String,Object> b) {
        if (b.get("title") == null || b.get("title").toString().trim().isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message","Title is required"));
        try {
            if (new BigDecimal(b.get("amount").toString()).compareTo(BigDecimal.ZERO) <= 0)
                return ResponseEntity.badRequest().body(Map.of("message","Amount must be greater than 0"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message","Invalid amount"));
        }
        if (b.get("category") == null || b.get("category").toString().trim().isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message","Category is required"));
        if (b.get("expense_date") == null || b.get("expense_date").toString().trim().isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message","Date is required"));
        return null;
    }

    private Map<String,Object> toMap(Expense e) {
        Map<String,Object> m = new LinkedHashMap<>();
        m.put("id",           e.getId());
        m.put("title",        e.getTitle());
        m.put("amount",       e.getAmount());
        m.put("category",     e.getCategory());
        m.put("expense_date", e.getExpenseDate().toString());
        m.put("user_id",      e.getUser().getId());
        return m;
    }
}
