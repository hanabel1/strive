// Toggle functionality
const toggle = document.getElementById('structuredToggle');
toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
});

// Chatbot functionality
let languageModelSession = null;
let conversationState = {
    currentGoal: '',
    startDate: '',
    endDate: '',
    details: '',
    structured: false,
    questionsAsked: 0,
    maxQuestions: 3,
    conversationComplete: false
};

// DOM elements
const chatbotModal = document.getElementById('chatbotModal');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');
const closeChatbot = document.getElementById('closeChatbot');
const submitBtn = document.getElementById('submitBtn');
const goalInput = document.getElementById('goalInput');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const detailsInput = document.getElementById('detailsInput');

// Custom Date Picker functionality
const datePickerModal = document.getElementById('datePickerModal');
const currentMonthEl = document.getElementById('currentMonth');
const datePickerDays = document.getElementById('datePickerDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const selectDateBtn = document.getElementById('selectDate');
const clearDateBtn = document.getElementById('clearDate');

let currentDate = new Date();
let selectedDate = null;
let currentInput = null;

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    currentMonthEl.textContent = `${months[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    datePickerDays.innerHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDate; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'date-picker-day other-month';
        dayEl.textContent = '';
        datePickerDays.appendChild(dayEl);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'date-picker-day';
        dayEl.textContent = day;
        
        const date = new Date(year, month, day);
        const today = new Date();
        
        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }
        
        if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
            dayEl.classList.add('selected');
        }
        
        dayEl.addEventListener('click', () => {
            selectedDate = new Date(year, month, day);
            renderCalendar();
        });
        
        datePickerDays.appendChild(dayEl);
    }
}

function openDatePicker(input) {
    currentInput = input;
    selectedDate = null;
    currentDate = new Date();
    renderCalendar();
    datePickerModal.style.display = 'flex';
}

function closeDatePicker() {
    datePickerModal.style.display = 'none';
    currentInput = null;
    selectedDate = null;
}

// Event listeners
startDate.addEventListener('click', () => openDatePicker(startDate));
endDate.addEventListener('click', () => openDatePicker(endDate));

// Add keyboard support
startDate.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDatePicker(startDate);
    }
});

endDate.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDatePicker(endDate);
    }
});

document.querySelectorAll('.date-picker-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
        const input = e.target.parentElement.querySelector('input');
        openDatePicker(input);
    });
});

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

selectDateBtn.addEventListener('click', () => {
    if (selectedDate && currentInput) {
        currentInput.value = formatDate(selectedDate);
        closeDatePicker();
    }
});

clearDateBtn.addEventListener('click', () => {
    if (currentInput) {
        currentInput.value = '';
        closeDatePicker();
    }
});

// Close modal when clicking outside
datePickerModal.addEventListener('click', (e) => {
    if (e.target === datePickerModal) {
        closeDatePicker();
    }
});

// Check if Prompt API is available
async function checkPromptAPI() {
    if (!('LanguageModel' in window)) {
        console.log('Prompt API not available in this browser');
        return false;
    }
    return true;
}

// Initialize the language model session
async function initializeLanguageModel() {
    try {
        const availability = await LanguageModel.availability({
            expectedInputs: [{ type: "text", languages: ["en"] }],
            expectedOutputs: [{ type: "text", languages: ["en"] }]
        });

        console.log('Language model availability:', availability);

        if (availability === 'unavailable') {
            console.log('Language model not available');
            return false;
        }

        if (availability === 'downloadable' || availability === 'downloading') {
            console.log('Downloading language model...');
        }

        languageModelSession = await LanguageModel.create({
            expectedInputs: [{ type: "text", languages: ["en"] }],
            expectedOutputs: [{ type: "text", languages: ["en"] }],
            monitor(m) {
                m.addEventListener("downloadprogress", e => {
                    console.log(`Download progress: ${Math.round(e.loaded * 100)}%`);
                });
            }
        });

        console.log('Language model session created successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize language model:', error);
        return false;
    }
}

// Add message to chatbot
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.textContent = content;
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Stream bot message into the DOM character-by-character
async function streamBotMessage(fullText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    // Typewriter effect
    let index = 0;
    const chunkSize = 3; // faster typing
    const delayMs = 10;   // shorter delay

    while (index < fullText.length) {
        const next = fullText.slice(index, index + chunkSize);
        index += next.length;
        // Render markdown incrementally
        messageDiv.innerHTML = markdownToHtml(fullText.slice(0, index));
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        await new Promise(r => setTimeout(r, delayMs));
    }

    return messageDiv;
}

// Show chatbot full page
function showChatbot() {
    chatbotModal.style.display = 'flex';
    chatbotInput.focus();
}

// Hide chatbot and return to main page
function hideChatbot() {
    chatbotModal.style.display = 'none';
}

// Generate AI response
async function generateAIResponse(userMessage, context) {
    if (!languageModelSession) {
        return "I'm sorry, the AI assistant is not available right now.";
    }

    try {
        const prompt = `You are a helpful goal-setting assistant. You're having a conversation with a user to help them create a detailed, actionable plan for their goal.

Context: ${JSON.stringify(context)}

User's latest message: "${userMessage}"

Based on the conversation so far, respond naturally and helpfully. If you need more information to create a good plan, ask specific follow-up questions. If you have enough information, provide a detailed step-by-step plan with timelines.

Keep responses conversational and under 200 words.`;

        const response = await languageModelSession.prompt(prompt);
        return response;
    } catch (error) {
        console.error('Error generating AI response:', error);
        return "I'm sorry, I encountered an error. Please try again.";
    }
}

// Stream plan content into a nicely formatted container
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function markdownToHtml(text) {
    // Split lines to build nested lists by indentation (2 spaces per level)
    const lines = text.split(/\n/);
    const htmlParts = [];
    const stack = []; // {type:'ul'|'ol', level:number}

    function closeListsDownTo(level) {
        while (stack.length && stack[stack.length - 1].level >= level) {
            const popped = stack.pop();
            htmlParts.push(popped.type === 'ul' ? '</ul>' : '</ol>');
        }
    }

    for (let rawLine of lines) {
        const matchIndent = rawLine.match(/^(\s*)/);
        const leading = matchIndent ? matchIndent[1].length : 0;
        const level = Math.floor(leading / 2);
        const line = rawLine.slice(leading);

        const unordered = line.match(/^[-*]\s+(.*)$/);
        const ordered = line.match(/^(\d+)\.\s+(.*)$/);
        const heading = line.match(/^(#{1,6})\s+(.*)$/);

        if (unordered || ordered) {
            const type = unordered ? 'ul' : 'ol';
            const content = unordered ? unordered[1] : ordered[2];

            // Ensure correct list nesting/type
            if (!stack.length || level > stack[stack.length - 1].level) {
                stack.push({ type, level });
                htmlParts.push(type === 'ul' ? '<ul>' : '<ol>');
            } else {
                while (stack.length && (stack[stack.length - 1].level > level || stack[stack.length - 1].type !== type)) {
                    const popped = stack.pop();
                    htmlParts.push(popped.type === 'ul' ? '</ul>' : '</ol>');
                }
                if (!stack.length || stack[stack.length - 1].level < level || stack[stack.length - 1].type !== type) {
                    stack.push({ type, level });
                    htmlParts.push(type === 'ul' ? '<ul>' : '<ol>');
                }
            }

            let item = escapeHtml(content);
            // markdown links [text](url)
            item = item.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+)\)/g, (m, text, url) => {
                const href = url.startsWith('http') ? url : `https://${url}`;
                return `<a href="${href}" target="_blank" rel="noopener">${text}<\/a>`;
            });
            // auto-link bare URLs (incl. www.) and show domain as text
            item = item.replace(/\b((https?:\/\/)?(www\.)?[^\s]+\.[^\s]+)\b/g, (m, u) => {
                const href = u.startsWith('http') ? u : `https://${u}`;
                try { const d = new URL(href).hostname.replace(/^www\./,''); return `<a href="${href}" target="_blank" rel="noopener">${d}<\/a>`; } catch { return m; }
            });
            item = item.replace(/\*\*(.+?)\*\*/g, '<strong>$1<\/strong>');
            item = item.replace(/\*(?!\*)([^*\n]+)\*/g, '<em>$1<\/em>');
            htmlParts.push(`<li>${item}</li>`);
        } else if (heading) {
            closeListsDownTo(0);
            const levelHashes = heading[1].length;
            let body = escapeHtml(heading[2]);
            body = body.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+)\)/g, (m, text, url) => {
                const href = url.startsWith('http') ? url : `https://${url}`;
                return `<a href="${href}" target="_blank" rel="noopener">${text}<\/a>`;
            });
            body = body.replace(/\b((https?:\/\/)?(www\.)?[^\s]+\.[^\s]+)\b/g, (m, u) => {
                const href = u.startsWith('http') ? u : `https://${u}`;
                try { const d = new URL(href).hostname.replace(/^www\./,''); return `<a href="${href}" target="_blank" rel="noopener">${d}<\/a>`; } catch { return m; }
            });
            body = body.replace(/\*\*(.+?)\*\*/g, '<strong>$1<\/strong>');
            body = body.replace(/\*(?!\*)([^*\n]+)\*/g, '<em>$1<\/em>');
            const level = Math.min(levelHashes, 6);
            htmlParts.push(`<h${level}>${body}</h${level}>`);
        } else {
            closeListsDownTo(0);
            if (rawLine.trim().length === 0) {
                htmlParts.push('<br>');
            } else {
                let body = escapeHtml(rawLine);
                body = body.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|www\.[^\s)]+)\)/g, (m, text, url) => {
                    const href = url.startsWith('http') ? url : `https://${url}`;
                    return `<a href="${href}" target="_blank" rel="noopener">${text}<\/a>`;
                });
                body = body.replace(/\b((https?:\/\/)?(www\.)?[^\s]+\.[^\s]+)\b/g, (m, u) => {
                    const href = u.startsWith('http') ? u : `https://${u}`;
                    try { const d = new URL(href).hostname.replace(/^www\./,''); return `<a href="${href}" target="_blank" rel="noopener">${d}<\/a>`; } catch { return m; }
                });
                body = body.replace(/\*\*(.+?)\*\*/g, '<strong>$1<\/strong>');
                body = body.replace(/\*(?!\*)([^*\n]+)\*/g, '<em>$1<\/em>');
                htmlParts.push(body, '<br>');
            }
        }
    }
    while (stack.length) {
        const popped = stack.pop();
        htmlParts.push(popped.type === 'ul' ? '</ul>' : '</ol>');
    }
    return htmlParts.join('');
}

async function streamPlan(planText) {
    const planDiv = document.createElement('div');
    planDiv.className = 'plan-display';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'plan-title';
    titleDiv.textContent = 'Your Personalized Plan';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'plan-content';

    planDiv.appendChild(titleDiv);
    planDiv.appendChild(contentDiv);
    chatbotMessages.appendChild(planDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    let index = 0;
    const chunkSize = 3; // characters per tick for plan
    const delayMs = 12;   // delay per tick for plan

    while (index < planText.length) {
        index = Math.min(index + chunkSize, planText.length);
        const partial = planText.slice(0, index);
        contentDiv.innerHTML = markdownToHtml(partial);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        await new Promise(r => setTimeout(r, delayMs));
    }

    return planDiv;
}

// Handle chatbot conversation
async function handleChatbotConversation() {
    const userMessage = chatbotInput.value.trim();
    if (!userMessage) return;

    // Add user message
    addMessage(userMessage, true);
    chatbotInput.value = '';

    // Update conversation state
    conversationState.questionsAsked++;

    // Generate AI response
    const aiResponse = await generateAIResponse(userMessage, conversationState);
    await streamBotMessage(aiResponse);

    // Check if we should end the conversation
    if (conversationState.questionsAsked >= conversationState.maxQuestions || 
        aiResponse.toLowerCase().includes('plan') || 
        aiResponse.toLowerCase().includes('step')) {
        
        // Generate final plan
        await generateFinalPlan();
    }
}

// Generate final step-by-step plan
async function generateFinalPlan() {
    if (!languageModelSession) return;

    try {
        // Use the learning plan generator for structured plans
        if (conversationState.structured) {
            try {
                console.log('Creating LearningPlanGenerator...');
                const planGenerator = new LearningPlanGenerator();
                console.log('LearningPlanGenerator created successfully');
                
                const constraints = {
                    dailyMinutes: 60, // 1 hour per day as requested
                    daysPerWeek: 5,
                    priorSkill: 'beginner',
                    accessibility: []
                };
                
                console.log('Generating plan with constraints:', constraints);
                const plan = planGenerator.generatePlan(
                    conversationState.currentGoal,
                    conversationState.startDate,
                    conversationState.endDate,
                    constraints
                );
                
                console.log('Plan generated successfully:', plan);
                
                // Display the structured learning plan
                await displayStructuredPlan(plan);
                
                // Add "Start Learning" button
                setTimeout(() => {
                    addStartLearningButton(plan);
                }, 1000);
            } catch (error) {
                console.error('Error in structured plan generation:', error);
                addMessage("I encountered an error generating your structured learning plan. Let me try with a different approach.");
                
                // Fallback to AI-generated plan
                const prompt = `Create a detailed, step-by-step plan for achieving this goal: "${conversationState.currentGoal}"

Timeline: ${conversationState.startDate} to ${conversationState.endDate}
Details: ${conversationState.details}
Structured learning: ${conversationState.structured}

Provide a comprehensive plan with:
1. 5-7 specific, actionable steps
2. Timeline for each step
3. Resources or tools needed
4. Milestones to track progress

Format as a clear, numbered list with timelines.`;

                const plan = await languageModelSession.prompt(prompt);
                await streamPlan(plan);
            }
        } else {
            // Use AI for unstructured plans
            const prompt = `Create a detailed, step-by-step plan for achieving this goal: "${conversationState.currentGoal}"

Timeline: ${conversationState.startDate} to ${conversationState.endDate}
Details: ${conversationState.details}
Structured learning: ${conversationState.structured}

Provide a comprehensive plan with:
1. 5-7 specific, actionable steps
2. Timeline for each step
3. Resources or tools needed
4. Milestones to track progress

Format as a clear, numbered list with timelines.`;

            const plan = await languageModelSession.prompt(prompt);
            await streamPlan(plan);
        }

        conversationState.conversationComplete = true;
    } catch (error) {
        console.error('Error generating final plan:', error);
        addMessage("I'm sorry, I couldn't generate your plan. Please try again.");
    }
}

// Start goal planning conversation
async function startGoalPlanning(goalData) {
    conversationState = {
        currentGoal: goalData.goal,
        startDate: goalData.startDate,
        endDate: goalData.endDate,
        details: goalData.details,
        structured: goalData.structured,
        questionsAsked: 0,
        maxQuestions: 3,
        conversationComplete: false
    };

    // Clear previous messages
    chatbotMessages.innerHTML = '';

    // Start conversation
    addMessage(`Great! I'd love to help you create a detailed plan for "${goalData.goal}". Let me ask you a few questions to make sure I give you the best possible roadmap.`);
    
    if (!goalData.details) {
        addMessage("First, can you tell me more about your current experience level with this goal? What do you already know, and what challenges do you expect to face?");
    } else {
        addMessage(`I see you mentioned: "${goalData.details}". Can you tell me more about your specific learning style and what resources you prefer to use?`);
    }

    showChatbot();
}

// Event listeners
submitBtn.addEventListener('click', async () => {
    const goal = goalInput.value.trim();
    if (goal) {
        const goalData = {
            goal,
            startDate: startDate.value,
            endDate: endDate.value,
            details: detailsInput.value,
            structured: toggle.classList.contains('active')
        };

        console.log('New goal:', goalData);

        if (languageModelSession) {
            await startGoalPlanning(goalData);
        } else {
            alert('AI assistant is not available. Please enable the Prompt API in Chrome 138+ with the required flags.');
        }
        
        // Clear form
        goalInput.value = '';
        startDate.value = '';
        endDate.value = '';
        detailsInput.value = '';
    }
});

// Chatbot event listeners
chatbotSend.addEventListener('click', handleChatbotConversation);
chatbotInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleChatbotConversation();
    }
});
closeChatbot.addEventListener('click', hideChatbot);

// Enter key to submit main form
goalInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitBtn.click();
    }
});

// History Management Functions
// ===========================
// These functions handle saving, loading, and displaying goal history
// Integrated with Gemini API for curriculum generation

// Save goal to localStorage with curriculum and progress tracking
async function saveGoalToHistory(goalData) {
    try {
        const historyKey = 'strive-goal-history';
        const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
        
        // Generate curriculum using Gemini API
        const curriculum = await generateCurriculum(goalData);
        
        // Generate mock progress data for demonstration
        const progressData = generateMockProgress(goalData);
        
        const historyItem = {
            id: Date.now().toString(),
            title: goalData.goal,
            startDate: goalData.startDate,
            endDate: goalData.endDate,
            details: goalData.details,
            structured: goalData.structured,
            createdAt: new Date().toISOString(),
            curriculum: curriculum,
            progress: progressData,
            notes: goalData.details || 'No additional notes'
        };
        
        // Add to beginning of array (most recent first)
        existingHistory.unshift(historyItem);
        
        // Keep only last 20 goals to prevent localStorage bloat
        if (existingHistory.length > 20) {
            existingHistory.splice(20);
        }
        
        localStorage.setItem(historyKey, JSON.stringify(existingHistory));
        console.log('Goal saved to history with curriculum:', historyItem);
        
        // Refresh history display
        loadAndDisplayHistory();
        
        // Update todo list
        updateTodoList();
        
        return historyItem;
    } catch (error) {
        console.error('Error saving goal to history:', error);
        // Still save the goal even if curriculum generation fails
        const historyItem = {
            id: Date.now().toString(),
            title: goalData.goal,
            startDate: goalData.startDate,
            endDate: goalData.endDate,
            details: goalData.details,
            structured: goalData.structured,
            createdAt: new Date().toISOString(),
            curriculum: null,
            progress: generateMockProgress(goalData),
            notes: goalData.details || 'No additional notes'
        };
        
        const existingHistory = JSON.parse(localStorage.getItem('strive-goal-history') || '[]');
        existingHistory.unshift(historyItem);
        localStorage.setItem('strive-goal-history', JSON.stringify(existingHistory));
        loadAndDisplayHistory();
        
        // Update todo list
        updateTodoList();
        
        return historyItem;
    }
    
    const hasPromptAPI = await checkPromptAPI();
    if (hasPromptAPI) {
        await initializeLanguageModel();
    }
    
    console.log('App initialization complete');
}

// Display structured learning plan
async function displayStructuredPlan(plan) {
    try {
        console.log('Displaying structured plan:', plan);
        
        const planDiv = document.createElement('div');
        planDiv.className = 'structured-plan-display';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'plan-title';
        titleDiv.textContent = 'Your Duolingo-Style Learning Plan';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'structured-plan-content';

    // Add plan overview
    const overviewDiv = document.createElement('div');
    overviewDiv.className = 'plan-overview';
    overviewDiv.innerHTML = `
        <h3>🎯 Goal: ${plan.goal}</h3>
        <p><strong>Timeline:</strong> ${plan.timeline.startDate} to ${plan.timeline.endDate}</p>
        <p><strong>Total Days:</strong> ${plan.timeline.totalDays} | <strong>Available Days:</strong> ${plan.timeline.availableDays}</p>
    `;

     // Add categories
     const categoriesDiv = document.createElement('div');
     categoriesDiv.className = 'plan-categories';
     categoriesDiv.innerHTML = '<h3>📚 Learning Categories</h3>';
     
     plan.categories.forEach((category, index) => {
         const categoryDiv = document.createElement('div');
         categoryDiv.className = 'category-card';
         categoryDiv.style.borderLeftColor = category.color;
         categoryDiv.innerHTML = `
             <h4>${category.title}</h4>
             <p>${category.description}</p>
             <div class="category-stats">
                 <span class="lesson-count">${category.lessons.length} lessons</span>
                 <span class="difficulty">${getCategoryDifficulty(category)}</span>
             </div>
         `;
         categoriesDiv.appendChild(categoryDiv);
     });

    // Add gamification info
    const gamificationDiv = document.createElement('div');
    gamificationDiv.className = 'plan-gamification';
    gamificationDiv.innerHTML = `
        <h3>🎮 Gamification Features</h3>
        <div class="gamification-grid">
            <div class="gamification-item">
                <h4>💎 XP System</h4>
                <p>Earn XP for completing lessons, perfect scores, and maintaining streaks</p>
            </div>
            <div class="gamification-item">
                <h4>❤️ Hearts</h4>
                <p>Start with 5 hearts. Lose hearts on mistakes, regain them with success</p>
            </div>
            <div class="gamification-item">
                <h4>🔥 Streaks</h4>
                <p>Daily, weekly, and monthly streaks with bonus rewards</p>
            </div>
            <div class="gamification-item">
                <h4>🏆 Achievements</h4>
                <p>Unlock achievements for milestones and special accomplishments</p>
            </div>
        </div>
    `;

    // Add calendar
    const calendarDiv = document.createElement('div');
    calendarDiv.className = 'plan-calendar';
    calendarDiv.innerHTML = '<h3>📅 Daily Schedule</h3>';
    
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    plan.calendar.slice(0, 14).forEach((day, index) => { // Show first 2 weeks
        const dayDiv = document.createElement('div');
        dayDiv.className = `calendar-day ${day.restDay ? 'rest-day' : ''}`;
        dayDiv.innerHTML = `
            <div class="day-date">${new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
            <div class="day-content">
                ${day.restDay ? 'Rest Day' : `${day.totalMinutes} min`}
            </div>
        `;
        calendarGrid.appendChild(dayDiv);
    });
    
    calendarDiv.appendChild(calendarGrid);

## Assessment Points
- Weekly progress reviews
- Module completion checkpoints
- Final project presentation

## Next Steps
1. Review the full curriculum
2. Set up your learning environment
3. Begin with Module 1
4. Track your progress regularly

*This is a sample curriculum. The actual curriculum will be generated by AI based on your specific goal and requirements.*`;
}

// Handle View Plan button click
async function handleViewPlan(goalId) {
    try {
        const historyKey = 'strive-goal-history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const goal = history.find(item => item.id === goalId);
        
        if (!goal) {
            console.error('Goal not found:', goalId);
            return;
        }
        
        // Show curriculum modal
        showCurriculumModal(goal.title, goal.curriculum);
        
    } catch (error) {
        console.error('Error viewing plan:', error);
        alert('Error loading curriculum. Please try again.');
    }
}

// Handle Regenerate Plan button click
async function handleRegeneratePlan(goalId) {
    try {
        const historyKey = 'strive-goal-history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const goalIndex = history.findIndex(item => item.id === goalId);
        
        if (goalIndex === -1) {
            console.error('Goal not found:', goalId);
            return;
        }
        
        const goal = history[goalIndex];
        
        // Show loading state
        showCurriculumModal(goal.title, 'Generating new curriculum...');
        
        // Generate new curriculum
        const newCurriculum = await generateCurriculum({
            goal: goal.title,
            startDate: goal.startDate,
            endDate: goal.endDate,
            details: goal.details,
            structured: goal.structured
        });
        
        // Update the goal in history
        history[goalIndex].curriculum = newCurriculum;
        history[goalIndex].updatedAt = new Date().toISOString();
        
        localStorage.setItem(historyKey, JSON.stringify(history));
        
        // Update the modal with new curriculum
        showCurriculumModal(goal.title, newCurriculum);
        
        // Refresh history display
        loadAndDisplayHistory();
        
        // Update todo list
        updateTodoList();
        
    } catch (error) {
        console.error('Error regenerating plan:', error);
        alert('Error regenerating curriculum. Please try again.');
    }
}

    planDiv.appendChild(titleDiv);
    planDiv.appendChild(contentDiv);
    chatbotMessages.appendChild(planDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    
    } catch (error) {
        console.error('Error displaying structured plan:', error);
        addMessage("I encountered an error displaying your structured learning plan. Let me try a different approach.");
        
        // Fallback to simple plan display
        const simplePlanDiv = document.createElement('div');
        simplePlanDiv.className = 'plan-display';
        simplePlanDiv.innerHTML = `
            <div class="plan-title">Your Learning Plan</div>
            <div class="plan-content">
                <h3>🎯 Goal: ${plan.goal}</h3>
                <p><strong>Timeline:</strong> ${plan.timeline.startDate} to ${plan.timeline.endDate}</p>
                <p><strong>Total Days:</strong> ${plan.timeline.totalDays} | <strong>Available Days:</strong> ${plan.timeline.availableDays}</p>
                <p>Your structured learning plan has been generated successfully! The system will create a personalized curriculum with gamified lessons, adaptive difficulty, and progress tracking.</p>
            </div>
        `;
        chatbotMessages.appendChild(simplePlanDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
}

// Helper function to get category difficulty
function getCategoryDifficulty(category) {
    const avgDifficulty = category.lessons.reduce((sum, lesson) => sum + lesson.difficulty, 0) / category.lessons.length;
    return '⭐'.repeat(Math.round(avgDifficulty)) + '☆'.repeat(5 - Math.round(avgDifficulty));
}

// Add start learning button
function addStartLearningButton(plan) {
    const startLearningBtn = document.createElement('button');
    startLearningBtn.className = 'start-learning-btn';
    startLearningBtn.innerHTML = `
        <span class="btn-icon">🚀</span>
        <span class="btn-text">Start Learning</span>
    `;
    
    startLearningBtn.addEventListener('click', () => {
        startLearningInterface(plan);
    });
    
    chatbotMessages.appendChild(startLearningBtn);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Start learning interface
function startLearningInterface(plan) {
    // Hide the start learning button
    const startBtn = document.querySelector('.start-learning-btn');
    if (startBtn) {
        startBtn.remove();
    }
    
    // Initialize learning interface
    const learningInterface = new LearningInterface();
    learningInterface.init(plan);
}

// Todo Management System
// =====================
// Functions for parsing curriculum and managing todo tasks

// Parse curriculum text to extract tasks
function parseCurriculumToTasks(curriculum, courseTitle) {
    if (!curriculum) return [];
    
    const tasks = [];
    const lines = curriculum.split('\n');
    
    // Look for numbered lists, bullet points, or task-like content
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match patterns like "1. Task name", "- Task name", "* Task name"
        const taskMatch = line.match(/^[\d\-\*\+]\s+(.+)$/);
        if (taskMatch) {
            const taskTitle = taskMatch[1].trim();
            
            // Skip if it's too short or looks like a header
            if (taskTitle.length < 10 || taskTitle.match(/^(Module|Phase|Week|Chapter)/i)) {
                continue;
            }
            
            // Generate a mock due date based on task position
            const dueDate = generateMockDueDate(i, lines.length);
            
            tasks.push({
                id: `${courseTitle}-${i}-${Date.now()}`,
                title: taskTitle,
                due: dueDate,
                done: false,
                courseTitle: courseTitle
            });
        }
    }
    
    // If no tasks found, create some default ones
    if (tasks.length === 0) {
        tasks.push(
            {
                id: `${courseTitle}-default-1-${Date.now()}`,
                title: "Review course materials",
                due: "This week",
                done: false,
                courseTitle: courseTitle
            },
            {
                id: `${courseTitle}-default-2-${Date.now()}`,
                title: "Complete first assignment",
                due: "Next week",
                done: false,
                courseTitle: courseTitle
            },
            {
                id: `${courseTitle}-default-3-${Date.now()}`,
                title: "Practice key concepts",
                due: "In 2 weeks",
                done: false,
                courseTitle: courseTitle
            }
        );
    }
    
    return tasks.slice(0, 8); // Limit to 8 tasks per course
}

// Generate mock due date based on task position
function generateMockDueDate(taskIndex, totalTasks) {
    const now = new Date();
    const daysAhead = Math.floor((taskIndex / totalTasks) * 30) + 1; // Spread over 30 days
    const dueDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
    
    const options = { month: 'short', day: 'numeric' };
    return dueDate.toLocaleDateString('en-US', options);
}

// Update todo list from all active courses
function updateTodoList() {
    try {
        const historyKey = 'strive-goal-history';
        const todoKey = 'strive-todo-tasks';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const savedTasks = JSON.parse(localStorage.getItem(todoKey) || '{}');
        const todoContent = document.getElementById('todoContent');
        
        if (!todoContent) return;
        
        // Clear existing content
        todoContent.innerHTML = '';
        
        // Get all active courses (not completed)
        const activeCourses = history.filter(course => 
            course.progress && course.progress.status !== 'completed'
        );
        
        if (activeCourses.length === 0) {
            todoContent.innerHTML = `
                <div class="todo-empty">
                    No active courses. Create a new goal to see tasks here! ✨
                </div>
            `;
            return;
        }
        
        // Parse tasks from each course
        const allTasks = [];
        activeCourses.forEach(course => {
            if (course.curriculum) {
                const tasks = parseCurriculumToTasks(course.curriculum, course.title);
                // Apply saved completion states
                tasks.forEach(task => {
                    if (savedTasks[task.id]) {
                        task.done = savedTasks[task.id].done;
                    }
                });
                allTasks.push(...tasks);
            }
        });
        
        // Group tasks by course
        const tasksByCourse = {};
        allTasks.forEach(task => {
            if (!tasksByCourse[task.courseTitle]) {
                tasksByCourse[task.courseTitle] = [];
            }
            tasksByCourse[task.courseTitle].push(task);
        });
        
        // Render tasks grouped by course
        Object.keys(tasksByCourse).forEach(courseTitle => {
            const courseGroup = createCourseGroupElement(courseTitle, tasksByCourse[courseTitle]);
            todoContent.appendChild(courseGroup);
        });
        
    } catch (error) {
        console.error('Error updating todo list:', error);
    }
}

// Create course group element
function createCourseGroupElement(courseTitle, tasks) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'todo-course-group';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'todo-course-title';
    titleDiv.textContent = courseTitle;
    
    groupDiv.appendChild(titleDiv);
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        groupDiv.appendChild(taskElement);
    });
    
    return groupDiv;
}

// Create individual task element
function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'todo-item';
    
    const checkbox = document.createElement('div');
    checkbox.className = `todo-checkbox ${task.done ? 'checked' : ''}`;
    checkbox.setAttribute('data-task-id', task.id);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'todo-task-content';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = `todo-task-title ${task.done ? 'completed' : ''}`;
    
    // Parse and format bold text (**text**)
    titleDiv.innerHTML = formatBoldText(task.title);
    
    const dueDiv = document.createElement('div');
    dueDiv.className = 'todo-task-due';
    dueDiv.textContent = `Due: ${task.due}`;
    
    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(dueDiv);
    
    taskDiv.appendChild(checkbox);
    taskDiv.appendChild(contentDiv);
    
    return taskDiv;
}

// Format bold text by converting **text** to <strong>text</strong>
function formatBoldText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Handle task completion toggle
function handleTaskToggle(taskId) {
    try {
        const todoKey = 'strive-todo-tasks';
        const tasks = JSON.parse(localStorage.getItem(todoKey) || '{}');
        
        // Toggle the task state
        if (tasks[taskId]) {
            tasks[taskId].done = !tasks[taskId].done;
        } else {
            // Create new task entry - default to true (checked)
            tasks[taskId] = { done: true };
        }
        
        localStorage.setItem(todoKey, JSON.stringify(tasks));
        
        // Update UI immediately for better UX
        updateTodoList();
        
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

// Add event listeners for todo checkboxes
function addTodoEventListeners() {
    const todoContent = document.getElementById('todoContent');
    if (!todoContent) return;
    
    // Use event delegation for dynamically added checkboxes
    todoContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('todo-checkbox')) {
            const taskId = e.target.getAttribute('data-task-id');
            if (taskId) {
                handleTaskToggle(taskId);
            }
        }
    });
}

// Initialize the app
async function initApp() {
    const hasPromptAPI = await checkPromptAPI();
    if (hasPromptAPI) {
        await initializeLanguageModel();
    }
    
    // Initialize sample data if needed
    initializeSampleData();
    
    // Load and display existing history
    loadAndDisplayHistory();
    
    // Update todo list
    updateTodoList();
    
    // Add event listeners for history buttons
    addHistoryEventListeners();
    
    // Add event listeners for curriculum modal
    addCurriculumModalEventListeners();
    
    // Add event listeners for todo checkboxes
    addTodoEventListeners();
}

// Start the app when page loads
initApp();
