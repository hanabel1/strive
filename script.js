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

// This function is no longer needed - we use conversational flow instead

// This function is no longer needed - we use conversational flow instead

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

    if (languageModelSession) {
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
    } else {
        // Fallback response when AI is not available
        const fallbackResponse = "Thank you for your input! I've already generated a comprehensive plan for you above. You can use this as your roadmap to achieve your goal. Feel free to ask any specific questions about the plan or let me know if you'd like me to adjust anything.";
        await streamBotMessage(fallbackResponse);
    }
}

// Display structured learning plan
async function displayStructuredPlan(plan) {
    const planText = `---

*Ready to start your learning journey? Click the button below to begin!*`;

    await streamPlan(planText);
}

// Add "Start Learning" button
function addStartLearningButton(plan) {
    console.log('Adding start learning button with plan:', plan);
    
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'start-learning-container';
    buttonDiv.innerHTML = `
        <button class="start-learning-btn" id="startLearningBtn">
            🎓 Launch Learning Interface
        </button>
        <p class="start-learning-description">
            Click to see your beautiful learning cards with foldable lessons, interactive quizzes, and progress tracking!
        </p>
    `;
    
    console.log('Button HTML created:', buttonDiv.innerHTML);
    chatbotMessages.appendChild(buttonDiv);
    console.log('Button added to DOM');
    
    // Add event listener for the button
    const startBtn = document.getElementById('startLearningBtn');
    console.log('Adding event listener to button:', startBtn);
    
    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            console.log('Button clicked!', e);
            e.preventDefault();
            addMessage("🎮 Button clicked! Launching interface...");
            startLearningInterface(plan);
        });
    } else {
        console.error('Start learning button not found!');
        addMessage("❌ Error: Button not found. Please try again.");
    }
}

// Start the learning interface
function startLearningInterface(plan) {
    console.log('Starting learning interface with plan:', plan);
    
    // Remove the button
    const buttonContainer = document.querySelector('.start-learning-container');
    if (buttonContainer) {
        buttonContainer.remove();
    }
    
    // Add immediate feedback
    addMessage("🎮 Launching your Duolingo-style learning interface...");
    
    try {
        // Create and initialize the learning interface
        const learningInterface = new LearningInterface();
        console.log('LearningInterface created, initializing with plan...');
        console.log('Plan structure:', JSON.stringify(plan, null, 2));
        learningInterface.init(plan);
        console.log('LearningInterface initialized successfully');
        
        // Add a message about the learning interface
        addMessage("🎉 Your interactive learning interface is now active! Scroll down to see your beautiful learning cards and start your journey!");
        
        // Scroll to the learning interface
        setTimeout(() => {
            const learningInterface = document.getElementById('learning-interface');
            if (learningInterface) {
                learningInterface.scrollIntoView({ behavior: 'smooth' });
            }
        }, 500);
    } catch (error) {
        console.error('Error starting learning interface:', error);
        addMessage("❌ Sorry, there was an error starting the learning interface. Please try again.");
        addMessage("Error details: " + error.message);
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

// Start goal planning with curriculum generation button
async function startGoalPlanningWithButton(goalData) {
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

    // Start conversation with welcome message
    addMessage(`🎯 Great! I'd love to help you create a detailed plan for "${goalData.goal}". Let me ask you a few questions to make sure I give you the best possible roadmap.`);
    
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

        // Show loading state on submit button
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳';
        submitBtn.disabled = true;

        try {
            // Save goal to history with curriculum generation
            await saveGoalToHistory(goalData);

            // Always show chatbot with curriculum generation button
            await startGoalPlanningWithButton(goalData);
        } catch (error) {
            console.error('Error processing goal:', error);
            alert('Error processing your goal. Please try again.');
        } finally {
            // Restore submit button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Clear form
            goalInput.value = '';
            startDate.value = '';
            endDate.value = '';
            detailsInput.value = '';
        }
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
        
        // Generate lesson plans if structured
        let lessonPlans = null;
        if (goalData.structured) {
            try {
                const planGenerator = new LearningPlanGenerator();
                const constraints = {
                    dailyMinutes: 60,
                    daysPerWeek: 5,
                    priorSkill: 'beginner',
                    accessibility: []
                };
                
                const plan = planGenerator.generatePlan(
                    goalData.goal,
                    goalData.startDate,
                    goalData.endDate,
                    constraints
                );
                lessonPlans = plan;
            } catch (error) {
                console.error('Error generating lesson plans:', error);
            }
        }
        
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
            lessonPlans: lessonPlans,
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
}

// Generate mock progress data for demonstration
function generateMockProgress(goalData) {
    const totalDays = calculateDaysBetween(goalData.startDate, goalData.endDate);
    const daysPassed = calculateDaysBetween(goalData.startDate, new Date().toISOString().split('T')[0]);
    
    // Mock progress calculation
    const progressPercentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
    const totalLessons = Math.floor(Math.random() * 20) + 10; // Random between 10-30 lessons
    const completedLessons = Math.floor((progressPercentage / 100) * totalLessons);
    
    return {
        percentage: Math.round(progressPercentage),
        completed: completedLessons,
        total: totalLessons,
        status: progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'in-progress' : 'not-started'
    };
}

// Calculate days between two dates
function calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Load history from localStorage and display it
function loadAndDisplayHistory() {
    try {
        const historyKey = 'strive-goal-history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const historyContent = document.getElementById('historyContent');
        
        if (!historyContent) return;
        
        // Clear existing content
        historyContent.innerHTML = '';
        
        if (history.length === 0) {
            historyContent.innerHTML = `
                <div class="history-empty">
                    <p style="text-align: center; color: #6b7280; font-style: italic; margin: 20px 0;">
                        No past quests yet. Create your first goal to see it here! ✨
                    </p>
                </div>
            `;
            return;
        }
        
        // Render each history item
        history.forEach((item, index) => {
            const historyItem = createHistoryItemElement(item, index);
            historyContent.appendChild(historyItem);
        });
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// Create HTML element for a history item
function createHistoryItemElement(item, index) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.style.animationDelay = `${index * 0.1}s`; // Stagger animation
    
    const progressPercentage = item.progress.percentage;
    const progressText = `${item.progress.completed} / ${item.progress.total} lessons completed`;
    
    // Check if this item has lesson plans
    const hasLessonPlans = item.lessonPlans && item.lessonPlans.categories && item.lessonPlans.categories.length > 0;
    
    historyItem.innerHTML = `
        <div class="history-item-title">${escapeHtml(item.title)}</div>
        <div class="history-item-dates">${formatDateRange(item.startDate, item.endDate)}</div>
        <div class="history-item-progress">
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="progress-text">${progressText}</div>
        </div>
        ${item.notes ? `<div class="history-item-notes">${escapeHtml(item.notes)}</div>` : ''}
        ${hasLessonPlans ? `
            <div class="history-lesson-cards">
                <h4>📚 Your Learning Cards</h4>
                <div class="lesson-cards-preview">
                    ${generateLessonCardsPreview(item.lessonPlans)}
                </div>
            </div>
        ` : ''}
        <div class="history-item-actions">
            <button class="history-btn view" data-goal-id="${item.id}">View Plan</button>
            ${hasLessonPlans ? `<button class="history-btn lessons" data-goal-id="${item.id}">Open Lessons</button>` : ''}
            <button class="history-btn regenerate" data-goal-id="${item.id}">Regenerate</button>
        </div>
    `;
    
    return historyItem;
}

// Generate lesson cards preview for history
function generateLessonCardsPreview(lessonPlans) {
    if (!lessonPlans || !lessonPlans.categories) return '';
    
    let preview = '';
    let cardCount = 0;
    const maxCards = 6; // Show max 6 cards in preview
    
    for (const category of lessonPlans.categories) {
        if (cardCount >= maxCards) break;
        
        for (const lesson of category.lessons) {
            if (cardCount >= maxCards) break;
            
            preview += `
                <div class="lesson-card-mini">
                    <div class="lesson-card-mini-icon">${getLessonIcon(lesson)}</div>
                    <div class="lesson-card-mini-content">
                        <div class="lesson-card-mini-title">${lesson.title}</div>
                        <div class="lesson-card-mini-meta">
                            <span class="lesson-difficulty">🎯 ${lesson.difficulty}</span>
                            <span class="lesson-duration">⏱️ ${lesson.duration}</span>
                        </div>
                    </div>
                </div>
            `;
            cardCount++;
        }
    }
    
    if (cardCount < getTotalLessonCount(lessonPlans)) {
        preview += `<div class="lesson-card-mini more">+${getTotalLessonCount(lessonPlans) - cardCount} more lessons</div>`;
    }
    
    return preview;
}

// Get total lesson count from lesson plans
function getTotalLessonCount(lessonPlans) {
    if (!lessonPlans || !lessonPlans.categories) return 0;
    return lessonPlans.categories.reduce((total, category) => total + category.lessons.length, 0);
}

// Get lesson icon based on lesson type
function getLessonIcon(lesson) {
    const icons = {
        'lesson': '📖',
        'checkpoint': '🎯',
        'review': '🔄',
        'practice': '💪',
        'assessment': '📝'
    };
    return icons[lesson.type] || '📚';
}

// Format date range for display
function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatOptions = { month: 'short', day: 'numeric' };
    const startFormatted = start.toLocaleDateString('en-US', formatOptions);
    const endFormatted = end.toLocaleDateString('en-US', formatOptions);
    
    return `${startFormatted} → ${endFormatted}`;
}

// Gemini API Integration
// =====================
// Functions for generating curriculum using Gemini API (Chrome Prompt API or Cloud API)

// Generate curriculum using Gemini API
async function generateCurriculum(goalData) {
    try {
        // Check if we have the Prompt API available (Chrome 138+)
        // Temporarily use mock curriculum due to Prompt API performance issues
        console.log('Using mock curriculum (Prompt API temporarily disabled due to performance)');
        return generateMockCurriculum(goalData);
        
        /* Original Prompt API code - disabled due to performance issues
        if (languageModelSession) {
            return await generateCurriculumWithPromptAPI(goalData);
        } else {
            // Fallback to mock curriculum if API not available
            console.log('Prompt API not available, generating mock curriculum');
            return generateMockCurriculum(goalData);
        }
        */
    } catch (error) {
        console.error('Error generating curriculum:', error);
        return generateMockCurriculum(goalData);
    }
}

// Generate curriculum using Chrome's Prompt API (Gemini Nano)
async function generateCurriculumWithPromptAPI(goalData) {
    try {
        const prompt = `Create a concise curriculum for: "${goalData.goal}" (${goalData.startDate} to ${goalData.endDate}). Include 5-6 modules with topics, timeline, and key resources. Keep it practical and actionable.`;

        // Use promptStreaming with AbortController like the original working version
        console.log('About to call promptStreaming...');
        const controller = new AbortController();
        
        // Add timeout to collect partial response
        const timeoutId = setTimeout(() => {
            console.log('Prompt API timeout, using partial response...');
            controller.abort();
        }, 15000); // 15 second timeout
        
        try {
            const stream = await languageModelSession.promptStreaming(prompt, { signal: controller.signal });
            console.log('Got stream, processing chunks...');
            
            let fullResponse = '';
            let chunkCount = 0;
            for await (const chunk of stream) {
                console.log('Received chunk:', chunk);
                fullResponse += chunk;
                chunkCount++;
                
                // If we have a reasonable amount of content, we can use it
                if (chunkCount > 50 && fullResponse.length > 500) {
                    console.log('Got substantial response, continuing...');
                }
            }
            
            clearTimeout(timeoutId);
            console.log('Stream complete, full response length:', fullResponse.length);
            return fullResponse;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError' && fullResponse.length > 100) {
                console.log('Using partial response due to timeout:', fullResponse.length, 'characters');
                return fullResponse + '\n\n*[Response was truncated due to timeout]*';
            }
            throw error;
        }
    } catch (error) {
        console.error('Error with Prompt API:', error);
        throw error;
    }
}

// Generate Duolingo-style curriculum using CurriculumForge
function generateMockCurriculum(goalData) {
    const totalDays = calculateDaysBetween(goalData.startDate, goalData.endDate);
    const weeks = Math.ceil(totalDays / 7);
    const units = Math.min(weeks, 8); // Max 8 units
    const lessonsPerUnit = Math.ceil(35 / units); // ~35 total lessons
    
    return generateCurriculumForgePlan(goalData, units, lessonsPerUnit, totalDays);
}

// CurriculumForge: Generate Duolingo-style learning plan
function generateCurriculumForgePlan(goalData, units, lessonsPerUnit, totalDays) {
    const startDate = new Date(goalData.startDate);
    const endDate = new Date(goalData.endDate);
    
    return `# 🎯 ${goalData.goal} - Duolingo-Style Learning Journey

## 📊 Your Learning Stats
- **Total Days**: ${totalDays} days
- **Units**: ${units} units
- **Lessons**: ${units * lessonsPerUnit} lessons
- **Daily Goal**: 15-20 minutes
- **Hearts**: 5 ❤️ (lose 1 for wrong answers, earn back with practice)
- **Streak**: 0 🔥 (maintain daily learning)

---

## 🗓️ **DAILY SCHEDULE**

${generateDailySchedule(startDate, endDate, units, lessonsPerUnit)}

---

## 📚 **UNIT BREAKDOWN**

${generateUnits(goalData, units, lessonsPerUnit)}

---

## 🎮 **GAMIFICATION SYSTEM**

### XP & Progression
- **Lesson Complete**: 10 XP
- **Perfect Lesson**: +5 XP bonus
- **Checkpoint Pass**: 50 XP
- **Unit Complete**: 100 XP
- **Streak Milestones**: 7 days (25 XP), 30 days (100 XP)

### Hearts System ❤️
- **Start with**: 5 hearts
- **Lose heart**: Wrong answer in quiz
- **Regain heart**: Complete practice lesson
- **No hearts**: Must review previous lessons

### Streaks 🔥
- **Daily learning**: Maintains streak
- **Miss a day**: Streak resets
- **Longest streak**: Personal record tracking

---

## 🎯 **ADAPTIVE DIFFICULTY**

### Performance Tracking
- **Accuracy Rate**: Adjusts lesson difficulty
- **Time per Lesson**: Faster = harder content
- **Error Patterns**: Focuses on weak areas

### Difficulty Levels (1-5)
- **Level 1**: Absolute beginner
- **Level 2**: Basic understanding  
- **Level 3**: Intermediate skills
- **Level 4**: Advanced application
- **Level 5**: Expert mastery

---

## 🏆 **CHECKPOINTS & ASSESSMENTS**

${generateCheckpoints(units)}

---

## 🎉 **MOTIVATION & CELEBRATIONS**

### Daily Nudges
- "Ready to level up? 🌟"
- "Your streak is on fire! 🔥"
- "Just 10 minutes to keep your streak alive!"

### Level-Up Celebrations
- "🎊 LEVEL UP! You're getting stronger!"
- "🏆 Unit Complete! You're unstoppable!"
- "💎 Perfect Score! You're a learning machine!"

---

## 📱 **INTEGRATION FEATURES**

### Todo List Sync
- Daily lessons appear in your todo list
- Check off completed lessons
- Track progress across all units

### History Tracking
- View past lessons and performance
- Identify patterns in your learning
- Celebrate achievements over time

---

*🎮 Ready to start your learning adventure? Let's make ${goalData.goal} happen!*`;
}

// Generate daily schedule
function generateDailySchedule(startDate, endDate, units, lessonsPerUnit) {
    const schedule = [];
    const totalLessons = units * lessonsPerUnit;
    let currentDate = new Date(startDate);
    let lessonNumber = 1;
    
    for (let unit = 1; unit <= units; unit++) {
        schedule.push(`\n### 📅 Unit ${unit} (${currentDate.toLocaleDateString()} - ${new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()})`);
        
        for (let lesson = 1; lesson <= lessonsPerUnit && lessonNumber <= totalLessons; lesson++) {
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
            schedule.push(`- **Day ${lessonNumber}** (${dayName}): Lesson ${lessonNumber} - ${getLessonTitle(unit, lesson)}`);
            currentDate.setDate(currentDate.getDate() + 1);
            lessonNumber++;
        }
        
        if (lessonNumber <= totalLessons) {
            schedule.push(`- **Checkpoint**: Review and assessment`);
        }
    }
    
    return schedule.join('\n');
}

// Generate units with lessons
function generateUnits(goalData, units, lessonsPerUnit) {
    const unitTitles = [
        "Foundation Basics",
        "Core Concepts", 
        "Practical Skills",
        "Advanced Techniques",
        "Real Applications",
        "Mastery Practice",
        "Expert Level",
        "Capstone Project"
    ];
    
    return unitTitles.slice(0, units).map((title, index) => {
        const unitNumber = index + 1;
        const lessons = [];
        
        for (let lesson = 1; lesson <= lessonsPerUnit; lesson++) {
            const lessonNumber = (unitNumber - 1) * lessonsPerUnit + lesson;
            lessons.push(generateLesson(unitNumber, lesson, lessonNumber));
        }
        
        return `
### 🎯 Unit ${unitNumber}: ${title}
${lessons.join('\n')}

**Checkpoint**: Complete assessment to unlock Unit ${unitNumber + 1}
`;
    }).join('\n');
}

// Generate individual lesson
function generateLesson(unit, lesson, lessonNumber) {
    const drillTypes = [
        "Multiple Choice Quiz",
        "Fill-in-the-Blank", 
        "Order the Steps",
        "Label the Diagram",
        "Flash Card Match",
        "Speed Round",
        "Error Fixing",
        "Mini Reflection"
    ];
    
    const selectedDrills = drillTypes.slice(0, Math.floor(Math.random() * 4) + 3);
    
    return `
#### 📖 Lesson ${lessonNumber}: ${getLessonTitle(unit, lesson)}
- **Goal**: ${getLessonGoal(unit, lesson)}
- **Duration**: 15-20 minutes
- **Difficulty**: ${Math.floor(Math.random() * 3) + 1}/5
- **XP Reward**: 10 XP
- **Drills**: ${selectedDrills.join(', ')}
- **Tiny Win**: "${getTinyWinMessage()}"
`;
}

// Generate checkpoints
function generateCheckpoints(units) {
    const checkpoints = [];
    
    for (let i = 1; i <= units; i++) {
        checkpoints.push(`
### 🏁 Checkpoint ${i}
- **When**: After Unit ${i}
- **Format**: 10-question assessment
- **Pass Threshold**: 70% accuracy
- **Reward**: 50 XP + Unlock next unit
- **Retry**: Available after 24 hours
- **Review Plan**: Focus on missed concepts`);
    }
    
    return checkpoints.join('\n');
}

// Helper functions
function getLessonTitle(unit, lesson) {
    const titles = [
        "Getting Started", "Building Blocks", "Core Concepts", "Practice Time",
        "Skill Building", "Real Examples", "Advanced Tips", "Mastery Focus"
    ];
    return titles[lesson % titles.length];
}

function getLessonGoal(unit, lesson) {
    const goals = [
        "Understand basic concepts", "Apply new skills", "Practice with examples",
        "Build confidence", "Master key techniques", "Solve real problems"
    ];
    return goals[lesson % goals.length];
}

function getTinyWinMessage() {
    const messages = [
        "You're getting it! 🌟", "Nice work! 🎯", "You're on fire! 🔥",
        "Amazing progress! 💪", "You're unstoppable! 🚀", "Keep it up! ⭐"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
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

// Handle Open Lessons button click
function handleOpenLessons(goalId) {
    try {
        const historyKey = 'strive-goal-history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const goal = history.find(item => item.id === goalId);
        
        if (!goal) {
            console.error('Goal not found:', goalId);
            return;
        }
        
        if (!goal.lessonPlans) {
            console.error('No lesson plans found for goal:', goalId);
            alert('No lesson plans available for this goal.');
            return;
        }
        
        // Open lessons from history
        openLessonsFromHistory(goal);
        
    } catch (error) {
        console.error('Error opening lessons:', error);
        alert('Error loading lessons. Please try again.');
    }
}

// Open lessons from history
function openLessonsFromHistory(goal) {
    console.log('Opening lessons from history for goal:', goal.title);
    
    // Create learning interface with the saved lesson plans
    const learningInterface = new LearningInterface(goal.lessonPlans);
    learningInterface.setupInterface();
    
    // Scroll to the learning interface
    setTimeout(() => {
        const learningContainer = document.getElementById('learning-interface');
        if (learningContainer) {
            learningContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
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

// Show curriculum modal
function showCurriculumModal(title, content) {
    const modal = document.getElementById('curriculumModal');
    const titleEl = document.getElementById('curriculumTitle');
    const contentEl = document.getElementById('curriculumContent');
    
    titleEl.textContent = title;
    
    if (content === 'Generating new curriculum...') {
        contentEl.innerHTML = '<div class="curriculum-loading">🔄 Generating new curriculum...</div>';
    } else if (content) {
        contentEl.innerHTML = markdownToHtml(content);
    } else {
        contentEl.innerHTML = '<div class="curriculum-error">No curriculum available for this goal.</div>';
    }
    
    modal.style.display = 'flex';
}

// Hide curriculum modal
function hideCurriculumModal() {
    const modal = document.getElementById('curriculumModal');
    modal.style.display = 'none';
}

// Add event listeners for history buttons
function addHistoryEventListeners() {
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;
    
    // Use event delegation for dynamically added buttons
    historyContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('history-btn')) {
            const goalId = e.target.getAttribute('data-goal-id');
            
            if (e.target.classList.contains('view')) {
                handleViewPlan(goalId);
            } else if (e.target.classList.contains('lessons')) {
                handleOpenLessons(goalId);
            } else if (e.target.classList.contains('regenerate')) {
                handleRegeneratePlan(goalId);
            }
        }
    });
}

// Add event listeners for curriculum modal
function addCurriculumModalEventListeners() {
    const curriculumModal = document.getElementById('curriculumModal');
    const closeCurriculum = document.getElementById('closeCurriculum');
    
    if (closeCurriculum) {
        closeCurriculum.addEventListener('click', hideCurriculumModal);
    }
    
    if (curriculumModal) {
        // Close modal when clicking outside
        curriculumModal.addEventListener('click', (e) => {
            if (e.target === curriculumModal) {
                hideCurriculumModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && curriculumModal.style.display === 'flex') {
                hideCurriculumModal();
            }
        });
    }
}

// Initialize sample data for demonstration
function initializeSampleData() {
    const historyKey = 'strive-goal-history';
    const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // Only add sample data if no history exists
    if (existingHistory.length === 0) {
        const sampleGoals = [
            {
                id: 'sample-1',
                title: 'Learn Spanish in 6 months',
                startDate: '2024-01-15',
                endDate: '2024-07-15',
                details: 'Focus on conversational Spanish for travel',
                structured: true,
                createdAt: '2024-01-15T10:00:00.000Z',
                curriculum: generateMockCurriculum({
                    goal: 'Learn Spanish in 6 months',
                    startDate: '2024-01-15',
                    endDate: '2024-07-15',
                    details: 'Focus on conversational Spanish for travel',
                    structured: true
                }),
                progress: { percentage: 65, completed: 13, total: 20, status: 'in-progress' },
                notes: 'Focus on conversational Spanish for travel'
            },
            {
                id: 'sample-2',
                title: 'Complete React Certification',
                startDate: '2024-02-01',
                endDate: '2024-04-01',
                details: 'Build 3 portfolio projects',
                structured: true,
                createdAt: '2024-02-01T14:30:00.000Z',
                curriculum: generateMockCurriculum({
                    goal: 'Complete React Certification',
                    startDate: '2024-02-01',
                    endDate: '2024-04-01',
                    details: 'Build 3 portfolio projects',
                    structured: true
                }),
                progress: { percentage: 100, completed: 15, total: 15, status: 'completed' },
                notes: 'Build 3 portfolio projects'
            },
            {
                id: 'sample-3',
                title: 'Read 12 Books This Year',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                details: 'Mix of fiction and non-fiction',
                structured: false,
                createdAt: '2024-01-01T09:00:00.000Z',
                curriculum: generateMockCurriculum({
                    goal: 'Read 12 Books This Year',
                    startDate: '2024-01-01',
                    endDate: '2024-12-31',
                    details: 'Mix of fiction and non-fiction',
                    structured: false
                }),
                progress: { percentage: 25, completed: 3, total: 12, status: 'in-progress' },
                notes: 'Mix of fiction and non-fiction'
            }
        ];
        
        localStorage.setItem(historyKey, JSON.stringify(sampleGoals));
        console.log('Sample data initialized');
    }
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
}

// Todo Management System
// =====================
// Functions for parsing curriculum and managing todo tasks

// Parse Duolingo-style curriculum to extract lessons and tasks
function parseCurriculumToTasks(curriculum, courseTitle) {
    if (!curriculum) return [];
    
    const tasks = [];
    const lines = curriculum.split('\n');
    let currentUnit = 0;
    let lessonNumber = 0;
    
    // Look for lesson patterns in the curriculum
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match lesson patterns like "#### 📖 Lesson X:"
        const lessonMatch = line.match(/^#### 📖 Lesson (\d+): (.+)$/);
        if (lessonMatch) {
            lessonNumber = parseInt(lessonMatch[1]);
            const lessonTitle = lessonMatch[1];
            
            // Extract lesson details from following lines
            let goal = '';
            let duration = '15-20 minutes';
            let difficulty = '1/5';
            let xpReward = '10 XP';
            
            // Look ahead for lesson details
            for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                const detailLine = lines[j].trim();
                if (detailLine.startsWith('- **Goal**:')) {
                    goal = detailLine.replace('- **Goal**:', '').trim();
                } else if (detailLine.startsWith('- **Duration**:')) {
                    duration = detailLine.replace('- **Duration**:', '').trim();
                } else if (detailLine.startsWith('- **Difficulty**:')) {
                    difficulty = detailLine.replace('- **Difficulty**:', '').trim();
                } else if (detailLine.startsWith('- **XP Reward**:')) {
                    xpReward = detailLine.replace('- **XP Reward**:', '').trim();
                } else if (detailLine.startsWith('####') || detailLine.startsWith('###')) {
                    break; // Next lesson or unit
                }
            }
            
            // Generate due date based on lesson number
            const dueDate = generateLessonDueDate(lessonNumber);
            
            tasks.push({
                id: `${courseTitle}-lesson-${lessonNumber}-${Date.now()}`,
                title: `📖 Lesson ${lessonNumber}: ${lessonTitle}`,
                subtitle: goal,
                due: dueDate,
                done: false,
                courseTitle: courseTitle,
                type: 'lesson',
                duration: duration,
                difficulty: difficulty
            });
        }
        
        // Match checkpoint patterns
        const checkpointMatch = line.match(/^### 🏁 Checkpoint (\d+)$/);
        if (checkpointMatch) {
            const checkpointNumber = parseInt(checkpointMatch[1]);
            const dueDate = generateCheckpointDueDate(checkpointNumber);
            
            tasks.push({
                id: `${courseTitle}-checkpoint-${checkpointNumber}-${Date.now()}`,
                title: `🏁 Checkpoint ${checkpointNumber}`,
                subtitle: 'Assessment & Review',
                due: dueDate,
                done: false,
                courseTitle: courseTitle,
                type: 'checkpoint',
                duration: '30 minutes',
                difficulty: '3/5'
            });
        }
    }
    
    // If no lessons found, create default learning tasks
    if (tasks.length === 0) {
        tasks.push(
            {
                id: `${courseTitle}-lesson-1-${Date.now()}`,
                title: "📖 Lesson 1: Getting Started",
                subtitle: "Understand basic concepts",
                due: "Today",
                done: false,
                courseTitle: courseTitle,
                type: 'lesson',
                duration: '15-20 minutes',
                difficulty: '1/5'
            },
            {
                id: `${courseTitle}-lesson-2-${Date.now()}`,
                title: "📖 Lesson 2: Building Blocks", 
                subtitle: "Apply new skills",
                due: "Tomorrow",
                done: false,
                courseTitle: courseTitle,
                type: 'lesson',
                duration: '15-20 minutes',
                difficulty: '2/5'
            },
            {
                id: `${courseTitle}-checkpoint-1-${Date.now()}`,
                title: "🏁 Checkpoint 1",
                subtitle: "Assessment & Review",
                due: "In 3 days",
                done: false,
                courseTitle: courseTitle,
                type: 'checkpoint',
                duration: '30 minutes',
                difficulty: '3/5'
            }
        );
    }
    
    return tasks.slice(0, 12); // Limit to 12 tasks per course
}

// Generate lesson due date based on lesson number
function generateLessonDueDate(lessonNumber) {
    const now = new Date();
    const daysAhead = lessonNumber; // One lesson per day
    const dueDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
    
    if (lessonNumber === 1) return "Today";
    if (lessonNumber === 2) return "Tomorrow";
    
    const options = { month: 'short', day: 'numeric' };
    return dueDate.toLocaleDateString('en-US', options);
}

// Generate checkpoint due date
function generateCheckpointDueDate(checkpointNumber) {
    const now = new Date();
    const daysAhead = (checkpointNumber * 7) + 3; // Every 7 days + 3 days buffer
    const dueDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
    
    const options = { month: 'short', day: 'numeric' };
    return dueDate.toLocaleDateString('en-US', options);
}

// Generate mock due date based on task position (legacy)
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
                    No active courses. Create a new goal to see today's tasks here! ✨
                </div>
            `;
            return;
        }
        
        // Parse tasks from each course and filter for today only
        const allTasks = [];
        const today = new Date().toLocaleDateString('en-US');
        
        activeCourses.forEach(course => {
            if (course.curriculum) {
                const tasks = parseCurriculumToTasks(course.curriculum, course.title);
                // Apply saved completion states and filter for today
                tasks.forEach(task => {
                    if (savedTasks[task.id]) {
                        task.done = savedTasks[task.id].done;
                    }
                    // Only include tasks due today
                    if (task.due === today) {
                        allTasks.push(task);
                    }
                });
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
        
        // No stats header - keep it simple
        
        // Render tasks grouped by course
        console.log('Rendering courses:', Object.keys(tasksByCourse));
        console.log('Total tasks to render:', allTasks.length);
        
        if (Object.keys(tasksByCourse).length === 0) {
            todoContent.innerHTML = `
                <div class="todo-empty">
                    No tasks for today! 🎉 Check back tomorrow for new tasks.
                </div>
            `;
            return;
        }
        
        Object.keys(tasksByCourse).forEach(courseTitle => {
            console.log('Creating course group for:', courseTitle, 'with', tasksByCourse[courseTitle].length, 'tasks');
            const courseGroup = createCourseGroupElement(courseTitle, tasksByCourse[courseTitle]);
            todoContent.appendChild(courseGroup);
        });
        
    } catch (error) {
        console.error('Error updating todo list:', error);
    }
}

// Create learning stats header
function createLearningStatsHeader(allTasks) {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'learning-stats';
    
    // Calculate stats
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(task => task.done).length;
    
    statsDiv.innerHTML = `
        <div class="stat-item">
            <span>📚</span>
            <span>Progress: <span class="stat-value">${completedTasks}/${totalTasks}</span></span>
        </div>
        <div class="stat-item">
            <span>✅</span>
            <span>Completed: <span class="stat-value">${completedTasks}</span></span>
        </div>
        <div class="stat-item">
            <span>⏳</span>
            <span>Remaining: <span class="stat-value">${totalTasks - completedTasks}</span></span>
        </div>
    `;
    
    return statsDiv;
}

// Create course group element with card grid
function createCourseGroupElement(courseTitle, tasks) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'course-group';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'course-header';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'course-title';
    titleDiv.textContent = courseTitle;
    
    // Simple course title only - no progress bars or stats
    headerDiv.appendChild(titleDiv);
    
    const tasksDiv = document.createElement('div');
    tasksDiv.className = 'todo-tasks-list';
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        tasksDiv.appendChild(taskElement);
    });
    
    groupDiv.appendChild(headerDiv);
    groupDiv.appendChild(tasksDiv);
    
    return groupDiv;
}

// Create individual task element as a simple checklist item
function createTaskElement(task) {
    console.log('Creating todo item for task:', task.title, 'type:', task.type);
    const taskDiv = document.createElement('div');
    taskDiv.className = `todo-item ${task.done ? 'completed' : ''}`;
    taskDiv.setAttribute('data-task-id', task.id);
    
    // Create checkbox and label
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.className = 'todo-checkbox';
    
    const label = document.createElement('label');
    label.className = 'todo-label';
    label.innerHTML = formatBoldText(task.title);
    
    // Create task details
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'todo-details';
    
    if (task.subtitle) {
        const subtitleDiv = document.createElement('div');
        subtitleDiv.className = 'todo-subtitle';
        subtitleDiv.textContent = task.subtitle;
        detailsDiv.appendChild(subtitleDiv);
    }
    
    // Create meta info
    const metaDiv = document.createElement('div');
    metaDiv.className = 'todo-meta';
    
    if (task.difficulty) {
        const difficultySpan = document.createElement('span');
        difficultySpan.className = 'todo-difficulty';
        difficultySpan.textContent = `Difficulty: ${task.difficulty}`;
        metaDiv.appendChild(difficultySpan);
    }
    
    if (task.duration) {
        const durationSpan = document.createElement('span');
        durationSpan.className = 'todo-duration';
        durationSpan.textContent = `Duration: ${task.duration}`;
        metaDiv.appendChild(durationSpan);
    }
    
    const dueSpan = document.createElement('span');
    dueSpan.className = 'todo-due';
    dueSpan.textContent = `Due: ${task.due}`;
    metaDiv.appendChild(dueSpan);
    
    // Assemble the todo item
    taskDiv.appendChild(checkbox);
    taskDiv.appendChild(label);
    if (detailsDiv.children.length > 0) {
        taskDiv.appendChild(detailsDiv);
    }
    if (metaDiv.children.length > 0) {
        taskDiv.appendChild(metaDiv);
    }
    
    // Add click handler for completion toggle
    taskDiv.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
        }
        handleTaskToggle(task.id);
    });
    
    return taskDiv;
}

// Get appropriate icon for lesson type
function getLessonIcon(task) {
    if (task.type === 'checkpoint') {
        return '🏁';
    } else if (task.done) {
        return '✅';
    } else {
        return '📖';
    }
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

// Start the app when page loads
initApp();
