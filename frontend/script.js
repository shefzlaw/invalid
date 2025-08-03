// Backend API Configuration
const BACKEND_URL = 'https://healthquiz-backend.onrender.com';
const FREE_USER_LIMIT = 20;
const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes

// State
let currentUser = '';
let currentSessionId = '';
let currentDepartment = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let timer = null;
let userScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}');
let submissionData = {};
let isFreeUser = true;
let selectedDeptForQuiz = '';
let lastActivity = Date.now();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const loadingScreen = document.getElementById('loading-screen');
const departmentScreen = document.getElementById('department-screen');
const quizScreen = document.getElementById('quiz-screen');

// Auth Tabs
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const gotoLogin = document.getElementById('goto-register');
const gotoRegister = document.getElementById('goto-login');

// Login Fields
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// Register Fields
const newUsernameInput = document.getElementById('new-username');
const newPasswordInput = document.getElementById('new-password');
const confirmPassInput = document.getElementById('confirm-password');
const passwordReq = document.getElementById('password-req');

// Department Screen
const freeUserBtn = document.createElement('button');
freeUserBtn.id = 'free-user-btn';
freeUserBtn.textContent = "I'm a Free User (20 Questions Max)";

const accessCodeBtn = document.createElement('button');
accessCodeBtn.id = 'access-code-btn';
accessCodeBtn.textContent = "Enter Access Code";

const upgradeBtn = document.createElement('button');
upgradeBtn.id = 'upgrade-btn';
upgradeBtn.textContent = "Upgrade to Full Access";

// Quiz Elements
const departmentsGrid = document.querySelector('.departments-grid');
const deptTitleEl = document.getElementById('dept-title');
const accessBadgeEl = document.getElementById('access-badge');
const questionEl = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const submitBtn = document.getElementById('submit-btn');
const scoreEl = document.getElementById('score');
const questionNumberEl = document.getElementById('question-number');
const totalQuestionsEl = document.getElementById('total-questions');
const progressBar = document.querySelector('.progress-bar');
const timerBar = document.querySelector('.timer-bar');
const timerEl = document.getElementById('timer');
const resultContainer = document.getElementById('result-container');
const finalScoreEl = document.getElementById('final-score');
const maxScoreEl = document.getElementById('max-score');
const resultMessageEl = document.getElementById('result-message');
const resultDeptEl = document.getElementById('result-dept');
const resultAccessEl = document.getElementById('result-access');
const resultDateEl = document.getElementById('result-date');
const resultPercentageEl = document.getElementById('result-percentage');
const restartBtn = document.getElementById('restart-btn');
const backToDeptsBtn = document.getElementById('back-to-depts');
const logoutBtn = document.getElementById('logout-btn');
const userGreeting = document.querySelector('.user-greeting');
const printResultsBtn = document.getElementById('print-results');

// Modal Elements
const summaryModal = document.getElementById('summary-modal');
const accessCodeModal = document.getElementById('access-code-modal');
const paymentModal = document.getElementById('payment-modal');
const summaryList = document.getElementById('summary-list');
const cancelSubmitBtn = document.getElementById('cancel-submit');
const confirmSubmitBtn = document.getElementById('confirm-submit');
const closeModal = document.querySelector('.close-modal');
const closePaymentModal = document.querySelector('.close-payment-modal');
const codeInput = document.getElementById('access-code-input');
const verifyCodeBtn = document.getElementById('verify-code-btn');
const codeResult = document.getElementById('code-result');

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Track user activity
    document.addEventListener('click', updateUserActivity);
    document.addEventListener('keypress', updateUserActivity);
    
    // Check session every minute
    setInterval(checkSessionTimeout, 60000);
    
    const savedUser = localStorage.getItem('quiz_user');
    const savedSession = localStorage.getItem('quiz_session');
    
    if (savedUser && savedSession) {
        currentUser = savedUser;
        currentSessionId = savedSession;
        
        // Validate session
        validateSession().then(valid => {
            if (valid) {
                loadDepartments();
            } else {
                showLoginScreen();
            }
        });
    } else {
        showLoginScreen();
    }
    
    setupEventListeners();
});

// Update last activity time
function updateUserActivity() {
    lastActivity = Date.now();
}

// Check if session has timed out
function checkSessionTimeout() {
    const now = Date.now();
    if (now - lastActivity > SESSION_TIMEOUT) {
        alert('Session expired due to inactivity. Please log in again.');
        logout();
    }
}

// Show login screen
function showLoginScreen() {
    loginScreen.style.display = 'flex';
    departmentScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
}

// Set up all event listeners
function setupEventListeners() {
    // Tab Listeners
    if (loginTab && registerTab) {
        loginTab.addEventListener('click', showLoginForm);
        registerTab.addEventListener('click', showRegisterForm);
    }

    // Form navigation
    if (gotoLogin) {
        gotoLogin.addEventListener('click', (e) => {
            e.preventDefault();
            showRegisterForm();
        });
    }
    
    if (gotoRegister) {
        gotoRegister.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }

    // Password feedback
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', validatePasswordFeedback);
    }

    // Form submissions
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Modal close buttons
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            accessCodeModal.classList.add('hidden');
        });
    }
    
    if (closePaymentModal) {
        closePaymentModal.addEventListener('click', () => {
            paymentModal.classList.add('hidden');
        });
    }

    // Window click to close modals
    window.addEventListener('click', (e) => {
        if (e.target === accessCodeModal) {
            accessCodeModal.classList.add('hidden');
        }
        if (e.target === paymentModal) {
            paymentModal.classList.add('hidden');
        }
    });

    // Verify code button
    if (verifyCodeBtn) {
        verifyCodeBtn.addEventListener('click', verifyAccessCode);
    }

    // Payment buttons
    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', initiatePayment);
    });

    // Quiz navigation
    if (prevBtn) prevBtn.addEventListener('click', goToPrevious);
    if (nextBtn) nextBtn.addEventListener('click', goToNext);
    if (submitBtn) submitBtn.addEventListener('click', submitQuiz);
    if (cancelSubmitBtn) cancelSubmitBtn.addEventListener('click', cancelSubmit);
    if (confirmSubmitBtn) confirmSubmitBtn.addEventListener('click', confirmSubmit);
    if (restartBtn) restartBtn.addEventListener('click', restartQuiz);
    if (backToDeptsBtn) backToDeptsBtn.addEventListener('click', backToDepartments);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (printResultsBtn) printResultsBtn.addEventListener('click', printResults);
}

// Validate current session
async function validateSession() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/validate-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username: currentUser, 
                sessionId: currentSessionId 
            })
        });

        const data = await response.json();
        
        if (data.valid) {
            return true;
        } else {
            if (data.suspended) {
                const expiry = new Date(data.suspensionExpiry);
                alert(`Your account has been suspended until ${expiry.toLocaleString()}. Contact support.`);
            }
            logout();
            return false;
        }
    } catch (error) {
        console.error('Session validation error:', error);
        logout();
        return false;
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = newUsernameInput.value.trim();
    const password = newPasswordInput.value;
    const confirm = confirmPassInput.value;
    const email = prompt('Enter your email:', username + '@example.com');

    if (!email || !email.includes('@')) {
        alert('Valid email is required');
        return;
    }

    if (password !== confirm) {
        alert('Passwords do not match!');
        return;
    }

    const requirements = {
        length: password.length >= 6,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password)
    };

    const allValid = Object.values(requirements).every(req => req);
    if (!allValid) {
        alert('Please meet all password requirements.');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, email })
        });

        const data = await response.json();
        
        if (data.success) {
            currentUser = username;
            localStorage.setItem('quiz_user', username);
            userScores[currentUser] = {};
            localStorage.setItem('quiz_scores', JSON.stringify(userScores));
            
            hideLogin();
            loadDepartments();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Failed to register. Please try again.');
        console.error('Registration error:', error);
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (data.success) {
            currentUser = username;
            currentSessionId = data.sessionId;
            
            // Save session
            localStorage.setItem('quiz_user', username);
            localStorage.setItem('quiz_session', currentSessionId);
            
            if (!userScores[currentUser]) {
                userScores[currentUser] = {};
                localStorage.setItem('quiz_scores', JSON.stringify(userScores));
            }

            // Show warning if needed
            if (data.warning) {
                alert(`⚠️ ${data.message}`);
            }
            
            // Logout from other devices if needed
            if (data.sessionsTerminated && data.sessionsTerminated.length > 0) {
                alert(`Logged out from ${data.sessionsTerminated.length} other devices for security reasons.`);
            }

            hideLogin();
            loadDepartments();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Login failed. Please try again.');
        console.error('Login error:', error);
    }
}

function hideLogin() {
    loginScreen.style.display = 'none';
}

// Load departments from server
async function loadDepartments() {
    // Add session to URL
    const url = `${BACKEND_URL}/api/departments?username=${currentUser}&sessionId=${currentSessionId}`;
    
    loadingScreen.classList.remove('hidden');

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.departments) {
            showDepartmentScreen(data.departments);
        } else {
            throw new Error('No departments found');
        }
    } catch (error) {
        console.error('Failed to load departments:', error);
        alert('Failed to load departments. Please try again.');
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            showLoginScreen();
        }, 2000);
    }
}

function showDepartmentScreen(departments) {
    // Get user data from backend
    fetch(`${BACKEND_URL}/api/user/${currentUser}?sessionId=${currentSessionId}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const user = data.user;
                isFreeUser = !user.subscription && !user.paymentPending;

                userGreeting.textContent = `Hello, ${currentUser}`;
                if (user.subscription) {
                    userGreeting.textContent += ` (Premium)`;
                } else if (user.paymentPending) {
                    userGreeting.textContent += ` (Payment Confirmed - Enter Code)`;
                }
                
                // Show suspension info
                if (user.isSuspended && user.suspensionExpiry) {
                    const expiry = new Date(user.suspensionExpiry);
                    userGreeting.textContent += ` (Suspended until ${expiry.toLocaleString()})`;
                }
            }
        })
        .catch(err => {
            console.error('User fetch error:', err);
            logout();
        });

    setTimeout(() => {
        let width = 5;
        const progress = document.querySelector('.loader-progress');
        const interval = setInterval(() => {
            if (width >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    departmentScreen.classList.remove('hidden');
                    createDepartmentCards(departments);
                }, 200);
            } else {
                width += Math.random() * 10 + 5;
                progress.style.width = `${Math.min(width, 100)}%`;
            }
        }, 150);
    }, 200);
}

// Create department cards
function createDepartmentCards(departments) {
    if (!departmentsGrid) return;
    
    departmentsGrid.innerHTML = '';
    
    // Add access buttons
    departmentsGrid.appendChild(freeUserBtn);
    departmentsGrid.appendChild(accessCodeBtn);
    departmentsGrid.appendChild(upgradeBtn);

    // Add department cards
    departments.forEach(dept => {
        const card = document.createElement('div');
        card.className = 'department-card';
        card.textContent = dept;
        card.addEventListener('click', () => {
            selectedDeptForQuiz = dept;
            startQuiz();
        });
        departmentsGrid.appendChild(card);
    });

    // Event Listeners
    freeUserBtn.onclick = () => {
        isFreeUser = true;
        accessBadgeEl.textContent = 'Free User';
        accessBadgeEl.className = 'access-badge';
        userGreeting.textContent = userGreeting.textContent.replace(/ \(Premium.*\)/, '');
        alert(`Free access: Up to ${FREE_USER_LIMIT} questions per department`);
    };

    accessCodeBtn.onclick = () => {
        accessCodeModal.classList.remove('hidden');
        codeInput.value = '';
        codeResult.classList.add('hidden');
    };

    upgradeBtn.onclick = () => {
        paymentModal.classList.remove('hidden');
    };
}

// Verify Access Code
async function verifyAccessCode() {
    const code = codeInput.value.trim();
    
    if (!code) {
        showCodeResult('Please enter an access code.', 'error');
        return;
    }
    
    if (!/^\d{6}$/.test(code)) {
        showCodeResult('Invalid format. Enter 6 digits.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/verify-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                code, 
                username: currentUser,
                sessionId: currentSessionId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showCodeResult(data.message, 'success');
            
            setTimeout(() => {
                accessCodeModal.classList.add('hidden');
                isFreeUser = false;
                userGreeting.textContent = `Hello, ${currentUser} (Premium)`;
                accessBadgeEl.textContent = 'Premium User';
                accessBadgeEl.className = 'access-badge premium';
            }, 1500);
        } else {
            showCodeResult(data.message, 'error');
        }
    } catch (error) {
        showCodeResult('Failed to verify code. Please try again.', 'error');
        console.error('Verification error:', error);
    }
}

function showCodeResult(message, type) {
    if (!codeResult) return;
    
    codeResult.textContent = message;
    codeResult.className = `code-result ${type} hidden`;
    setTimeout(() => {
        codeResult.classList.remove('hidden');
    }, 100);
}

// Start quiz
async function startQuiz() {
    // Add session to URL
    const limit = isFreeUser ? FREE_USER_LIMIT : null;
    let url = `${BACKEND_URL}/api/questions/${selectedDeptForQuiz}?username=${currentUser}&sessionId=${currentSessionId}`;
    if (limit) {
        url += `&limit=${limit}`;
    }
    
    loadingScreen.classList.remove('hidden');
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.questions) {
            currentDepartment = selectedDeptForQuiz;
            currentQuestions = data.questions;
            
            deptTitleEl.textContent = currentDepartment;
            totalQuestionsEl.textContent = currentQuestions.length;

            currentQuestionIndex = 0;
            score = 0;
            userAnswers = Array(currentQuestions.length).fill(null);
            scoreEl.textContent = score;

            departmentScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');

            showQuestion();
            updateProgress();
            updateButtons();
            
            loadingScreen.classList.add('hidden');
        } else {
            throw new Error('Failed to load questions');
        }
    } catch (error) {
        console.error('Failed to start quiz:', error);
        alert('Failed to load quiz. Please try again.');
        loadingScreen.classList.add('hidden');
    }
}

// Display current question
function showQuestion() {
    if (timer) clearInterval(timer);

    const q = currentQuestions[currentQuestionIndex];
    questionEl.textContent = q.question;
    questionNumberEl.textContent = currentQuestionIndex + 1;

    optionsContainer.innerHTML = '';

    q.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.classList.add('option');
        if (userAnswers[currentQuestionIndex] === option) {
            btn.classList.add('selected');
        }
        btn.textContent = option;
        btn.dataset.option = option;
        btn.addEventListener('click', () => selectOption(btn, option));
        optionsContainer.appendChild(btn);
    });

    startTimer();
}

// Handle option selection
function selectOption(button, selectedOption) {
    document.querySelectorAll('.option').forEach(btn => {
        btn.classList.remove('selected');
        btn.classList.remove('correct');
        btn.classList.remove('incorrect');
    });
    
    button.classList.add('selected');
    userAnswers[currentQuestionIndex] = selectedOption;
    
    // Show correct/incorrect immediately
    const correctAnswer = currentQuestions[currentQuestionIndex].correct;
    
    document.querySelectorAll('.option').forEach(btn => {
        if (btn.dataset.option === correctAnswer) {
            btn.classList.add('correct');
        } else if (btn === button && selectedOption !== correctAnswer) {
            btn.classList.add('incorrect');
        }
    });
    
    updateButtons();
}

// Update button visibility
function updateButtons() {
    if (prevBtn) {
        prevBtn.classList.remove('hidden');
        if (currentQuestionIndex === 0) {
            prevBtn.classList.add('hidden');
        }
    }

    if (nextBtn && submitBtn) {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.remove('hidden');

        if (currentQuestionIndex === currentQuestions.length - 1) {
            nextBtn.classList.add('hidden');
            submitBtn.disabled = userAnswers[currentQuestionIndex] === null;
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }
    }
}

// Previous button
function goToPrevious() {
    if (currentQuestionIndex > 0) {
        if (timer) clearInterval(timer);
        currentQuestionIndex--;
        showQuestion();
        updateProgress();
        updateButtons();
    }
}

// Next button
function goToNext() {
    if (userAnswers[currentQuestionIndex] !== null && currentQuestionIndex < currentQuestions.length - 1) {
        if (timer) clearInterval(timer);
        currentQuestionIndex++;
        showQuestion();
        updateProgress();
        updateButtons();
    }
}

// Submit Quiz Button
function submitQuiz() {
    const unanswered = userAnswers.filter(ans => ans === null).length;

    submissionData = {
        department: currentDepartment,
        questions: currentQuestions.length,
        userAnswers: [...userAnswers],
        date: new Date().toLocaleString(),
        unanswered: unanswered,
        access: isFreeUser ? 'free' : 'premium'
    };

    showSummaryModal();
}

// Show Summary Modal
function showSummaryModal() {
    summaryList.innerHTML = '';
    
    currentQuestions.forEach((q, index) => {
        const item = document.createElement('div');
        item.className = 'summary-item';
        
        const status = userAnswers[index] === null ? 
            '<span class="summary-unanswered">Unanswered</span>' : 
            '<span class="summary-answered">Answered</span>';
            
        item.innerHTML = `<strong>Q${index+1}:</strong> ${status}`;
        summaryList.appendChild(item);
    });

    summaryModal.classList.remove('hidden');
}

// Cancel submission
function cancelSubmit() {
    summaryModal.classList.add('hidden');
    showQuestion(); // Redraw with feedback
}

// Confirm submission
function confirmSubmit() {
    summaryModal.classList.add('hidden');
    calculateScore();
}

function calculateScore() {
    if (timer) clearInterval(timer);
    
    score = 0;
    currentQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) {
            score++;
        }
    });
    scoreEl.textContent = score;
    
    showResults();
}

// Show results
function showResults() {
    resultDeptEl.textContent = currentDepartment;
    resultAccessEl.textContent = isFreeUser ? 'Free User' : 'Premium User';
    resultDateEl.textContent = new Date().toLocaleString();
    
    const percentage = Math.round((score / currentQuestions.length) * 100);
    resultPercentageEl.textContent = percentage;
    
    finalScoreEl.textContent = score;
    maxScoreEl.textContent = currentQuestions.length;
    
    if (percentage === 100) resultMessageEl.textContent = "Perfect! 🎉 Excellent knowledge!";
    else if (percentage >= 80) resultMessageEl.textContent = "Great job! 👏 Well done!";
    else if (percentage >= 60) resultMessageEl.textContent = "Good effort! 👍";
    else resultMessageEl.textContent = "Keep learning! 📚";
    
    // Save score
    if (!userScores[currentUser]) userScores[currentUser] = {};
    userScores[currentUser][currentDepartment] = {
        score: score,
        total: currentQuestions.length,
        percentage: percentage,
        date: new Date().toLocaleString(),
        access: isFreeUser ? 'free' : 'premium'
    };
    localStorage.setItem('quiz_scores', JSON.stringify(userScores));
    
    resultContainer.classList.remove('hidden');
    progressBar.style.width = '100%';
}

// Update progress bar
function updateProgress() {
    const progress = (currentQuestionIndex / currentQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Timer functions
function startTimer() {
    let timeLeft = 30;
    timerEl.textContent = timeLeft;
    timerBar.style.width = '100%';
    
    timer = setInterval(() => {
        timeLeft -= 0.1;
        timerEl.textContent = Math.ceil(timeLeft);
        
        const percent = (timeLeft / 30) * 100;
        timerBar.style.width = `${Math.max(percent, 0)}%`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            alert("Time's up for this question!");
        }
    }, 100);
}

// Restart quiz
function restartQuiz() {
    resultContainer.classList.add('hidden');
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = Array(currentQuestions.length).fill(null);
    scoreEl.textContent = score;
    showQuestion();
    updateProgress();
    updateButtons();
}

// Back to departments
function backToDepartments() {
    if (timer) clearInterval(timer);
    quizScreen.classList.add('hidden');
    departmentScreen.classList.remove('hidden');
    resultContainer.classList.add('hidden');
}

// Print Results
function printResults() {
    const printContent = `
        <h1>HealthQuiz Results</h1>
        <p><strong>User:</strong> ${currentUser}</p>
        <p><strong>Access:</strong> ${isFreeUser ? 'Free User' : 'Premium User'}</p>
        <p><strong>Department:</strong> ${currentDepartment}</p>
        <p><strong>Score:</strong> ${score}/${currentQuestions.length}</p>
        <p><strong>Percentage:</strong> ${Math.round((score / currentQuestions.length) * 100)}%</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Quiz Results</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #1e40af; }
                p { margin: 10px 0; font-size: 16px; }
            </style>
        </head>
        <body>${printContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Logout
function logout() {
    if (timer) clearInterval(timer);
    
    // Remove from backend
    if (currentUser && currentSessionId) {
        fetch(`${BACKEND_URL}/api/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                username: currentUser, 
                sessionId: currentSessionId 
            })
        });
    }
    
    // Clear local storage
    localStorage.removeItem('quiz_user');
    localStorage.removeItem('quiz_session');
    currentUser = '';
    currentSessionId = '';
    
    departmentScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    showLoginScreen();
}

// Payment with Paystack
function initiatePayment(e) {
    const plan = e.target.dataset.plan;
    const amount = parseInt(e.target.dataset.amount) * 100;
    
    const userEmail = prompt('Enter your email for payment receipt:', currentUser + '@example.com');
    if (!userEmail || !userEmail.includes('@')) {
        alert('Valid email is required for payment.');
        return;
    }

    const handler = PaystackPop.setup({
        key: 'pk_live_d7c2e110ef3c553229953165aed8fb344684c5c8',
        email: userEmail,
        amount: amount,
        currency: 'NGN',
        ref: 'healthquiz_' + currentUser + '_' + new Date().getTime(),
        meta: {
            custom_fields: [
                {
                    display_name: "User",
                    variable_name: "user",
                    value: currentUser
                },
                {
                    display_name: "Plan",
                    variable_name: "plan",
                    value: plan + ' months'
                }
            ]
        },
        callback: function(response) {
            alert(`Payment successful! Reference: ${response.reference}\n\nCheck your email for the access code.`);
            paymentModal.classList.add('hidden');
            
            // Mark as payment pending
            fetch(`${BACKEND_URL}/api/user/${currentUser}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        userGreeting.textContent = `Hello, ${currentUser} (Payment Confirmed - Enter Code)`;
                    }
                });
        },
        onClose: function() {
            alert('Payment window closed.');
        }
    });

    handler.openIframe();
}

// Show/Hide Forms
function showLoginForm() {
    if (!loginForm || !registerForm || !loginTab || !registerTab) return;
    
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
}

function showRegisterForm() {
    if (!loginForm || !registerForm || !loginTab || !registerTab) return;
    
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
}

// Password validation feedback
function validatePasswordFeedback() {
    const pw = newPasswordInput.value;
    if (!passwordReq) return;
    
    if (pw) {
        passwordReq.classList.remove('hidden');
        
        const requirements = {
            length: pw.length >= 6,
            lowercase: /[a-z]/.test(pw),
            uppercase: /[A-Z]/.test(pw),
            number: /\d/.test(pw)
        };

        document.getElementById('length').classList.toggle('valid', requirements.length);
        document.getElementById('lowercase').classList.toggle('valid', requirements.lowercase);
        document.getElementById('uppercase').classList.toggle('valid', requirements.uppercase);
        document.getElementById('number').classList.toggle('valid', requirements.number);
    } else {
        passwordReq.classList.add('hidden');
    }
}