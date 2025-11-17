(function(){
    const nav = document.getElementById('nav-container') || document.querySelector('header nav');
    if (!nav) return;
  
    // Remove any existing auth UI or duplicate Login links
    nav.querySelectorAll('.auth-ui').forEach(el => el.remove());
    nav.querySelectorAll('a[href*="404NotFoundLogin.html"]').forEach(el => el.remove());
  
    const auth = JSON.parse(localStorage.getItem('auth') || 'null');
    const span = document.createElement('span');
    span.className = 'auth-ui';
    span.style.marginLeft = '12px';
  
    if (auth) {
      let extra = '';
      if (auth.role === 'organizer') {
        extra = `<a href="organizer.html" class="btn-secondary" style="margin-left:8px;">Dashboard</a>`;
      } else if (auth.role === 'user') {
        extra = `<a href="user.html" class="btn-secondary" style="margin-left:8px;">My Profile</a>`;
      } else if (auth.role === 'admin') {
        extra = `<a href="AdminManagement.html" class="btn-secondary" style="margin-left:8px;">Admin Panel</a>`;
      }
  
      span.innerHTML = `
        <span style="padding:6px 10px;border:1px solid #ddd;border-radius:999px;font-size:.9rem;">
          ${auth.role?.toUpperCase() || 'USER'}
        </span>
        ${extra}
        <button id="logoutBtn" class="btn-secondary" style="margin-left:8px;">Logout</button>`;
    } else {
      span.innerHTML = `<a href="404NotFoundLogin.html" class="btn-secondary">Login</a>`;
    }
  
    nav.appendChild(span);
  
    // Only log out when clicking the actual Logout button
    nav.addEventListener('click', e => {
      if (e.target.id === 'logoutBtn') {
        e.preventDefault();
        localStorage.removeItem('auth');
        location.href = 'index.html';
      }
    });
  })();


