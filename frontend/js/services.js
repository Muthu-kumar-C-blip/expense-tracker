// ============================================================
//  services.js — AuthService + ExpenseService
// ============================================================

// ── Auth Service ─────────────────────────────────────────
app.service('AuthService', function($http, $location, API_URL) {

    this.register = function(name, email, password) {
        return $http.post(API_URL + '/register', { name: name, email: email, password: password });
    };

    this.login = function(email, password) {
        return $http.post(API_URL + '/login', { email: email, password: password })
            .then(function(res) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user',  JSON.stringify(res.data.user));
                return res;
            });
    };

    this.logout = function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        $location.path('/login');
    };

    this.isLoggedIn = function() {
        return !!localStorage.getItem('token');
    };

    this.getToken = function() {
        return localStorage.getItem('token');
    };

    this.getUser = function() {
        var u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    };
});


// ── Expense Service ───────────────────────────────────────
app.service('ExpenseService', function($http, API_URL) {

    this.getAll = function() {
        return $http.get(API_URL + '/expenses');
    };

    this.add = function(expense) {
        return $http.post(API_URL + '/expenses', expense);
    };

    this.update = function(id, expense) {
        return $http.put(API_URL + '/expenses/' + id, expense);
    };

    this.delete = function(id) {
        return $http.delete(API_URL + '/expenses/' + id);
    };
});
