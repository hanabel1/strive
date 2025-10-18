/**
 * Interactive Learning Interface
 * Categorized lessons with save functionality
 */

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
                <div class="user-stats">
                    <div class="stat-item">
                        <span class="stat-icon">💎</span>
                        <span class="stat-value" id="userXP">${this.userProgress.xp}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">❤️</span>
                        <span class="stat-value" id="userHearts">${this.userProgress.hearts}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🔥</span>
                        <span class="stat-value" id="userStreak">${this.userProgress.streak}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">⭐</span>
                        <span class="stat-value" id="userLevel">${this.userProgress.level}</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="overallProgress" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="learning-content">
                <div class="categories-view" id="categoriesView">
                    <h2>Choose Your Learning Path</h2>
                    <div class="categories-grid" id="categoriesGrid">
                        <!-- Categories will be populated here -->
                    </div>
                </div>
                
                <div class="lessons-view" id="lessonsView" style="display: none;">
                    <div class="lessons-header">
                        <button class="back-btn" id="backToCategories">← Back to Categories</button>
                        <h3 id="categoryTitle">Category Title</h3>
                    </div>
                    <div class="lessons-grid" id="lessonsGrid">
                        <!-- Lessons will be populated here -->
                    </div>
                </div>
                
                <div class="lesson-detail" id="lessonDetail" style="display: none;">
                    <div class="lesson-header">
                        <button class="back-btn" id="backToLessons">← Back to Lessons</button>
                        <h3 id="lessonTitle">Lesson Title</h3>
                        <div class="lesson-actions">
                            <button class="btn-save" id="saveLesson">💾 Save Lesson</button>
                            <button class="btn-start" id="startLesson">▶️ Start Lesson</button>
                        </div>
                    </div>
                    
                    <div class="lesson-content" id="lessonContent">
                        <!-- Lesson content will be populated here -->
                    </div>
                </div>
            </div>
        `;

        // Add to the chatbot messages
        const chatbotMessages = document.getElementById('chatbotMessages');
        chatbotMessages.appendChild(learningContainer);

        // Setup event listeners
        this.setupEventListeners();
        
        // Populate categories
        this.populateCategories();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Back to categories button
        document.getElementById('backToCategories').addEventListener('click', () => {
            this.showCategories();
        });

        // Back to lessons button
        document.getElementById('backToLessons').addEventListener('click', () => {
            this.showLessons(this.currentCategory);
        });

        // Save lesson button
        document.getElementById('saveLesson').addEventListener('click', () => {
            this.saveCurrentLesson();
        });

        // Start lesson button
        document.getElementById('startLesson').addEventListener('click', () => {
            this.startCurrentLesson();
        });
    }

    /**
     * Populate categories (optimized)
     */
    populateCategories() {
        const categoriesGrid = document.getElementById('categoriesGrid');
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        this.plan.categories.forEach((category, index) => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'category-card';
            categoryCard.style.borderLeftColor = category.color;
            categoryCard.innerHTML = `
                <div class="category-icon">${category.title.split(' ')[0]}</div>
                <h4>${category.title}</h4>
                <p>${category.description}</p>
                <div class="category-stats">
                    <span class="lesson-count">${category.lessons.length} lessons</span>
                    <span class="difficulty">${this.getCategoryDifficulty(category)}</span>
                </div>
                <div class="category-progress">
                    <div class="progress-bar-small">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="progress-text">0% Complete</span>
                </div>
            `;
            
            categoryCard.addEventListener('click', () => {
                this.showLessons(category);
            });
            
            fragment.appendChild(categoryCard);
        });
        
        categoriesGrid.innerHTML = '';
        categoriesGrid.appendChild(fragment);
    }

    /**
     * Show lessons for a category
     */
    showLessons(category) {
        this.currentCategory = category;
        
        document.getElementById('categoriesView').style.display = 'none';
        document.getElementById('lessonsView').style.display = 'block';
        document.getElementById('lessonDetail').style.display = 'none';
        
        document.getElementById('categoryTitle').textContent = category.title;
        this.populateLessons(category);
    }

    /**
     * Populate lessons for a category (optimized)
     */
    populateLessons(category) {
        const lessonsGrid = document.getElementById('lessonsGrid');
        
        // Use document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        category.lessons.forEach((lesson, index) => {
            const lessonCard = document.createElement('div');
            lessonCard.className = 'lesson-card';
            lessonCard.innerHTML = `
                <div class="lesson-header">
                    <h4>${lesson.title}</h4>
                    <div class="lesson-meta">
                        <span class="duration">${lesson.duration} min</span>
                        <span class="difficulty">${this.getDifficultyStars(lesson.difficulty)}</span>
                        <span class="xp">+${lesson.xp} XP</span>
                    </div>
                </div>
                <p class="lesson-description">${lesson.description}</p>
                <div class="lesson-content-preview">
                    <h5>What you'll learn:</h5>
                    <ul>
                        ${lesson.content.keyConcepts.slice(0, 3).map(concept => `<li>${concept}</li>`).join('')}
                    </ul>
                </div>
                <div class="lesson-actions">
                    <button class="btn-view" data-lesson-id="${lesson.id}">View Details</button>
                    <button class="btn-start" data-lesson-id="${lesson.id}">Start</button>
                </div>
            `;
            
            // Add event listeners
            lessonCard.querySelector('.btn-view').addEventListener('click', (e) => {
                this.showLessonDetail(lesson);
            });
            
            lessonCard.querySelector('.btn-start').addEventListener('click', (e) => {
                this.startLesson(lesson);
            });
            
            fragment.appendChild(lessonCard);
        });
        
        lessonsGrid.innerHTML = '';
        lessonsGrid.appendChild(fragment);
    }

    /**
     * Show lesson detail
     */
    showLessonDetail(lesson) {
        this.currentLesson = lesson;
        
        document.getElementById('lessonsView').style.display = 'none';
        document.getElementById('lessonDetail').style.display = 'block';
        
        document.getElementById('lessonTitle').textContent = lesson.title;
        this.populateLessonContent(lesson);
    }

    /**
     * Populate lesson content
     */
    populateLessonContent(lesson) {
        const lessonContent = document.getElementById('lessonContent');
        lessonContent.innerHTML = `
            <div class="lesson-overview">
                <div class="lesson-info">
                    <div class="info-item">
                        <span class="label">Duration:</span>
                        <span class="value">${lesson.duration} minutes</span>
                    </div>
                    <div class="info-item">
                        <span class="label">Difficulty:</span>
                        <span class="value">${this.getDifficultyStars(lesson.difficulty)}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">XP Reward:</span>
                        <span class="value">+${lesson.xp} XP</span>
                    </div>
                </div>
                
                <div class="learning-goal">
                    <h4>🎯 Learning Goal</h4>
                    <p>${lesson.content.learningGoal}</p>
                </div>
                
                <div class="key-concepts">
                    <h4>📚 Key Concepts</h4>
                    <ul>
                        ${lesson.content.keyConcepts.map(concept => `<li>${concept}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="exercises">
                    <h4>💪 Exercises</h4>
                    <ul>
                        ${lesson.content.exercises.map(exercise => `<li>${exercise}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="resources">
                    <h4>📖 Resources</h4>
                    <ul>
                        ${lesson.content.resources.map(resource => `<li>${resource}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Save current lesson
     */
    saveCurrentLesson() {
        if (this.currentLesson) {
            const savedLesson = {
                id: this.currentLesson.id,
                title: this.currentLesson.title,
                category: this.currentCategory.title,
                savedAt: new Date().toISOString(),
                progress: 0
            };
            
            // Check if already saved
            const existingIndex = this.userProgress.savedLessons.findIndex(
                lesson => lesson.id === this.currentLesson.id
            );
            
            if (existingIndex >= 0) {
                this.userProgress.savedLessons[existingIndex] = savedLesson;
            } else {
                this.userProgress.savedLessons.push(savedLesson);
            }
            
            this.saveUserProgress();
            this.showSaveConfirmation();
        }
    }

    /**
     * Start current lesson
     */
    startCurrentLesson() {
        if (this.currentLesson) {
            // Add lesson to completed lessons
            this.userProgress.lessonsCompleted++;
            this.addXP(this.currentLesson.xp);
            
            // Show completion message
            this.showLessonCompletion();
        }
    }

    /**
     * Show categories
     */
    showCategories() {
        document.getElementById('categoriesView').style.display = 'block';
        document.getElementById('lessonsView').style.display = 'none';
        document.getElementById('lessonDetail').style.display = 'none';
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
