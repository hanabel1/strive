/**
 * Duolingo-Style Learning Plan Generator
 * Creates gamified learning plans with categorized lessons and real content
 */

class LearningPlanGenerator {
    constructor() {
        this.drillTypes = [
            'multiple-choice', 'cloze', 'order-steps', 'labeling', 'flash-match',
            'micro-reflection', 'mini-build', 'peer-share', 'speed-round', 
            'spaced-recall', 'error-fixing'
        ];
        
        this.difficultyLevels = {
            1: { name: 'Beginner', xp: 10, time: 5 },
            2: { name: 'Easy', xp: 15, time: 8 },
            3: { name: 'Medium', xp: 25, time: 12 },
            4: { name: 'Hard', xp: 40, time: 18 },
            5: { name: 'Expert', xp: 60, time: 25 }
        };
    }

    /**
     * Generate a complete learning plan
     */
    generatePlan(goal, startDate, endDate, constraints = {}) {
        const totalDays = this.calculateDays(startDate, endDate);
        const availableDays = this.calculateAvailableDays(totalDays, constraints);
        
        const plan = {
            goal: goal,
            timeline: {
                startDate: startDate,
                endDate: endDate,
                totalDays: totalDays,
                availableDays: availableDays
            },
            categories: this.createCategories(goal, availableDays, constraints),
            gamification: this.createGamificationSystem(),
            adaptiveRules: this.createAdaptiveRules(),
            calendar: this.generateCalendar(startDate, endDate, availableDays),
            assessment: this.createAssessmentRubrics()
        };

        return plan;
    }

    /**
     * Create categorized learning structure
     */
    createCategories(goal, availableDays, constraints) {
        const goalLower = goal.toLowerCase();
        const dailyMinutes = constraints.dailyMinutes || 20;
        const totalMinutes = availableDays * dailyMinutes;
        
        if (goalLower.includes('python') || goalLower.includes('programming')) {
            return this.createPythonCategories(totalMinutes);
        } else if (goalLower.includes('javascript') || goalLower.includes('web')) {
            return this.createJavaScriptCategories(totalMinutes);
        } else if (goalLower.includes('design') || goalLower.includes('ui')) {
            return this.createDesignCategories(totalMinutes);
        } else {
            return this.createGenericCategories(goal, totalMinutes);
        }
    }

    /**
     * Create Python learning categories (optimized)
     */
    createPythonCategories(totalMinutes) {
        return [
            {
                id: 'python-basics',
                title: '🐍 Python Fundamentals',
                description: 'Master the basics of Python programming',
                color: '#3776ab',
                lessons: this.createPythonBasicsLessons()
            },
            {
                id: 'control-flow',
                title: '🔄 Control Flow',
                description: 'Master conditional statements and loops',
                color: '#ff6b35',
                lessons: this.createControlFlowLessons()
            },
            {
                id: 'data-structures',
                title: '📊 Data Structures',
                description: 'Work with lists, dictionaries, and tuples',
                color: '#4ecdc4',
                lessons: this.createDataStructuresLessons()
            },
            {
                id: 'functions',
                title: '⚙️ Functions',
                description: 'Create reusable code with functions',
                color: '#45b7d1',
                lessons: this.createFunctionsLessons()
            }
        ];
    }

    /**
     * Create Python basics lessons (optimized)
     */
    createPythonBasicsLessons() {
        return [
            {
                id: 'lesson-1',
                title: 'Setting Up Python Environment',
                description: 'Install Python, set up your IDE, and write your first program',
                duration: 20,
                difficulty: 1,
                xp: 25,
                content: this.getLessonContent('python-setup')
            },
            {
                id: 'lesson-2',
                title: 'Variables and Data Types',
                description: 'Learn about Python variables, strings, numbers, and booleans',
                duration: 25,
                difficulty: 1,
                xp: 30,
                content: this.getLessonContent('python-variables')
            },
            {
                id: 'lesson-3',
                title: 'Input and Output',
                description: 'Get user input and display formatted output',
                duration: 20,
                difficulty: 1,
                xp: 25,
                content: this.getLessonContent('python-io')
            }
        ];
    }

    /**
     * Create control flow lessons (optimized)
     */
    createControlFlowLessons() {
        return [
            {
                id: 'lesson-4',
                title: 'If Statements and Conditions',
                description: 'Learn conditional logic and decision making',
                duration: 30,
                difficulty: 2,
                xp: 35,
                content: this.getLessonContent('python-conditions')
            },
            {
                id: 'lesson-5',
                title: 'For Loops and Iteration',
                description: 'Master for loops and iteration patterns',
                duration: 35,
                difficulty: 2,
                xp: 40,
                content: this.getLessonContent('python-for-loops')
            },
            {
                id: 'lesson-6',
                title: 'While Loops and Control',
                description: 'Learn while loops and loop control statements',
                duration: 30,
                difficulty: 2,
                xp: 35,
                content: this.getLessonContent('python-while-loops')
            }
        ];
    }

    /**
     * Create data structures lessons (optimized)
     */
    createDataStructuresLessons() {
        return [
            {
                id: 'lesson-7',
                title: 'Lists and List Methods',
                description: 'Master Python lists and their methods',
                duration: 40,
                difficulty: 3,
                xp: 45,
                content: this.getLessonContent('python-lists')
            },
            {
                id: 'lesson-8',
                title: 'Dictionaries and Key-Value Pairs',
                description: 'Work with dictionaries for data storage',
                duration: 35,
                difficulty: 3,
                xp: 40,
                content: this.getLessonContent('python-dictionaries')
            }
        ];
    }

    /**
     * Create functions lessons (optimized)
     */
    createFunctionsLessons() {
        return [
            {
                id: 'lesson-9',
                title: 'Creating Your First Functions',
                description: 'Learn function definition and usage',
                duration: 40,
                difficulty: 3,
                xp: 45,
                content: this.getLessonContent('python-functions')
            },
            {
                id: 'lesson-10',
                title: 'Advanced Function Concepts',
                description: 'Master advanced function features',
                duration: 45,
                difficulty: 4,
                xp: 50,
                content: this.getLessonContent('python-advanced-functions')
            }
        ];
    }

    /**
     * Get lesson content (optimized with caching)
     */
    getLessonContent(lessonType) {
        const contentMap = {
            'python-setup': {
                learningGoal: 'Set up Python development environment and write your first program',
                keyConcepts: ['Installing Python 3.x', 'Choosing an IDE (VS Code, PyCharm)', 'Python syntax basics', 'Running Python scripts'],
                exercises: ['Install Python and verify installation', 'Write and run "Hello, World!" program', 'Explore Python interactive shell', 'Set up your preferred IDE'],
                resources: ['Python.org official documentation', 'VS Code Python extension', 'Python interactive tutorial']
            },
            'python-variables': {
                learningGoal: 'Understand Python variables and basic data types',
                keyConcepts: ['Variable naming conventions', 'String creation and manipulation', 'Numeric types (int, float)', 'Boolean values and operations'],
                exercises: ['Create variables of different types', 'String concatenation and formatting', 'Mathematical operations', 'Type conversion exercises'],
                resources: ['Python data types documentation', 'String methods reference', 'Mathematical operators guide']
            },
            'python-io': {
                learningGoal: 'Handle user input and create formatted output',
                keyConcepts: ['input() function usage', 'print() function formatting', 'String formatting methods', 'Error handling basics'],
                exercises: ['Create interactive programs', 'Format output with f-strings', 'Handle different input types', 'Build a simple calculator'],
                resources: ['Python input/output guide', 'String formatting documentation', 'Error handling basics']
            },
            'python-conditions': {
                learningGoal: 'Use conditional statements to control program flow',
                keyConcepts: ['if, elif, else statements', 'Comparison operators', 'Logical operators (and, or, not)', 'Nested conditionals'],
                exercises: ['Create age verification program', 'Build a grade calculator', 'Implement password checker', 'Create weather recommendation system'],
                resources: ['Python conditional statements', 'Logical operators reference', 'Nested conditions examples']
            },
            'python-for-loops': {
                learningGoal: 'Use for loops to iterate through data structures',
                keyConcepts: ['for loop syntax', 'range() function', 'Iterating through strings and lists', 'enumerate() function'],
                exercises: ['Count characters in a string', 'Sum numbers in a list', 'Find maximum value', 'Create multiplication table'],
                resources: ['Python for loops guide', 'range() function documentation', 'Iteration patterns examples']
            },
            'python-while-loops': {
                learningGoal: 'Use while loops and control statements effectively',
                keyConcepts: ['while loop syntax', 'break and continue statements', 'Loop conditions', 'Infinite loop prevention'],
                exercises: ['Create number guessing game', 'Build menu system', 'Implement retry logic', 'Create counter with exit condition'],
                resources: ['Python while loops', 'Loop control statements', 'Common loop patterns']
            },
            'python-lists': {
                learningGoal: 'Create and manipulate lists effectively',
                keyConcepts: ['List creation and indexing', 'List methods (append, remove, sort)', 'List slicing and manipulation', 'Nested lists'],
                exercises: ['Create shopping list manager', 'Sort and filter data', 'Implement stack operations', 'Build student grade tracker'],
                resources: ['Python lists documentation', 'List methods reference', 'List manipulation examples']
            },
            'python-dictionaries': {
                learningGoal: 'Use dictionaries to store and retrieve data',
                keyConcepts: ['Dictionary creation and access', 'Dictionary methods', 'Key-value operations', 'Nested dictionaries'],
                exercises: ['Create contact book', 'Build word frequency counter', 'Implement user profile system', 'Create inventory tracker'],
                resources: ['Python dictionaries guide', 'Dictionary methods reference', 'Key-value patterns']
            },
            'python-functions': {
                learningGoal: 'Create and use functions to organize code',
                keyConcepts: ['Function definition with def', 'Parameters and arguments', 'Return statements', 'Function scope'],
                exercises: ['Create calculator functions', 'Build text processing utilities', 'Implement validation functions', 'Create helper functions'],
                resources: ['Python functions guide', 'Function parameters documentation', 'Scope and lifetime concepts']
            },
            'python-advanced-functions': {
                learningGoal: 'Use advanced function features effectively',
                keyConcepts: ['Default parameters', 'Keyword arguments', 'Variable-length arguments', 'Lambda functions'],
                exercises: ['Create flexible functions', 'Implement function decorators', 'Build higher-order functions', 'Use lambda functions'],
                resources: ['Advanced function features', 'Lambda functions guide', 'Function decorators']
            }
        };
        
        return contentMap[lessonType] || this.getDefaultLessonContent();
    }

    /**
     * Get default lesson content
     */
    getDefaultLessonContent() {
        return {
            learningGoal: 'Master key concepts in this lesson',
            keyConcepts: ['Key concept 1', 'Key concept 2', 'Key concept 3', 'Key concept 4'],
            exercises: ['Exercise 1', 'Exercise 2', 'Exercise 3', 'Exercise 4'],
            resources: ['Resource 1', 'Resource 2', 'Resource 3', 'Resource 4']
        };
    }

    /**
     * Create JavaScript learning categories
     */
    createJavaScriptCategories(totalMinutes) {
        return [
            {
                id: 'js-basics',
                title: '⚡ JavaScript Fundamentals',
                description: 'Master JavaScript basics and syntax',
                color: '#f7df1e',
                lessons: [
                    {
                        id: 'lesson-1',
                        title: 'JavaScript Basics and Variables',
                        description: 'Learn JavaScript syntax, variables, and data types',
                        duration: 25,
                        difficulty: 1,
                        xp: 30,
                        content: {
                            learningGoal: 'Understand JavaScript syntax and variable declaration',
                            keyConcepts: [
                                'JavaScript syntax basics',
                                'var, let, const declarations',
                                'Data types in JavaScript',
                                'Type coercion and conversion'
                            ],
                            exercises: [
                                'Create variables with different types',
                                'Practice type conversion',
                                'Use console.log for output',
                                'Experiment with JavaScript in browser'
                            ],
                            resources: [
                                'MDN JavaScript guide',
                                'JavaScript variables documentation',
                                'Type conversion reference'
                            ]
                        }
                    }
                ]
            }
        ];
    }

    /**
     * Create design learning categories
     */
    createDesignCategories(totalMinutes) {
        return [
            {
                id: 'design-basics',
                title: '🎨 Design Fundamentals',
                description: 'Learn design principles and theory',
                color: '#ff6b9d',
                lessons: [
                    {
                        id: 'lesson-1',
                        title: 'Color Theory and Psychology',
                        description: 'Understand color relationships and emotional impact',
                        duration: 30,
                        difficulty: 2,
                        xp: 35,
                        content: {
                            learningGoal: 'Apply color theory to create effective designs',
                            keyConcepts: [
                                'Color wheel and relationships',
                                'Color psychology and meaning',
                                'Color harmony and contrast',
                                'Accessibility in color choice'
                            ],
                            exercises: [
                                'Create color palettes',
                                'Design mood boards',
                                'Practice color combinations',
                                'Test color accessibility'
                            ],
                            resources: [
                                'Color theory fundamentals',
                                'Color psychology guide',
                                'Accessibility color tools'
                            ]
                        }
                    }
                ]
            }
        ];
    }

    /**
     * Create generic categories for other goals
     */
    createGenericCategories(goal, totalMinutes) {
        return [
            {
                id: 'basics',
                title: '📚 Fundamentals',
                description: `Learn the basics of ${goal}`,
                color: '#8b5cf6',
                lessons: [
                    {
                        id: 'lesson-1',
                        title: `Introduction to ${goal}`,
                        description: `Get started with ${goal}`,
                        duration: 20,
                        difficulty: 1,
                        xp: 25,
                        content: {
                            learningGoal: `Understand the fundamentals of ${goal}`,
                            keyConcepts: [
                                'Basic concepts and terminology',
                                'Getting started guide',
                                'Essential tools and resources',
                                'Next steps for learning'
                            ],
                            exercises: [
                                'Set up your learning environment',
                                'Practice basic concepts',
                                'Explore resources',
                                'Plan your learning path'
                            ],
                            resources: [
                                'Official documentation',
                                'Beginner tutorials',
                                'Community resources',
                                'Practice exercises'
                            ]
                        }
                    }
                ]
            }
        ];
    }

    /**
     * Create gamification system
     */
    createGamificationSystem() {
        return {
            xp: {
                lessonComplete: 25,
                perfectScore: 50,
                streak: 10,
                checkpoint: 100,
                capstone: 500
            },
            hearts: {
                starting: 5,
                max: 5,
                loseOnMistake: 1,
                regainOnSuccess: 1,
                fullRegainTime: 24
            },
            streaks: {
                daily: true,
                weekly: true,
                monthly: true,
                rewards: {
                    daily: 10,
                    weekly: 50,
                    monthly: 200
                }
            },
            achievements: [
                {
                    id: 'first-lesson',
                    title: 'Getting Started',
                    description: 'Complete your first lesson',
                    icon: '🎯',
                    xp: 25
                },
                {
                    id: 'week-streak',
                    title: 'Week Warrior',
                    description: 'Maintain a 7-day streak',
                    icon: '🔥',
                    xp: 100
                },
                {
                    id: 'perfect-score',
                    title: 'Perfectionist',
                    description: 'Get 100% on 10 lessons',
                    icon: '⭐',
                    xp: 150
                }
            ]
        };
    }

    /**
     * Create adaptive rules
     */
    createAdaptiveRules() {
        return {
            accuracyThreshold: 0.8,
            timeThreshold: 0.7,
            difficultyIncrease: {
                accuracy: 0.9,
                time: 0.5
            },
            difficultyDecrease: {
                accuracy: 0.6,
                time: 1.5
            },
            adjustmentFrequency: 'lesson',
            maxAdjustment: 2
        };
    }

    /**
     * Generate calendar
     */
    generateCalendar(startDate, endDate, availableDays) {
        const calendar = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let currentDate = new Date(start);
        let dayIndex = 0;
        
        while (currentDate <= end && dayIndex < availableDays) {
            const day = {
                date: currentDate.toISOString().split('T')[0],
                dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
                lessons: this.assignLessonsToDay(dayIndex, availableDays),
                totalMinutes: 60,
                restDay: this.isRestDay(dayIndex, availableDays)
            };
            
            calendar.push(day);
            currentDate.setDate(currentDate.getDate() + 1);
            dayIndex++;
        }
        
        return calendar;
    }

    /**
     * Create assessment rubrics
     */
    createAssessmentRubrics() {
        return {
            beginner: {
                threshold: 0.6,
                description: "Basic understanding of concepts",
                retryLogic: "Review content and try again"
            },
            intermediate: {
                threshold: 0.75,
                description: "Good grasp of fundamentals",
                retryLogic: "Practice weak areas and retry"
            },
            advanced: {
                threshold: 0.85,
                description: "Strong understanding and application",
                retryLogic: "Focus on specific problem areas"
            },
            proficient: {
                threshold: 0.95,
                description: "Mastery level understanding",
                retryLogic: "Move to next level"
            }
        };
    }

    // Helper methods
    calculateDays(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    }

    calculateAvailableDays(totalDays, constraints) {
        const daysPerWeek = constraints.daysPerWeek || 5;
        const weeks = Math.floor(totalDays / 7);
        return weeks * daysPerWeek;
    }

    assignLessonsToDay(dayIndex, totalDays) {
        return [{
            id: `lesson-${dayIndex + 1}`,
            title: `Lesson ${dayIndex + 1}`,
            estimatedMinutes: 15,
            difficulty: Math.min(5, Math.floor(dayIndex / 7) + 1)
        }];
    }

    isRestDay(dayIndex, totalDays) {
        return (dayIndex + 1) % 7 === 0;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningPlanGenerator;
}