let currentSlideIndex = 1;

// Check if user should see onboarding
function checkOnboardingAccess() {
    console.log('Checking onboarding access');
    const isNewUser = localStorage.getItem('isNewUser') === 'true';
    console.log('Is new user:', isNewUser);
    
    if (!isNewUser) {
        console.log('Not a new user, redirecting to chat');
        window.location.href = 'index.html';
    }
}

function showSlide(n) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (n > slides.length) currentSlideIndex = 1;
    if (n < 1) currentSlideIndex = slides.length;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[currentSlideIndex - 1].classList.add('active');
    dots[currentSlideIndex - 1].classList.add('active');
}

function currentSlide(n) {
    showSlide(currentSlideIndex = n);
}

function proceedToChat() {
    // Clear the new user flag before proceeding
    localStorage.removeItem('isNewUser');
    window.location.href = 'index.html';
}

// Auto advance slides every 5 seconds
setInterval(() => {
    currentSlide(currentSlideIndex + 1);
}, 5000);

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Onboarding page loaded');
    checkOnboardingAccess();
    showSlide(currentSlideIndex);
}); 