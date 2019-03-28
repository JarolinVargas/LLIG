const toggleNavBtn = document.querySelector('#toggle-mobile-nav');
toggleNavBtn.addEventListener('click', toggleMobileNav);

function toggleMobileNav() {
    const bodyClassList = document.body.classList;
    bodyClassList.contains('mobile-nav-visible') ? bodyClassList.remove('mobile-nav-visible') : bodyClassList.add('mobile-nav-visible');
}