const PERMISSION_KEYS = {
    addProduct: "إضافة منتج جديد",
    editProduct: "تعديل بيانات منتج",
    deleteProduct: "حذف منتج",
    hideAccessories: "إخفاء قسم الإكسسوارات",
    hideOffers: "إخفاء قسم العروض والتنزيلات",
    hideCustom: "إخفاء قسم توصيات على الطلب",
    hideGames: "إخفاء قسم الألعاب",
    hideGifts: "إخفاء قسم الهدايا",
    hideFinancial: "إخفاء التقرير المالي",
    hideVisitors: "إخفاء عدد زوار الموقع",
    hideCustomers: "إخفاء عدد الزبائن المسجلين",
    banCustomer: "حظر زبون"
};

let employees = JSON.parse(localStorage.getItem('app_employees')) || [];
let customers = JSON.parse(localStorage.getItem('app_customers')) || [
    { id: 1, name: "محمد أحمد", phone: "0911111111" },
    { id: 2, name: "عمر خالد", phone: "0922222222" }
];
let blacklist = JSON.parse(localStorage.getItem('app_blacklist')) || [];
let products = JSON.parse(localStorage.getItem('app_products')) || [
    { id: 1, name: "خاتم فضة", category: "الإكسسوارات", buyPrice: 15000, sellPrice: 25000, qty: 10 },
    { id: 2, name: "سلسلة ذهبية", category: "الإكسسوارات", buyPrice: 40000, sellPrice: 60000, qty: 5 },
    { id: 3, name: "صندوق هدية راقي", category: "الهدايا", buyPrice: 5000, sellPrice: 10000, qty: 15 },
    { id: 4, name: "لعبة شطرنج خشبية", category: "الألعاب", buyPrice: 20000, sellPrice: 35000, qty: 8 }
];

let currentUserRole = localStorage.getItem('app_current_role') || null;
let currentDisplayName = localStorage.getItem('app_display_name') || "";
let carouselTimer = null;
let currentSlideIndex = 0;

function initApp() {
    initTheme();
    try {
        if (currentUserRole && currentUserRole !== 'null') {
            setupUserSession(currentDisplayName, false);
            if (currentUserRole === 'employee') {
                const foundEmp = employees.find(e => e.username === currentDisplayName);
                if (foundEmp) applyEmployeePermissions(foundEmp);
            }
        } else {
            logout();
        }
    } catch (err) {
        logout();
    }
}

function initCarouselAutoPlay() {
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = setInterval(() => {
        const slides = document.querySelectorAll('.carousel-slides-wrapper .carousel-slide');
        if (slides.length === 0) return;
        slides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        slides[currentSlideIndex].classList.add('active');
        updateDotsUI(currentSlideIndex);
    }, 3000);
}

function currentSlide(index) {
    const slides = document.querySelectorAll('.carousel-slides-wrapper .carousel-slide');
    if (slides.length === 0) return;
    slides[currentSlideIndex].classList.remove('active');
    currentSlideIndex = index;
    slides[currentSlideIndex].classList.add('active');
    updateDotsUI(index);
    initCarouselAutoPlay();
}

function updateDotsUI(index) {
    const dots = document.querySelectorAll('.carousel-dots .dot');
    dots.forEach((dot, idx) => {
        if (idx === index) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeUI(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateThemeUI(false);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('app_theme', isDark ? 'dark' : 'light');
    updateThemeUI(isDark);
}

function updateThemeUI(isDark) {
    const themeIcon = document.getElementById('theme-btn-icon');
    if (themeIcon) {
        themeIcon.innerText = isDark ? '☀️' : '🌙';
    }
}

document.addEventListener('DOMContentLoaded', initApp);

function handleMenuOrExit() {
    if (currentUserRole === 'admin' || currentUserRole === 'employee') {
        toggleMenu();
    } else {
        logout();
    }
}

function enterAsVisitor() {
    currentUserRole = 'visitor';
    currentDisplayName = 'زائر كريم';
    saveSessionToStorage();
    setupUserSession(currentDisplayName, true);
}

function handleFloatingSearchInput(input) {
    const icon = document.getElementById('floating-search-icon');
    if (icon) icon.style.display = input.value.trim() !== "" ? 'none' : 'block';
    const searchInputView = document.getElementById('search-input');
    if (searchInputView) {
        searchInputView.value = input.value;
        performSearch();
    }
}

function clearLoginError() {
    const errorMsg = document.getElementById('login-error');
    if (errorMsg) errorMsg.classList.add('hidden');
    document.getElementById('login-user').classList.remove('input-error');
    document.getElementById('login-pass').classList.remove('input-error');
}

function login() {
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');
    const errorMsg = document.getElementById('login-error');
    const user = userInput.value.trim();
    const pass = passInput.value.trim();

    if (user === 'admin' && pass === '1234') {
        currentUserRole = 'admin';
        currentDisplayName = "المدير (admin)";
        saveSessionToStorage();
        setupUserSession(currentDisplayName, true);
        return;
    }

    const foundEmp = employees.find(e => e.username === user && e.password === pass);
    if (foundEmp) {
        currentUserRole = 'employee';
        currentDisplayName = foundEmp.username;
        saveSessionToStorage();
        setupUserSession(currentDisplayName, true);
        applyEmployeePermissions(foundEmp);
        return;
    }

    if (user !== "") {
        currentUserRole = 'customer';
        currentDisplayName = user;
        saveSessionToStorage();
        setupUserSession(currentDisplayName, true);
        return;
    }

    userInput.classList.add('input-error');
    passInput.classList.add('input-error');
    if (errorMsg) errorMsg.classList.remove('hidden');
}

function saveSessionToStorage() {
    localStorage.setItem('app_current_role', currentUserRole);
    localStorage.setItem('app_display_name', currentDisplayName);
}

function forgotPassword() {
    alert('يرجى التواصل مع مدير النظام لإعادة ضبط كلمة المرور الخاصة بك.');
}

function setupUserSession(displayName, navigateStore = true) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-display-name').innerText = displayName;

    const menuBtnIcon = document.getElementById('menu-btn-icon');
    const smartBtn = document.getElementById('smart-topbar-btn');

    const adminStats = document.getElementById('admin-stats-wrapper');
    const adminItems = document.querySelectorAll('.admin-only-item');

    if (currentUserRole === 'admin' || currentUserRole === 'employee') {
        if (adminStats && currentUserRole === 'admin') adminStats.classList.remove('hidden');
        adminItems.forEach(item => item.style.display = currentUserRole === 'admin' ? 'block' : 'none');
        if (menuBtnIcon) menuBtnIcon.innerText = '☰';
        if (smartBtn) smartBtn.title = 'القائمة الرئيسية';
    } else {
        if (adminStats) adminStats.classList.add('hidden');
        if (menuBtnIcon) menuBtnIcon.innerText = '🚪';
        if (smartBtn) smartBtn.title = 'تسجيل الخروج';
    }

    updateCustomerCount();
    renderEmployeesList();
    if (navigateStore) navigateTo('store');
    initCarouselAutoPlay();
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('hidden');
    document.getElementById('menu-overlay').classList.toggle('hidden');
}

function navigateTo(viewName) {
    const views = ['store', 'search', 'add-product', 'add-employee', 'employees', 'customers', 'blacklist'];
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    if (viewName === 'store') backToCategories();
    if (viewName === 'employees') renderEmployeesList();
    
    const sideMenu = document.getElementById('side-menu');
    if (sideMenu && !sideMenu.classList.contains('hidden')) toggleMenu();
}

function openCategoryProducts(categoryName) {
    const titleElem = document.getElementById('current-category-title');
    const container = document.getElementById('store-products-list');
    const prodView = document.getElementById('store-category-products-view');

    if (titleElem) titleElem.innerText = `قسم: ${categoryName}`;

    const filtered = products.filter(p => p.category === categoryName);

    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-products-msg">لا توجد منتجات متوفرة في هذا القسم حالياً.</p>';
    } else {
        let tableHtml = `
            <div class="products-table-container">
                <table class="products-custom-table">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>السعر</th>
                            <th>الكمية المتوفرة</th>
                            <th>الطلب</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filtered.forEach(p => {
            const availableQty = (p.qty !== undefined) ? p.qty : ((p.quantity !== undefined) ? p.quantity : 0);
            tableHtml += `
                <tr>
                    <td class="prod-name-cell">📦 <b>${p.name}</b></td>
                    <td class="prod-price-cell">${p.sellPrice.toLocaleString()} ل.س</td>
                    <td class="prod-qty-cell">
                        <span class="qty-badge ${availableQty > 0 ? 'in-stock' : 'out-stock'}">
                            ${availableQty > 0 ? availableQty + ' قطعة' : 'نفدت الكمية'}
                        </span>
                    </td>
                    <td class="prod-action-cell">
                        <button class="btn-primary btn-order-item" onclick="requestCheckoutProduct(${p.id})" ${availableQty <= 0 ? 'disabled' : ''}>
                            🛒 اطلب المنتج
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHtml += `
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    }

    if (prodView) prodView.classList.remove('hidden');
}

function backToCategories() {
    const prodView = document.getElementById('store-category-products-view');
    if (prodView) prodView.classList.add('hidden');
}

function requestCheckoutProduct(productId) {
    // تصفير الخيارات وإعادة الحقول للوضع الافتراضي عند فتح النافذة
    document.getElementById('reg-governorate').selectedIndex = 0;
    document.getElementById('reg-country').value = '';
    document.getElementById('country-container').classList.add('hidden');
    
    document.getElementById('customer-register-modal').classList.remove('hidden');
}

function closeCustomerRegisterModal() {
    document.getElementById('customer-register-modal').classList.add('hidden');
}

// دالة فحص خيار المحافظة وحالة خيار "أخرى"
function checkGovernorateSelection() {
    const govSelect = document.getElementById('reg-governorate');
    const countryContainer = document.getElementById('country-container');
    if (govSelect.value === 'أخرى') {
        countryContainer.classList.remove('hidden');
    } else {
        countryContainer.classList.add('hidden');
        document.getElementById('reg-country').value = '';
    }
}

function submitCustomerRegistration() {
    const fullname = document.getElementById('reg-fullname').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const idType = document.getElementById('reg-id-type').value;
    const governorate = document.getElementById('reg-governorate').value;
    const country = document.getElementById('reg-country').value.trim();
    const addressDetails = document.getElementById('reg-address-details').value.trim();

    if (!fullname) {
        alert('يرجى إدخال الاسم الثلاثي.');
        return;
    }
    if (!phone.startsWith('09') || phone.length < 10) {
        alert('رقم الهاتف/الواتساب غير صحيح، يجب أن يبدأ بـ 09 ويتكون من 10 أرقام على الأقل.');
        return;
    }
    if (!idType) {
        alert('يرجى اختيار نوع الإثبات الشخصي.');
        return;
    }
    if (!governorate) {
        alert('يرجى اختيار المحافظة.');
        return;
    }
    if (governorate === 'أخرى' && !country) {
        alert('يرجى إدخال اسم الدولة المقيم فيها.');
        return;
    }
    if (!addressDetails) {
        alert('يرجى إدخال الشرح التوضيحي للعنوان.');
        return;
    }

    const newCustomerObj = {
        id: Date.now(),
        name: fullname,
        phone: phone,
        idType: idType,
        governorate: governorate === 'أخرى' ? country : governorate,
        addressDetails: addressDetails
    };

    customers.push(newCustomerObj);
    localStorage.setItem('app_customers', JSON.stringify(customers));

    currentUserRole = 'customer';
    currentDisplayName = fullname;
    saveSessionToStorage();
    
    document.getElementById('user-display-name').innerText = currentDisplayName;
    closeCustomerRegisterModal();
    updateCustomerCount();
    
    alert('تم إنشاء حساب الزبون وتثبيت طلبك بنجاح! أهلاً بك.');
    navigateTo('store');
}

function createEmployee() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();

    if (!username || !password) {
        alert('يرجى إدخال اسم المستخدم وكلمة المرور للموظف.');
        return;
    }

    const permissions = {
        addProduct: document.getElementById('perm-add-product')?.checked || false,
        editProduct: document.getElementById('perm-edit-product')?.checked || false,
        deleteProduct: document.getElementById('perm-delete-product')?.checked || false,
        hideAccessories: document.getElementById('perm-hide-accessories')?.checked || false,
        hideOffers: document.getElementById('perm-hide-offers')?.checked || false,
        hideCustom: document.getElementById('perm-hide-custom')?.checked || false,
        hideGames: document.getElementById('perm-hide-games')?.checked || false,
        hideGifts: document.getElementById('perm-hide-gifts')?.checked || false,
        hideFinancial: document.getElementById('perm-hide-financial')?.checked || false,
        hideVisitors: document.getElementById('perm-hide-visitors')?.checked || false,
        hideCustomers: document.getElementById('perm-hide-customers')?.checked || false,
        banCustomer: document.getElementById('perm-ban-customer')?.checked || false
    };

    employees.push({ id: Date.now(), username, password, permissions });
    localStorage.setItem('app_employees', JSON.stringify(employees));

    alert('تم إنشاء حساب الموظف مع صلاحياته بنجاح!');
    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    
    document.querySelectorAll('.permissions-grid input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    renderEmployeesList();
    navigateTo('employees');
}

function renderEmployeesList() {
    const container = document.getElementById('employees-list');
    if (!container) return;
    container.innerHTML = '';

    if (employees.length === 0) {
        container.innerHTML = '<p class="hint">لا يوجد موظفين مضافين حالياً.</p>';
        return;
    }

    employees.forEach((emp) => {
        if (!emp.permissions) emp.permissions = {};
        
        let permHTML = '';
        for (const [key, label] of Object.entries(PERMISSION_KEYS)) {
            const isChecked = emp.permissions[key] ? 'checked' : '';
            permHTML += `
                <div class="switch-label">
                    <span>${label}</span>
                    <input type="checkbox" ${isChecked} onchange="togglePermission(${emp.id}, '${key}')">
                </div>
            `;
        }

        container.innerHTML += `
            <div class="user-card" style="display:block; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        👤 <b>المستخدم: ${emp.username}</b><br>
                        <span style="font-size: 12px; color: var(--text-muted);">كلمة المرور: ${emp.password}</span>
                    </div>
                    <button class="btn-primary btn-danger" onclick="deleteEmployee(${emp.id})" style="width:auto; padding:6px 12px; font-size:12px;">حذف الحساب</button>
                </div>
                <p class="hint" style="font-weight:700; margin-top:8px;">تعديل صلاحيات الموظف:</p>
                <div class="permissions-grid">
                    ${permHTML}
                </div>
            </div>`;
    });
}

function togglePermission(empId, permKey) {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
        if (!emp.permissions) emp.permissions = {};
        emp.permissions[permKey] = !emp.permissions[permKey];
        localStorage.setItem('app_employees', JSON.stringify(employees));
    }
}

function deleteEmployee(empId) {
    employees = employees.filter(e => e.id !== empId);
    localStorage.setItem('app_employees', JSON.stringify(employees));
    renderEmployeesList();
}

function applyEmployeePermissions(employee) {
    const perms = employee.permissions || {};
    const catAccessories = document.getElementById('cat-accessories');
    const catOffers = document.getElementById('cat-offers');
    const catCustom = document.getElementById('cat-custom-orders');
    const catGames = document.getElementById('cat-games');
    const catGifts = document.getElementById('cat-gifts');

    if (catAccessories) catAccessories.style.display = perms.hideAccessories ? 'none' : 'flex';
    if (catOffers) catOffers.style.display = perms.hideOffers ? 'none' : 'flex';
    if (catCustom) catCustom.style.display = perms.hideCustom ? 'none' : 'flex';
    if (catGames) catGames.style.display = perms.hideGames ? 'none' : 'flex';
    if (catGifts) catGifts.style.display = perms.hideGifts ? 'none' : 'flex';
}

function updateCustomerCount() {
    const custCard = document.querySelector('#customers-card .stat-value');
    if (custCard) custCard.innerText = `${customers.length}`;
}

function performSearch() {
    const type = document.getElementById('search-type').value;
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    if (type === 'product') {
        const filtered = products.filter(p => p.name.toLowerCase().includes(query));
        filtered.forEach(p => {
            resultsContainer.innerHTML += `<div class="user-card">📦 <b>${p.name}</b> - السعر: ${p.sellPrice} ل.س</div>`;
        });
    } else if (type === 'customer') {
        const filtered = customers.filter(c => c.name.toLowerCase().includes(query));
        filtered.forEach(c => {
            resultsContainer.innerHTML += `<div class="user-card">👤 <b>${c.name}</b> - 📞 ${c.phone}</div>`;
        });
    }
}

function addNewProduct() {
    const name = document.getElementById('new-prod-name').value.trim();
    const category = document.getElementById('new-prod-cat').value;
    const buyPrice = parseFloat(document.getElementById('new-prod-buy-price').value) || 0;
    const sellPrice = parseFloat(document.getElementById('new-prod-sell-price').value) || 0;
    const qty = parseInt(document.getElementById('new-prod-qty').value) || 0;

    if (!name) {
        alert('يرجى إدخال اسم المنتج.');
        return;
    }
    products.push({ id: Date.now(), name, category, buyPrice, sellPrice, qty });
    localStorage.setItem('app_products', JSON.stringify(products));
    alert('تم إضافة المنتج بنجاح!');
}

function logout() {
    if (carouselTimer) {
        clearInterval(carouselTimer);
        carouselTimer = null;
    }
    localStorage.removeItem('app_current_role');
    localStorage.removeItem('app_display_name');
    currentUserRole = null;
    currentDisplayName = "";

    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('side-menu').classList.add('hidden');
    document.getElementById('menu-overlay').classList.add('hidden');
}