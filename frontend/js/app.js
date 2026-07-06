// ============================================================
//  app.js — AngularJS Main Module + Config
// ============================================================

var app = angular.module('XpenseIQ', ['ngRoute']);

// ── API Base URL ──────────────────────────────────────────
app.constant('API_URL', 'http://localhost:5000');

// ── Route Config ─────────────────────────────────────────
app.config(function($routeProvider, $locationProvider) {

    $routeProvider

        .when('/login', {
            templateUrl: 'pages/login.html',
            controller:  'AuthController',
            resolve: { redirectIfLoggedIn: redirectIfLoggedIn }
        })

        .when('/register', {
            templateUrl: 'pages/register.html',
            controller:  'AuthController',
            resolve: { redirectIfLoggedIn: redirectIfLoggedIn }
        })

        .when('/dashboard', {
            templateUrl: 'pages/dashboard.html',
            controller:  'DashboardController',
            resolve: { requireAuth: requireAuth }
        })

        .when('/add-expense', {
            templateUrl: 'pages/add-expense.html',
            controller:  'ExpenseFormController',
            resolve: { requireAuth: requireAuth }
        })

        .when('/edit-expense/:id', {
            templateUrl: 'pages/add-expense.html',
            controller:  'ExpenseFormController',
            resolve: { requireAuth: requireAuth }
        })

        .when('/history', {
            templateUrl: 'pages/history.html',
            controller:  'HistoryController',
            resolve: { requireAuth: requireAuth }
        })

        .when('/reports', {
            templateUrl: 'pages/reports.html',
            controller:  'ReportsController',
            resolve: { requireAuth: requireAuth }
        })

        .otherwise({ redirectTo: '/login' });
});

// ── Route Guards ─────────────────────────────────────────
function requireAuth($location, AuthService) {
    if (!AuthService.isLoggedIn()) {
        $location.path('/login');
    }
}
requireAuth.$inject = ['$location', 'AuthService'];

function redirectIfLoggedIn($location, AuthService) {
    if (AuthService.isLoggedIn()) {
        $location.path('/dashboard');
    }
}
redirectIfLoggedIn.$inject = ['$location', 'AuthService'];

// ── HTTP Interceptor — adds JWT to every request ─────────
app.factory('AuthInterceptor', function($injector) {
    return {
        request: function(config) {
            var AuthService = $injector.get('AuthService');
            var token = AuthService.getToken();
            if (token) {
                config.headers['Authorization'] = 'Bearer ' + token;
            }
            return config;
        },
        responseError: function(rejection) {
            if (rejection.status === 401) {
                var AuthService = $injector.get('AuthService');
                AuthService.logout();
                var $location = $injector.get('$location');
                $location.path('/login');
            }
            return rejection;
        }
    };
});

app.config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
});

// ── Theme: apply saved theme on page load ─────────────────
app.run(function($rootScope, $location, AuthService) {
    var saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    $rootScope.theme = saved;

    $rootScope.toggleTheme = function() {
        var next = $rootScope.theme === 'dark' ? 'light' : 'dark';
        $rootScope.theme = next;
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    };

    $rootScope.$on('$routeChangeStart', function() {
        $rootScope.currentUser = AuthService.getUser();
        $rootScope.isLoggedIn  = AuthService.isLoggedIn();
        $rootScope.currentPath = $location.path();
    });
});
