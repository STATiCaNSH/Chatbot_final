import { auth, db, rtdb } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Make functions globally accessible
window.sendMessage = sendMessage;
window.handleKeyPress = handleKeyPress;
window.logout = logout;
window.toggleMenu = toggleMenu;

let currentUser = null;

async function loadChatHistory() {
    try {
        if (!currentUser) {
            console.error('No user logged in');
            return;
        }

        showLoadingIndicator();
        
        // Try to get messages from Realtime Database
        try {
            const sanitizedEmail = currentUser.email.replace(/\./g, '_');
            const userRef = ref(rtdb, `users/${sanitizedEmail}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                const userData = snapshot.val();
                
                if (userData.messages) {
                    const chatMessages = document.getElementById('chatMessages');
                    chatMessages.innerHTML = '';
                    
                    // Split messages by comma and trim whitespace
                    const userMessages = userData.messages.split(',').map(msg => msg.trim());
                    
                    // Add each user message and get AI response
                    for (const message of userMessages) {
                        // Add user message
                        addMessage(message, true, false);
                        
                        try {
                            // Get actual AI response for each message
                            const response = await fetch(`https://deployment-navy-five.vercel.app/callai?message=${encodeURIComponent(message)}`, {
                                method: 'GET'
                            });
                            
                            const data = await response.json();
                            addMessage(data, false, false);
                        } catch (error) {
                            addMessage("I processed your message: " + message, false, false);
                        }
                    }
                    
                    removeLoadingIndicator();
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    return;
                }
            }
        } catch (rtdbError) {
            console.error('Error loading messages from Realtime Database:', rtdbError);
        }
        
        removeLoadingIndicator();
        addMessage('Hello! How can I help you today?', false, true);
        
    } catch (error) {
        console.error('Error loading chat history:', error);
        removeLoadingIndicator();
        addMessage('Hello! How can I help you today?', false, true);
    }
}

async function saveChatMessage(message, isUser) {
    try {
        if (!currentUser) {
            console.error('No user logged in');
            return;
        }
        
        // Only save user messages to Realtime Database
        if (isUser) {
            try {
                const sanitizedEmail = currentUser.email.replace(/\./g, '_');
                const userRef = ref(rtdb, `users/${sanitizedEmail}`);
                
                // Get current user data
                const snapshot = await get(userRef);
                const userData = snapshot.exists() ? snapshot.val() : {};
                
                // Update messages and lastMessage
                const updatedData = {
                    ...userData,
                    messages: userData.messages ? userData.messages + ', ' + message : message,
                    lastMessage: message,
                    lastActive: new Date().toISOString()
                };
                
                // Save to database
                await set(userRef, updatedData);
                
            } catch (dbError) {
                console.error('Error saving to Realtime Database:', dbError);
            }
        }
    } catch (error) {
        console.error('Error in saveChatMessage:', error);
    }
}

function addMessage(message, isUser, shouldSave = true) {
    addMessageWithTimestamp(message, isUser, shouldSave, new Date());
}

function showLoadingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.id = 'loadingIndicator';
    
    loadingDiv.innerHTML = `
        <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message === '') return;

    try {
        // Add user message to chat
        addMessage(message, true);
        messageInput.value = '';

        // Show loading indicator
        showLoadingIndicator();

        // Get bot response
        const response = await fetch(`https://deployment-navy-five.vercel.app/callai?message=${encodeURIComponent(message)}`, {
            method: 'GET'
        });
        
        const data = await response.json();
        console.log('Bot response:', data);
        
        // Remove loading indicator
        removeLoadingIndicator();
        
        // Add bot response to chat
        addMessage(data, false);
    } catch (error) {
        console.error('Error in sendMessage:', error);
        removeLoadingIndicator();
        addMessage('Sorry, I encountered an error processing your request.', false);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function logout() {
    try {
        await signOut(auth);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userDescription');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Initialize chat when document loads
document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(async function(user) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = user;
        try {
            await loadChatHistory();
            await checkProfileCompletion();
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            removeLoadingIndicator();
        }
    });
}); 

// Update addMessageWithTimestamp to handle errors better
function addMessageWithTimestamp(message, isUser, shouldSave = true, timestamp = new Date()) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const formattedMessage = String(message).replace(/\n/g, '<br>');
    
    // Create message content wrapper
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = formattedMessage;
    
    // Create timestamp element
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    const messageTime = timestamp instanceof Date ? timestamp : new Date(timestamp);
    timestampDiv.textContent = messageTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timestampDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (shouldSave && currentUser) {
        saveChatMessage(message, isUser)
            .catch(error => {
                console.error('Failed to save message, but continuing:', error);
            });
    }
} 

function toggleMenu() {
    const dropdown = document.getElementById('menuDropdown');
    dropdown.classList.toggle('show');
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!e.target.closest('.menu-container')) {
            dropdown.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        }
    });
} 

async function checkProfileCompletion() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const sanitizedEmail = user.email.replace(/\./g, '_');
        const userRef = ref(rtdb, `users/${sanitizedEmail}/personalQuestions`);
        const snapshot = await get(userRef);

        const isComplete = snapshot.exists() && checkAllFieldsFilled(snapshot.val());
        updateProfileBadge(!isComplete);

    } catch (error) {
        console.error('Error checking profile completion:', error);
    }
}

function checkAllFieldsFilled(personalQuestions) {
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

function updateProfileBadge(show) {
    const badge = document.getElementById('profileBadge');
    const menuBadge = document.querySelector('.menu-badge');
    
    if (show) {
        badge?.classList.add('show');
        menuBadge?.classList.add('show');
    } else {
        badge?.classList.remove('show');
        menuBadge?.classList.remove('show');
    }
} 

// Add this function to test database access
window.testDatabase = async function() {
    try {
        if (!auth.currentUser) {
            console.error('No user logged in');
            return;
        }
        
        const email = auth.currentUser.email;
        const sanitizedEmail = email.replace(/\./g, '_');
        console.log('Testing database for user:', email);
        
        // Test writing to Realtime Database
        const testRef = ref(rtdb, `users/${sanitizedEmail}/testField`);
        await set(testRef, {
            timestamp: new Date().toISOString(),
            testValue: 'This is a test'
        });
        
        console.log('Test write successful!');
        
        // Verify the write
        const snapshot = await get(ref(rtdb, `users/${sanitizedEmail}`));
        console.log('User data after test:', snapshot.val());
        
        return 'Test completed successfully';
    } catch (error) {
        console.error('Test failed:', error);
        return 'Test failed: ' + error.message;
    }
}; 