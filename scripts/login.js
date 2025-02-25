import { auth, rtdb } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Make functions globally accessible
window.switchTab = switchTab;
window.login = login;
window.signup = signup;

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.tab');
    
    if (tab === 'login') {
        loginForm.style.display = 'block';
        signupForm.style.display = 'none';
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
    
    document.getElementById('errorMessage').textContent = '';
}

async function login() {
    const loginButton = document.querySelector('#loginForm .btn-primary');
    setButtonLoading(loginButton, true);

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        localStorage.setItem('userToken', await user.getIdToken());
        window.location.href = 'index.html';
    } catch (error) {
        document.getElementById('errorMessage').textContent = 'Invalid email or password';
        console.error(error);
        setButtonLoading(loginButton, false);
    }
}

async function signup() {
    const signupButton = document.querySelector('#signupForm .btn-primary');
    setButtonLoading(signupButton, true);

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const description = document.getElementById('userDescription').value;

    if (password !== confirmPassword) {
        document.getElementById('errorMessage').textContent = 'Passwords do not match';
        setButtonLoading(signupButton, false);
        return;
    }

    try {
        // First create the authentication user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        await updateProfile(user, {
            displayName: name
        });

        // Wait a moment to ensure authentication is complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Prepare user data
        const userData = {
            name: name,
            email: email,
            description: description,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            uid: user.uid,
            messages: "" // Initialize empty messages string
        };

        console.log('Current user:', auth.currentUser?.uid);
        console.log('Attempting to save user data:', userData);

        // Sanitize the email to be used as a key (replace dots with underscores)
        const sanitizedEmail = email.replace(/\./g, '_');
        
        // Save to Realtime Database under users/[email]
        const userRef = ref(rtdb, `users/${sanitizedEmail}`);
        
        try {
            await set(userRef, userData);
            console.log('User data saved successfully to path:', `users/${sanitizedEmail}`);
            console.log('Saved user data:', userData);
            
            // Store necessary data in localStorage
            localStorage.setItem('userDescription', description);
            localStorage.setItem('isNewUser', 'true');
            localStorage.setItem('userToken', await user.getIdToken());

            window.location.href = 'onboarding.html';
        } catch (dbError) {
            console.error('Database save error:', dbError);
            // If database save fails, still allow user to continue
            console.log('Continuing despite database error');
            localStorage.setItem('userDescription', description);
            localStorage.setItem('isNewUser', 'true');
            localStorage.setItem('userToken', await user.getIdToken());
            window.location.href = 'onboarding.html';
        }
    } catch (error) {
        let errorMessage = 'An error occurred during signup.';
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'This email is already registered.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'Password should be at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Please enter a valid email address.';
        } else {
            console.error('Detailed error:', error);
            errorMessage = `Signup error: ${error.message}`;
        }
        
        document.getElementById('errorMessage').textContent = errorMessage;
        console.error('Signup error:', error);
        setButtonLoading(signupButton, false);
    }
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.classList.add('btn-loading');
        const originalContent = button.innerHTML;
        button.setAttribute('data-original-content', originalContent);
        button.innerHTML = `
            <span class="spinner"></span>
            <span>Please wait...</span>
        `;
        button.disabled = true;
    } else {
        button.classList.remove('btn-loading');
        const originalContent = button.getAttribute('data-original-content');
        button.innerHTML = originalContent;
        button.disabled = false;
    }
} 