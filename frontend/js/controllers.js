// ============================================================
//  controllers.js — All AngularJS Controllers
// ============================================================

var COLORS = ['#6366f1','#06b6d4','#f59e0b','#ec4899','#10b981','#f97316'];

// ── Auth Controller (Login + Register) ───────────────────
app.controller('AuthController', function($scope, $location, AuthService) {

    $scope.data    = {};
    $scope.message = '';
    $scope.msgType = '';
    $scope.loading = false;

    function showMsg(text, type) {
        $scope.message = text;
        $scope.msgType = type;
        setTimeout(function() {
            $scope.$apply(function() { $scope.message = ''; });
        }, 3500);
    }

    $scope.login = function() {
        if (!$scope.data.email || !$scope.data.password) {
            return showMsg('Please fill all fields', 'error');
        }
        $scope.loading = true;
        AuthService.login($scope.data.email, $scope.data.password)
            .then(function() {
                $location.path('/dashboard');
            })
            .catch(function(err) {
                showMsg(err.data ? err.data.message : 'Login failed', 'error');
            })
            .finally(function() { $scope.loading = false; });
    };

    $scope.register = function() {
        if (!$scope.data.name || !$scope.data.email || !$scope.data.password) {
            return showMsg('Please fill all fields', 'error');
        }
        if ($scope.data.password.length < 6) {
            return showMsg('Password must be at least 6 characters', 'error');
        }
        $scope.loading = true;
        AuthService.register($scope.data.name, $scope.data.email, $scope.data.password)
            .then(function() {
                showMsg('Account created! Redirecting...', 'success');
                setTimeout(function() { $scope.$apply(function() { $location.path('/login'); }); }, 1000);
            })
            .catch(function(err) {
                showMsg(err.data ? err.data.message : 'Registration failed', 'error');
            })
            .finally(function() { $scope.loading = false; });
    };
});


// ── Main App Controller (Sidebar + Layout) ────────────────
app.controller('AppController', function($scope, $location, $rootScope, AuthService) {

    $scope.sidebarOpen = false;

    $scope.isActive = function(path) {
        return $location.path() === path;
    };

    $scope.go = function(path) {
        $location.path(path);
        $scope.sidebarOpen = false;
    };

    $scope.logout = function() {
        AuthService.logout();
    };

    $scope.toggleSidebar = function() {
        $scope.sidebarOpen = !$scope.sidebarOpen;
    };

    $scope.closeSidebar = function() {
        $scope.sidebarOpen = false;
    };

    // Page titles
    var titles = {
        '/dashboard':   ['Dashboard',    'Welcome back 👋'],
        '/add-expense': ['Add Expense',  'Log a new spending'],
        '/history':     ['History',      'All your transactions'],
        '/reports':     ['Reports',      'Monthly analysis']
    };

    $scope.$on('$routeChangeSuccess', function() {
        var path = $location.path();
        var t = titles[path] || ['XpenseIQ', ''];
        $scope.pageTitle    = t[0];
        $scope.pageSubtitle = t[1];
        $scope.currentPath  = path;

        // hide edit page title
        if (path.indexOf('/edit-expense') === 0) {
            $scope.pageTitle    = 'Edit Expense';
            $scope.pageSubtitle = 'Update your spending';
        }
    });
});


// ── Dashboard Controller ──────────────────────────────────
app.controller('DashboardController', function($scope, $location, ExpenseService, AuthService) {

    $scope.loading  = true;
    $scope.expenses = [];
    $scope.recent   = [];
    var pieChart = null, barChart = null;

    function load() {
        ExpenseService.getAll().then(function(res) {
            $scope.expenses = res.data;
            $scope.loading  = false;
            buildStats();
            buildRecent();
            buildCharts();
        }).catch(function() { $scope.loading = false; });
    }

    function buildStats() {
        var now   = new Date().toISOString().slice(0, 7);
        var all   = $scope.expenses;
        var month = all.filter(function(e) { return e.expense_date && e.expense_date.startsWith(now); });

        $scope.totalAll    = all.reduce(function(s,e){ return s + parseFloat(e.amount); }, 0);
        $scope.totalMonth  = month.reduce(function(s,e){ return s + parseFloat(e.amount); }, 0);
        $scope.totalCount  = all.length;

        // Top category this month
        var cats = {};
        month.forEach(function(e) { cats[e.category] = (cats[e.category]||0) + parseFloat(e.amount); });
        var top = Object.entries(cats).sort(function(a,b){ return b[1]-a[1]; })[0];
        $scope.topCat    = top ? top[0] : '—';
        $scope.topCatVal = top ? '₹' + top[1].toLocaleString('en-IN') : 'No data';
    }

    function buildRecent() {
        $scope.recent = $scope.expenses.slice(0, 5);
    }

    function buildCharts() {
        var now   = new Date().toISOString().slice(0, 7);
        var month = $scope.expenses.filter(function(e){ return e.expense_date && e.expense_date.startsWith(now); });

        // Pie chart - this month by category
        var cats = {};
        month.forEach(function(e){ cats[e.category] = (cats[e.category]||0) + parseFloat(e.amount); });

        setTimeout(function() {
            var ctx1 = document.getElementById('chart-dash-pie');
            if (!ctx1) return;
            if (pieChart) pieChart.destroy();
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            pieChart = new Chart(ctx1.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(cats),
                    datasets: [{ data: Object.values(cats), backgroundColor: COLORS, borderWidth: 0, hoverOffset: 8 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '60%',
                    plugins: { legend: { position: 'bottom', labels: { color: isDark?'#eef0f8':'#0f1629', padding: 14, font: {family:'Sora', size:12} } } }
                }
            });

            // Bar chart - last 6 months
            var ctx2 = document.getElementById('chart-dash-bar');
            if (!ctx2) return;
            if (barChart) barChart.destroy();
            var months = [], labels = [], totals = [];
            for (var i = 5; i >= 0; i--) {
                var d = new Date(); d.setMonth(d.getMonth() - i);
                var key = d.toISOString().slice(0,7);
                months.push(key);
                labels.push(d.toLocaleString('default',{month:'short'}));
                totals.push($scope.expenses.filter(function(e){ return e.expense_date&&e.expense_date.startsWith(key); }).reduce(function(s,e){ return s+parseFloat(e.amount); },0));
            }
            barChart = new Chart(ctx2.getContext('2d'), {
                type: 'bar',
                data: { labels: labels, datasets: [{ label: 'Spent', data: totals, backgroundColor: '#6366f1', borderRadius: 8, borderSkipped: false }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: isDark?'#7b82a3':'#6b7591', font:{family:'Sora'} } },
                        y: { grid: { color: isDark?'#232843':'#e2e6f0' }, ticks: { color: isDark?'#7b82a3':'#6b7591', font:{family:'Sora'}, callback: function(v){ return '₹'+v; } } }
                    }
                }
            });
        }, 100);
    }

    $scope.badgeClass = function(cat) {
        return 'badge-' + (cat||'other').toLowerCase();
    };

    $scope.formatDate = function(d) {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    };

    $scope.goHistory = function() { $location.path('/history'); };

    load();
});


// ── Expense Form Controller (Add + Edit) ──────────────────
app.controller('ExpenseFormController', function($scope, $location, $routeParams, ExpenseService) {

    $scope.isEdit   = !!$routeParams.id;
    $scope.expense  = { category: '' };
    $scope.message  = '';
    $scope.msgType  = '';
    $scope.loading  = false;

    // If edit mode, prefill form
    if ($scope.isEdit) {
        ExpenseService.getAll().then(function(res) {
            var found = res.data.find(function(e){ return String(e.id) === String($routeParams.id); });
            if (found) {
                $scope.expense = {
                    title:        found.title,
                    amount:       found.amount,
                    category:     found.category,
                    expense_date: found.expense_date ? found.expense_date.split('T')[0] : ''
                };
            }
        });
    }

    function showMsg(text, type) {
        $scope.message = text;
        $scope.msgType = type;
        setTimeout(function(){ $scope.$apply(function(){ $scope.message = ''; }); }, 3000);
    }

    $scope.submit = function() {
        var e = $scope.expense;
        if (!e.title || !e.title.trim())   return showMsg('Title is required', 'error');
        if (!e.amount || e.amount <= 0)    return showMsg('Amount must be greater than 0', 'error');
        if (!e.category)                   return showMsg('Please select a category', 'error');
        if (!e.expense_date)               return showMsg('Date is required', 'error');

        $scope.loading = true;
        var payload = { title: e.title.trim(), amount: e.amount, category: e.category, expense_date: e.expense_date };

        var promise = $scope.isEdit
            ? ExpenseService.update($routeParams.id, payload)
            : ExpenseService.add(payload);

        promise.then(function() {
            showMsg($scope.isEdit ? 'Expense updated!' : 'Expense added!', 'success');
            setTimeout(function(){ $scope.$apply(function(){ $location.path('/history'); }); }, 900);
        }).catch(function(err) {
            showMsg(err.data ? err.data.message : 'Something went wrong', 'error');
        }).finally(function(){ $scope.loading = false; });
    };

    $scope.cancel = function() { $location.path('/history'); };
    $scope.reset  = function() { $scope.expense = { category: '' }; $scope.message = ''; };
});


// ── History Controller ────────────────────────────────────
app.controller('HistoryController', function($scope, $location, ExpenseService) {

    $scope.expenses  = [];
    $scope.filtered  = [];
    $scope.loading   = true;
    $scope.search    = '';
    $scope.filterCat = '';
    $scope.filterDate= '';
    $scope.filterMon = '';

    ExpenseService.getAll().then(function(res) {
        $scope.expenses = res.data;
        $scope.loading  = false;
        $scope.applyFilters();
    }).catch(function(){ $scope.loading = false; });

    $scope.applyFilters = function() {
        var s   = ($scope.search    || '').toLowerCase().trim();
        var cat = $scope.filterCat  || '';
        var dt  = $scope.filterDate || '';
        var mon = $scope.filterMon  || '';

        $scope.filtered = $scope.expenses.filter(function(e) {
            if (s   && !e.title.toLowerCase().includes(s))            return false;
            if (cat && e.category !== cat)                            return false;
            var d = e.expense_date ? e.expense_date.split('T')[0] : '';
            if (dt  && d !== dt)                                      return false;
            if (mon && !d.startsWith(mon))                            return false;
            return true;
        });

        $scope.filteredTotal = $scope.filtered.reduce(function(s,e){ return s+parseFloat(e.amount); }, 0);
    };

    $scope.clearFilters = function() {
        $scope.search    = '';
        $scope.filterCat = '';
        $scope.filterDate= '';
        $scope.filterMon = '';
        $scope.applyFilters();
    };

    $scope.editExpense = function(id)   { $location.path('/edit-expense/' + id); };

    $scope.deleteExpense = function(id) {
        if (!confirm('Delete this expense?')) return;
        ExpenseService.delete(id).then(function() {
            $scope.expenses = $scope.expenses.filter(function(e){ return e.id !== id; });
            $scope.applyFilters();
        });
    };

    $scope.badgeClass = function(cat) { return 'badge-' + (cat||'other').toLowerCase(); };
    $scope.formatDate = function(d)   { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''; };

    $scope.downloadPDF = function() {
        if ($scope.filtered.length === 0) return alert('No data to download');
        var user = JSON.parse(localStorage.getItem('user') || '{}');
        var { jsPDF } = window.jspdf;
        var doc = new jsPDF();

        doc.setFillColor(99,102,241);
        doc.rect(0,0,210,28,'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(16); doc.setFont('helvetica','bold');
        doc.text('XpenseIQ — Expense Report', 14, 16);
        doc.setFontSize(9);
        doc.text((user.name||'') + '  |  ' + new Date().toLocaleDateString(), 14, 24);

        var row = 40;
        doc.setTextColor(0,0,0);
        doc.setFontSize(9); doc.setFont('helvetica','bold');
        doc.setFillColor(240,240,255);
        doc.rect(14,row-5,182,9,'F');
        doc.text('#',16,row); doc.text('Title',26,row); doc.text('Category',100,row); doc.text('Date',135,row); doc.text('Amount',170,row);
        row += 8;
        doc.setFont('helvetica','normal');
        var total = 0;
        $scope.filtered.forEach(function(e,i){
            if (row > 275) { doc.addPage(); row = 20; }
            if (i%2===0) { doc.setFillColor(250,250,255); doc.rect(14,row-5,182,8,'F'); }
            doc.text(String(i+1),16,row);
            doc.text(e.title.substring(0,28),26,row);
            doc.text(e.category,100,row);
            doc.text(e.expense_date?e.expense_date.split('T')[0]:'',135,row);
            doc.text('Rs.'+e.amount,170,row);
            total += parseFloat(e.amount);
            row += 8;
        });
        row += 4;
        doc.setFillColor(99,102,241); doc.rect(14,row-5,182,9,'F');
        doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
        doc.text('Total',100,row); doc.text('Rs.'+total.toLocaleString('en-IN'),170,row);
        doc.save('XpenseIQ_Report.pdf');
    };
});


// ── Reports Controller ────────────────────────────────────
app.controller('ReportsController', function($scope, ExpenseService) {

    $scope.expenses      = [];
    $scope.loading       = true;
    $scope.selectedMonth = new Date().toISOString().slice(0,7);
    $scope.months        = [];
    var reportChart      = null;

    // Build last 6 months list
    for (var i = 5; i >= 0; i--) {
        var d = new Date(); d.setMonth(d.getMonth() - i);
        var key   = d.toISOString().slice(0,7);
        var label = d.toLocaleString('default',{month:'long', year:'numeric'});
        $scope.months.push({ key: key, label: label });
    }

    ExpenseService.getAll().then(function(res) {
        $scope.expenses = res.data;
        $scope.loading  = false;
        $scope.buildReport();
    }).catch(function(){ $scope.loading = false; });

    $scope.selectMonth = function(key) {
        $scope.selectedMonth = key;
        $scope.buildReport();
    };

    $scope.buildReport = function() {
        var m     = $scope.selectedMonth;
        var month = $scope.expenses.filter(function(e){ return e.expense_date && e.expense_date.startsWith(m); });

        $scope.reportExpenses = month;
        $scope.reportTotal    = month.reduce(function(s,e){ return s+parseFloat(e.amount); },0);
        $scope.reportCount    = month.length;
        $scope.reportAvg      = month.length ? Math.round($scope.reportTotal / month.length) : 0;

        // Category breakdown
        var cats = {};
        month.forEach(function(e){ cats[e.category] = (cats[e.category]||0) + parseFloat(e.amount); });
        var sorted = Object.entries(cats).sort(function(a,b){ return b[1]-a[1]; });
        $scope.topCat = sorted[0] ? sorted[0][0] : '—';
        $scope.catBreakdown = sorted.map(function(item, i){
            return {
                name:    item[0],
                amount:  item[1],
                pct:     $scope.reportTotal ? Math.round((item[1]/$scope.reportTotal)*100) : 0,
                color:   COLORS[i % COLORS.length]
            };
        });

        // Chart
        setTimeout(function(){
            var ctx = document.getElementById('chart-report');
            if (!ctx) return;
            if (reportChart) reportChart.destroy();
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            reportChart = new Chart(ctx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: sorted.map(function(x){ return x[0]; }),
                    datasets: [{ data: sorted.map(function(x){ return x[1]; }), backgroundColor: COLORS, borderWidth: 0 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position:'bottom', labels: { color: isDark?'#eef0f8':'#0f1629', padding:14, font:{family:'Sora',size:12} } } }
                }
            });
        }, 100);
    };

    $scope.badgeClass = function(cat) { return 'badge-'+(cat||'other').toLowerCase(); };
    $scope.formatDate = function(d)   { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : ''; };

    $scope.downloadPDF = function() {
        if ($scope.reportExpenses.length === 0) return alert('No expenses for this month');
        var user = JSON.parse(localStorage.getItem('user') || '{}');
        var { jsPDF } = window.jspdf;
        var doc = new jsPDF();
        var month = $scope.months.find(function(m){ return m.key === $scope.selectedMonth; });

        doc.setFillColor(99,102,241); doc.rect(0,0,210,28,'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(16); doc.setFont('helvetica','bold');
        doc.text('XpenseIQ — ' + (month?month.label:$scope.selectedMonth), 14, 16);
        doc.setFontSize(9);
        doc.text((user.name||'') + '  |  ' + new Date().toLocaleDateString(), 14, 24);

        var row = 40; var total = 0;
        doc.setTextColor(0,0,0); doc.setFontSize(9); doc.setFont('helvetica','bold');
        doc.setFillColor(240,240,255); doc.rect(14,row-5,182,9,'F');
        doc.text('#',16,row); doc.text('Title',26,row); doc.text('Category',100,row); doc.text('Date',135,row); doc.text('Amount',170,row);
        row += 8; doc.setFont('helvetica','normal');
        $scope.reportExpenses.forEach(function(e,i){
            if (row>275){ doc.addPage(); row=20; }
            if (i%2===0){ doc.setFillColor(250,250,255); doc.rect(14,row-5,182,8,'F'); }
            doc.text(String(i+1),16,row); doc.text(e.title.substring(0,28),26,row);
            doc.text(e.category,100,row); doc.text(e.expense_date?e.expense_date.split('T')[0]:'',135,row);
            doc.text('Rs.'+e.amount,170,row); total+=parseFloat(e.amount); row+=8;
        });
        row+=4; doc.setFillColor(99,102,241); doc.rect(14,row-5,182,9,'F');
        doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
        doc.text('Total',100,row); doc.text('Rs.'+total.toLocaleString('en-IN'),170,row);
        doc.save('XpenseIQ_' + $scope.selectedMonth + '.pdf');
    };
});
