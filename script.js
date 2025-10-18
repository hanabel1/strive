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

        // Stream the plan progressively
        await streamPlan(plan);

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

        // Show loading state on submit button
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '⏳';
        submitBtn.disabled = true;

        try {
            // Save goal to history with curriculum generation
            await saveGoalToHistory(goalData);

            if (languageModelSession) {
                await startGoalPlanning(goalData);
            } else {
                alert('AI assistant is not available. Please enable the Prompt API in Chrome 138+ with the required flags.');
            }
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
        <div class="history-item-actions">
            <button class="history-btn view" data-goal-id="${item.id}">View Plan</button>
            <button class="history-btn regenerate" data-goal-id="${item.id}">Regenerate</button>
        </div>
    `;
    
    return historyItem;
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
        if (languageModelSession) {
            return await generateCurriculumWithPromptAPI(goalData);
        } else {
            // Fallback to mock curriculum if API not available
            console.log('Prompt API not available, generating mock curriculum');
            return generateMockCurriculum(goalData);
        }
    } catch (error) {
        console.error('Error generating curriculum:', error);
        return generateMockCurriculum(goalData);
    }
}

// Generate curriculum using Chrome's Prompt API (Gemini Nano)
async function generateCurriculumWithPromptAPI(goalData) {
    try {
        const prompt = `Create a detailed, structured curriculum plan for this learning goal:

Goal: "${goalData.goal}"
Timeline: ${goalData.startDate} to ${goalData.endDate}
Details: ${goalData.details || 'No additional details provided'}
Structured Learning: ${goalData.structured ? 'Yes' : 'No'}

Please provide a comprehensive curriculum with:
1. 5-7 main learning modules/phases
2. Specific topics and skills for each module
3. Suggested timeline for each module
4. Recommended resources (books, courses, practice exercises)
5. Milestones and assessment points
6. Practical projects or exercises

Format as a clear, structured plan that can be followed step-by-step.`;

        const response = await languageModelSession.prompt(prompt);
        return response;
    } catch (error) {
        console.error('Error with Prompt API:', error);
        throw error;
    }
}

// Generate mock curriculum for demonstration
function generateMockCurriculum(goalData) {
    const modules = [
        "Foundation & Basics",
        "Core Concepts & Theory", 
        "Practical Application",
        "Advanced Techniques",
        "Real-world Projects",
        "Review & Mastery"
    ];
    
    return `# ${goalData.goal} - Learning Curriculum

## Overview
A structured learning path designed to help you achieve your goal of "${goalData.goal}" within your timeline of ${goalData.startDate} to ${goalData.endDate}.

## Learning Modules

${modules.map((module, index) => `
### ${index + 1}. ${module}
- **Duration**: 1-2 weeks
- **Focus**: [Specific topics will be generated based on your goal]
- **Resources**: Recommended materials and exercises
- **Milestone**: Key achievement to track progress
`).join('')}

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
    
    // Add event listeners for history buttons
    addHistoryEventListeners();
    
    // Add event listeners for curriculum modal
    addCurriculumModalEventListeners();
}

// Start the app when page loads
initApp();
