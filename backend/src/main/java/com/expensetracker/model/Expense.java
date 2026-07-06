package com.expensetracker.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private String category;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ── Constructors ──
    public Expense() {}

    // ── Getters ──
    public Long getId()             { return id; }
    public String getTitle()        { return title; }
    public BigDecimal getAmount()   { return amount; }
    public String getCategory()     { return category; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public User getUser()           { return user; }

    // ── Setters ──
    public void setId(Long id)                  { this.id = id; }
    public void setTitle(String title)          { this.title = title; }
    public void setAmount(BigDecimal amount)    { this.amount = amount; }
    public void setCategory(String category)    { this.category = category; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public void setUser(User user)              { this.user = user; }
}