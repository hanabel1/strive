class LearningInterface {
    constructor() {
        this.currentLesson = null;
        this.userProgress = {
            xp: 0,
            hearts: 5,
            maxHearts: 5,
            streak: 0,
            level: 1,
            lessonsCompleted: 0,
            savedLessons: []
        };
        this.isLessonActive = false;
    }

    /**
     * Initialize the learning interface
     */
    init(plan) {
        console.log('LearningInterface init called with plan:', plan);
        this.plan = plan;
        this.setupInterface();
        this.loadUserProgress();
    }

    /**
     * Setup the learning interface UI
     */
    setupInterface() {
        // Create the main learning interface container
        const learningContainer = document.createElement('div');
        learningContainer.id = 'learning-interface';
        learningContainer.className = 'learning-interface';
        learningContainer.innerHTML = `
            <div class="learning-header">
                <div class="learning-stats">
                    <div class="stat-circle progress">
                        <span class="stat-icon">📚</span>
                        <span class="stat-value" id="userProgress">0%</span>
                    </div>
                    <div class="stat-circle completed">
                        <span class="stat-icon">✅</span>
                        <span class="stat-value" id="userCompleted">0</span>
                    </div>
                    <div class="stat-circle remaining">
                        <span class="stat-icon">⏳</span>
                        <span class="stat-value" id="userRemaining">0</span>
                    </div>
                </div>
                <div class="learning-title">
                    <h2>${this.plan.goal || 'Learning Journey'}</h2>
                    <div class="progress-ring">
                        <svg class="progress-ring-svg" width="60" height="60">
                            <circle class="progress-ring-circle" stroke="#e2e8f0" stroke-width="4" fill="transparent" r="26" cx="30" cy="30"/>
                            <circle class="progress-ring-fill" stroke="#4ade80" stroke-width="4" fill="transparent" r="26" cx="30" cy="30" id="progressCircle"/>
                        </svg>
                        <span class="progress-text" id="progressText">0%</span>
                    </div>
                </div>
                <div class="learning-actions">
                    <button class="fullscreen-btn" id="fullscreenBtn" title="Open in Fullscreen">
                        <span class="fullscreen-icon">⛶</span>
                    </button>
                    <button class="close-interface-btn" id="closeInterfaceBtn" title="Close Interface">
                        <span class="close-icon">×</span>
                    </button>
                </div>
            </div>
            
            <div class="learning-content">
                <div class="learning-path" id="learningPath">
                    <div style="padding: 20px; text-align: center; background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px; margin: 20px 0;">
                        <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">🎓 Interactive Learning Interface</h3>
                        <p style="color: #0369a1; margin: 0;">Loading your personalized learning cards...</p>
                    </div>
                </div>
            </div>
        `;

        // Add to the chatbot messages
        const chatbotMessages = document.getElementById('chatbotMessages');
        console.log('Adding learning container to chatbot messages:', chatbotMessages);
        
        if (chatbotMessages) {
        chatbotMessages.appendChild(learningContainer);
            console.log('Learning container added successfully');
            
            // Force visibility and scroll to it
            learningContainer.style.display = 'block';
            learningContainer.style.visibility = 'visible';
            learningContainer.style.opacity = '1';
            learningContainer.style.position = 'relative';
            learningContainer.style.zIndex = '1000';
            
            // Scroll to the learning interface
            setTimeout(() => {
                learningContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                console.log('Scrolled to learning interface');
            }, 100);
        } else {
            console.error('chatbotMessages element not found!');
        }

        // Setup event listeners
        this.setupEventListeners();
        
        // Populate the learning path
        this.createLearningPath();
        
        // Debug: Check if the learning interface is in the DOM
        setTimeout(() => {
            const learningInterface = document.getElementById('learning-interface');
            console.log('Learning interface in DOM:', learningInterface);
            console.log('Learning interface visible:', learningInterface ? learningInterface.offsetHeight > 0 : false);
            console.log('Learning interface parent:', learningInterface ? learningInterface.parentElement : null);
            
            if (learningInterface) {
                console.log('Learning interface dimensions:', {
                    width: learningInterface.offsetWidth,
                    height: learningInterface.offsetHeight,
                    display: getComputedStyle(learningInterface).display,
                    visibility: getComputedStyle(learningInterface).visibility,
                    opacity: getComputedStyle(learningInterface).opacity
                });
            }
        }, 200);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Close interface button
        const closeBtn = document.getElementById('closeInterfaceBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeInterface();
            });
        }
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const learningInterface = document.getElementById('learning-interface');
        if (!learningInterface) return;
        
        if (learningInterface.classList.contains('fullscreen')) {
            // Exit fullscreen
            learningInterface.classList.remove('fullscreen');
            document.body.classList.remove('learning-fullscreen');
            document.getElementById('fullscreenBtn').innerHTML = '<span class="fullscreen-icon">⛶</span>';
        } else {
            // Enter fullscreen
            learningInterface.classList.add('fullscreen');
            document.body.classList.add('learning-fullscreen');
            document.getElementById('fullscreenBtn').innerHTML = '<span class="fullscreen-icon">⛶</span>';
        }
    }
    
    /**
     * Close the learning interface
     */
    closeInterface() {
        const learningInterface = document.getElementById('learning-interface');
        if (learningInterface) {
            learningInterface.remove();
            document.body.classList.remove('learning-fullscreen');
        }
    }

    /**
     * Create Duolingo-style learning path
     */
    createLearningPath() {
        console.log('Creating learning path, plan:', this.plan);
        console.log('Plan categories:', this.plan.categories);
        
        const learningPath = document.getElementById('learningPath');
        
        if (!learningPath) {
            console.error('learningPath element not found!');
            return;
        }
        
        // Check if plan has categories
        if (!this.plan.categories || !Array.isArray(this.plan.categories)) {
            console.error('Plan does not have categories array:', this.plan);
            learningPath.innerHTML = '<div class="error-message">❌ Error: No learning categories found in plan</div>';
            return;
        }
        
        // Flatten all lessons from all categories into a single path
        const allLessons = [];
        this.plan.categories.forEach((category, categoryIndex) => {
            console.log('Processing category:', category);
            if (category.lessons && Array.isArray(category.lessons)) {
                category.lessons.forEach((lesson, lessonIndex) => {
                    allLessons.push({
                        ...lesson,
                        category: category,
                        categoryIndex: categoryIndex,
                        lessonIndex: lessonIndex,
                        globalIndex: allLessons.length
                    });
                });
            } else {
                console.warn('Category has no lessons:', category);
            }
        });
        
        console.log('All lessons created:', allLessons);
        
        // Create the learning path
        const pathContainer = document.createElement('div');
        pathContainer.className = 'duolingo-path';
        
        allLessons.forEach((lesson, index) => {
            const lessonCard = this.createLessonCard(lesson, index, allLessons.length, allLessons);
            pathContainer.appendChild(lessonCard);
        });
        
        learningPath.innerHTML = '';
        learningPath.appendChild(pathContainer);
    }
    
    /**
     * Create individual lesson card
     */
    createLessonCard(lesson, index, totalLessons, allLessons) {
        const card = document.createElement('div');
        card.className = `learning-lesson-card ${lesson.completed ? 'completed' : ''} ${lesson.locked ? 'locked' : ''}`;
        card.setAttribute('data-lesson-id', lesson.id);
        
        const isCompleted = lesson.completed || false;
        const isLocked = index > 0 && !allLessons[index - 1]?.completed;
        
        card.innerHTML = `
            <div class="lesson-card-inner">
                <div class="lesson-icon">
                    ${isCompleted ? '✅' : isLocked ? '🔒' : this.getLessonIcon(lesson)}
                </div>
                <div class="lesson-info">
                    <h4 class="lesson-title">${lesson.title}</h4>
                    <p class="lesson-description">${lesson.description}</p>
                    <div class="lesson-meta">
                        <span class="lesson-duration">${lesson.duration} min</span>
                        <span class="lesson-xp">+${lesson.xp} XP</span>
                        <span class="lesson-difficulty">${this.getDifficultyStars(lesson.difficulty)}</span>
                    </div>
                </div>
                <div class="lesson-actions">
                    ${isLocked ? 
                        '<button class="lesson-btn locked" disabled>🔒 Locked</button>' :
                        isCompleted ?
                        '<button class="lesson-btn completed">✅ Completed</button>' :
                        '<button class="lesson-btn start">▶️ Start</button>'
                    }
                </div>
            </div>
            <div class="lesson-expanded" style="display: none;">
                <div class="lesson-content">
                    <h5>🎯 What you'll learn:</h5>
                    <ul class="learning-goals">
                        ${lesson.content.keyConcepts.map(concept => `<li>${concept}</li>`).join('')}
                    </ul>
                    <h5>💪 Exercises:</h5>
                    <ul class="exercises">
                        ${lesson.content.exercises.map(exercise => `<li>${exercise}</li>`).join('')}
                    </ul>
                    <h5>📚 Resources:</h5>
                    <ul class="resources">
                        ${lesson.content.resources.map(resource => `<li>${resource}</li>`).join('')}
                    </ul>
                </div>
                <div class="lesson-controls">
                    <button class="btn-secondary" onclick="this.closest('.learning-lesson-card').querySelector('.lesson-expanded').style.display='none'">
                        Collapse
                    </button>
                    ${!isLocked && !isCompleted ? 
                        `<button class="btn-primary start-lesson" data-lesson-id="${lesson.id}">
                            Start Lesson
                        </button>` : ''
                    }
                </div>
                </div>
            `;
            
        // Add click handlers
        const cardInner = card.querySelector('.lesson-card-inner');
        const startBtn = card.querySelector('.start-lesson');
        
        cardInner.addEventListener('click', (e) => {
            if (!e.target.closest('.lesson-actions')) {
                this.toggleLessonCard(card);
            }
        });
        
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startLesson(lesson);
            });
        }
        
        return card;
    }
    
    /**
     * Toggle lesson card expansion
     */
    toggleLessonCard(card) {
        const expanded = card.querySelector('.lesson-expanded');
        const isExpanded = expanded.style.display !== 'none';
        
        if (isExpanded) {
            expanded.style.display = 'none';
            card.classList.remove('expanded');
        } else {
            expanded.style.display = 'block';
            card.classList.add('expanded');
        }
    }
    
    /**
     * Get lesson icon based on type
     */
    getLessonIcon(lesson) {
        const icons = ['📖', '💡', '🔧', '🎯', '⚡', '🌟', '🚀', '💎'];
        return icons[lesson.globalIndex % icons.length];
    }

    /**
     * Start a lesson
     */
    startLesson(lesson) {
        console.log('Starting lesson:', lesson);
        this.currentLesson = lesson;
        
        // Create lesson modal
        this.createLessonModal(lesson);
    }
    
    /**
     * Create lesson modal
     */
    createLessonModal(lesson) {
        const modal = document.createElement('div');
        modal.className = 'lesson-modal';
        modal.innerHTML = `
            <div class="lesson-modal-content">
                <div class="lesson-modal-header">
                    <h3>${lesson.title}</h3>
                    <button class="close-lesson" onclick="this.closest('.lesson-modal').remove()">&times;</button>
                </div>
                <div class="lesson-modal-body">
                    <div class="lesson-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="progress-text">Question 1 of 5</span>
                    </div>
                    <div class="lesson-question">
                        <h4>What is the correct answer?</h4>
                        <div class="question-options">
                            <button class="option-btn" data-correct="false">Option A</button>
                            <button class="option-btn" data-correct="true">Option B</button>
                            <button class="option-btn" data-correct="false">Option C</button>
                            <button class="option-btn" data-correct="false">Option D</button>
                    </div>
                    </div>
                </div>
                <div class="lesson-modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.lesson-modal').remove()">Exit Lesson</button>
                    <button class="btn-primary" onclick="this.nextQuestion()">Next Question</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add question handlers
        modal.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleAnswer(e.target);
            });
        });
    }
    
    /**
     * Handle answer selection
     */
    handleAnswer(button) {
        const isCorrect = button.dataset.correct === 'true';
        
        // Remove previous selections
        button.parentElement.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
        });
        
        // Mark selection
        button.classList.add('selected');
        
        if (isCorrect) {
            button.classList.add('correct');
            this.addXP(10);
            this.showCorrectAnswer();
            } else {
            button.classList.add('incorrect');
            this.loseHeart();
            this.showIncorrectAnswer();
        }
    }

    /**
     * Show correct answer feedback
     */
    showCorrectAnswer() {
        const feedback = document.createElement('div');
        feedback.className = 'answer-feedback correct';
        feedback.innerHTML = '🎉 Correct! +10 XP';
        document.querySelector('.lesson-question').appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }
    
    /**
     * Show incorrect answer feedback
     */
    showIncorrectAnswer() {
        const feedback = document.createElement('div');
        feedback.className = 'answer-feedback incorrect';
        feedback.innerHTML = '❌ Incorrect! -1 Heart';
        document.querySelector('.lesson-question').appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 2000);
    }
    
    /**
     * Lose a heart
     */
    loseHeart() {
        if (this.userProgress.hearts > 0) {
            this.userProgress.hearts--;
            document.getElementById('userHearts').textContent = this.userProgress.hearts;
            this.saveUserProgress();
        }
    }

    /**
     * Complete a lesson
     */
    completeLesson(lesson) {
        lesson.completed = true;
        this.userProgress.lessonsCompleted++;
        this.addXP(lesson.xp);
        
        // Update the card
        const card = document.querySelector(`[data-lesson-id="${lesson.id}"]`);
        if (card) {
            card.classList.add('completed');
            card.querySelector('.lesson-icon').textContent = '✅';
            card.querySelector('.lesson-btn').textContent = '✅ Completed';
            card.querySelector('.lesson-btn').classList.remove('start');
            card.querySelector('.lesson-btn').classList.add('completed');
        }
        
        this.saveUserProgress();
        this.showLessonCompletion();
    }

    /**
     * Add XP
     */
    addXP(amount) {
        this.userProgress.xp += amount;
        document.getElementById('userXP').textContent = this.userProgress.xp;
        
        // Check for level up
        const newLevel = Math.floor(this.userProgress.xp / 1000) + 1;
        if (newLevel > this.userProgress.level) {
            this.userProgress.level = newLevel;
            document.getElementById('userLevel').textContent = this.userProgress.level;
            this.showLevelUp();
        }
    }

    /**
     * Show level up
     */
    showLevelUp() {
        const levelUp = document.createElement('div');
        levelUp.className = 'level-up-popup';
        levelUp.innerHTML = `
            <div class="level-up-content">
                <h2>🎉 Level Up!</h2>
                <p>You're now level ${this.userProgress.level}!</p>
                <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">Awesome!</button>
            </div>
        `;
        
        document.body.appendChild(levelUp);
        
        setTimeout(() => {
            levelUp.remove();
        }, 5000);
    }

    /**
     * Show save confirmation
     */
    showSaveConfirmation() {
        const confirmation = document.createElement('div');
        confirmation.className = 'save-confirmation';
        confirmation.innerHTML = `
            <div class="save-content">
                <span class="save-icon">💾</span>
                <span class="save-text">Lesson saved!</span>
            </div>
        `;
        
        document.getElementById('lessonDetail').appendChild(confirmation);
        
        setTimeout(() => {
            confirmation.remove();
        }, 3000);
    }

    /**
     * Show lesson completion
     */
    showLessonCompletion() {
        const completion = document.createElement('div');
        completion.className = 'lesson-completion';
        completion.innerHTML = `
            <div class="completion-content">
                <h2>🎉 Lesson Complete!</h2>
                <div class="xp-earned">
                    <span class="xp-icon">💎</span>
                    <span class="xp-amount">+${this.currentLesson.xp} XP</span>
                </div>
                <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">Continue Learning</button>
            </div>
        `;
        
        document.getElementById('lessonDetail').appendChild(completion);
        
        setTimeout(() => {
            completion.remove();
        }, 5000);
    }

    /**
     * Get category difficulty
     */
    getCategoryDifficulty(category) {
        const avgDifficulty = category.lessons.reduce((sum, lesson) => sum + lesson.difficulty, 0) / category.lessons.length;
        return this.getDifficultyStars(Math.round(avgDifficulty));
    }

    /**
     * Get difficulty stars
     */
    getDifficultyStars(difficulty) {
        return '⭐'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
    }

    /**
     * Load user progress
     */
    loadUserProgress() {
        const saved = localStorage.getItem('learningProgress');
        if (saved) {
            this.userProgress = { ...this.userProgress, ...JSON.parse(saved) };
        }
    }

    /**
     * Save user progress
     */
    saveUserProgress() {
        localStorage.setItem('learningProgress', JSON.stringify(this.userProgress));
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningInterface;
}