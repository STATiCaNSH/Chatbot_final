import { auth, rtdb } from './firebase-config.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(async function(user) {
        if (!user) {
            console.log('No user found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log('Loading profile for user:', user.email);
            showLoadingState();
            
            // Get user data from Firebase Realtime Database
            const sanitizedEmail = user.email.replace(/\./g, '_');
            console.log('Sanitized email:', sanitizedEmail);
            
            const userRef = ref(rtdb, `users/${sanitizedEmail}`);
            console.log('Attempting to fetch data from:', `users/${sanitizedEmail}`);
            
            const snapshot = await get(userRef);
            console.log('Got snapshot:', snapshot.exists(), snapshot.val());

            if (!snapshot.exists()) {
                console.log('No data found for user');
                throw new Error('User data not found');
            }

            const userData = snapshot.val();
            console.log('User data:', userData);
            
            // Update profile information
            document.getElementById('userName').textContent = userData.name || 'N/A';
            document.getElementById('userEmail').textContent = userData.email || 'N/A';
            document.getElementById('userDescription').textContent = userData.description || 'No description available';
            
            // Format dates
            const createdDate = userData.createdAt ? new Date(userData.createdAt) : new Date();
            const lastLoginDate = userData.lastLogin ? new Date(userData.lastLogin) : new Date();
            
            document.getElementById('createdAt').textContent = createdDate.toLocaleDateString();
            document.getElementById('lastLogin').textContent = lastLoginDate.toLocaleDateString();

            // Load personal questions if they exist and update completion indicator
            const isComplete = checkProfileCompletion(userData.personalQuestions);
            updateCompletionIndicator(isComplete);

            if (userData.personalQuestions) {
                const form = document.getElementById('personalQuestionsForm');
                Object.entries(userData.personalQuestions).forEach(([key, value]) => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input && key !== 'lastUpdated') {
                        input.value = value;
                    }
                });
            }

            hideLoadingState();
            console.log('Profile loaded successfully');

        } catch (error) {
            console.error('Error loading profile:', error);
            console.error('Full error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            showError('Failed to load profile data. Please try again later.');
            hideLoadingState();
        }
    });
});

function showLoadingState() {
    const elements = ['userName', 'userEmail', 'userDescription', 'createdAt', 'lastLogin'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        element.textContent = 'Loading...';
        element.classList.add('loading');
    });
}

function hideLoadingState() {
    const elements = document.querySelectorAll('.loading');
    elements.forEach(element => {
        element.classList.remove('loading');
    });
}

function showError(message) {
    // Remove any existing error messages first
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    const container = document.querySelector('.profile-container');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    container.prepend(errorDiv);
}

// Add form submission handler
document.getElementById('personalQuestionsForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const saveButton = this.querySelector('.save-btn');
    saveButton.disabled = true;
    saveButton.classList.add('loading');
    saveButton.innerHTML = '<span class="material-icons">hourglass_empty</span>Saving...';

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        const formData = new FormData(this);
        const personalQuestions = {
            groupBehavior: formData.get('groupBehavior'),
            disagreementHandling: formData.get('disagreementHandling'),
            stressManagement: formData.get('stressManagement'),
            favoriteHobby: formData.get('favoriteHobby'),
            favoriteSeason: formData.get('favoriteSeason'),
            favoriteColor: formData.get('favoriteColor'),
            lastUpdated: new Date().toISOString()
        };

        const sanitizedEmail = user.email.replace(/\./g, '_');
        const userRef = ref(rtdb, `users/${sanitizedEmail}/personalQuestions`);
        
        await set(userRef, personalQuestions);
        
        // Check completion and update indicator after saving
        const isComplete = checkProfileCompletion(personalQuestions);
        updateCompletionIndicator(isComplete);
        
        showSuccess('Answers saved successfully!');
        
    } catch (error) {
        console.error('Error saving answers:', error);
        showError('Failed to save answers. Please try again.');
    } finally {
        saveButton.disabled = false;
        saveButton.classList.remove('loading');
        saveButton.innerHTML = '<span class="material-icons">save</span>Save Answers';
    }
});

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message show';
    successDiv.textContent = message;
    
    const form = document.getElementById('personalQuestionsForm');
    form.insertBefore(successDiv, form.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Add this function to check if personal questions are complete
function checkProfileCompletion(personalQuestions) {
    if (!personalQuestions) return false;
    
    const requiredFields = [
        'groupBehavior',
        'disagreementHandling',
        'stressManagement',
        'favoriteHobby',
        'favoriteSeason',
        'favoriteColor'
    ];
    
    return requiredFields.every(field => 
        personalQuestions[field] && personalQuestions[field].trim() !== ''
    );
}

// Add this function to update the indicator
function updateCompletionIndicator(isComplete) {
    const indicator = document.getElementById('profileCompletion');
    if (isComplete) {
        indicator.classList.add('hidden');
    } else {
        indicator.classList.remove('hidden');
    }
} 