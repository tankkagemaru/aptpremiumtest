// Comprehensive Question Bank for Grammar and Vocabulary Test
// FIXED VERSION with proper syntax
// 50 Multiple Choice Questions + 10 Dropdown Questions

const QUESTION_BANK = {
    
    multipleChoice: [
        // Set 1 - Advanced Grammar Structures
        {
            id: 'mc1',
            type: 'multiple-choice',
            text: 'I really enjoy challenging projects. So _____ I!',
            options: [
                { label: 'A', text: 'am', correct: false },
                { label: 'B', text: 'do', correct: true },
                { label: 'C', text: 'have', correct: false }
            ]
        },
        {
            id: 'mc2',
            type: 'multiple-choice',
            text: 'We could cook dinner. _____, we could buy some take away food.',
            options: [
                { label: 'A', text: 'However', correct: false },
                { label: 'B', text: 'On the other hand', correct: true },
                { label: 'C', text: 'Therefore', correct: false }
            ]
        },
        {
            id: 'mc3',
            type: 'multiple-choice',
            text: 'In those days, my father _____ never eat dinner after eight o\'clock.',
            options: [
                { label: 'A', text: 'will', correct: false },
                { label: 'B', text: 'would', correct: true },
                { label: 'C', text: 'used', correct: false }
            ]
        },
        {
            id: 'mc4',
            type: 'multiple-choice',
            text: 'The train _____ before we reached the station.',
            options: [
                { label: 'A', text: 'left', correct: false },
                { label: 'B', text: 'has left', correct: false },
                { label: 'C', text: 'had left', correct: true }
            ]
        },
        {
            id: 'mc5',
            type: 'multiple-choice',
            text: 'If I _____ you, I would accept the job offer.',
            options: [
                { label: 'A', text: 'am', correct: false },
                { label: 'B', text: 'was', correct: false },
                { label: 'C', text: 'were', correct: true }
            ]
        },
        
        // Set 2 - Tenses and Aspects
        {
            id: 'mc6',
            type: 'multiple-choice',
            text: 'By next month, I _____ here for two years.',
            options: [
                { label: 'A', text: 'will work', correct: false },
                { label: 'B', text: 'will have been working', correct: true },
                { label: 'C', text: 'am working', correct: false }
            ]
        },
        {
            id: 'mc7',
            type: 'multiple-choice',
            text: 'She _____ to Paris three times this year.',
            options: [
                { label: 'A', text: 'has been', correct: true },
                { label: 'B', text: 'went', correct: false },
                { label: 'C', text: 'was going', correct: false }
            ]
        },
        {
            id: 'mc8',
            type: 'multiple-choice',
            text: 'While I _____ dinner, the phone rang.',
            options: [
                { label: 'A', text: 'cooked', correct: false },
                { label: 'B', text: 'was cooking', correct: true },
                { label: 'C', text: 'have cooked', correct: false }
            ]
        },
        {
            id: 'mc9',
            type: 'multiple-choice',
            text: 'They _____ for two hours when it started to rain.',
            options: [
                { label: 'A', text: 'walked', correct: false },
                { label: 'B', text: 'were walking', correct: false },
                { label: 'C', text: 'had been walking', correct: true }
            ]
        },
        {
            id: 'mc10',
            type: 'multiple-choice',
            text: 'I _____ my homework before dinner yesterday.',
            options: [
                { label: 'A', text: 'finished', correct: true },
                { label: 'B', text: 'have finished', correct: false },
                { label: 'C', text: 'was finishing', correct: false }
            ]
        },
        
        // Set 3 - Modals
        {
            id: 'mc11',
            type: 'multiple-choice',
            text: 'You _____ have told me earlier. I could have helped you.',
            options: [
                { label: 'A', text: 'should', correct: true },
                { label: 'B', text: 'must', correct: false },
                { label: 'C', text: 'would', correct: false }
            ]
        },
        {
            id: 'mc12',
            type: 'multiple-choice',
            text: 'She _____ be at home now. Her car is in the garage.',
            options: [
                { label: 'A', text: 'can', correct: false },
                { label: 'B', text: 'must', correct: true },
                { label: 'C', text: 'might', correct: false }
            ]
        },
        {
            id: 'mc13',
            type: 'multiple-choice',
            text: 'Students _____ use mobile phones during the exam.',
            options: [
                { label: 'A', text: 'mustn\'t', correct: true },
                { label: 'B', text: 'don\'t have to', correct: false },
                { label: 'C', text: 'shouldn\'t', correct: false }
            ]
        },
        {
            id: 'mc14',
            type: 'multiple-choice',
            text: 'He _____ speak five languages when he was younger.',
            options: [
                { label: 'A', text: 'can', correct: false },
                { label: 'B', text: 'could', correct: true },
                { label: 'C', text: 'may', correct: false }
            ]
        },
        {
            id: 'mc15',
            type: 'multiple-choice',
            text: 'You _____ park here. It\'s a restricted area.',
            options: [
                { label: 'A', text: 'couldn\'t', correct: false },
                { label: 'B', text: 'can\'t', correct: true },
                { label: 'C', text: 'mightn\'t', correct: false }
            ]
        },
        
        // Set 4 - Passive Voice
        {
            id: 'mc16',
            type: 'multiple-choice',
            text: 'The report _____ by the manager yesterday.',
            options: [
                { label: 'A', text: 'was completed', correct: true },
                { label: 'B', text: 'completed', correct: false },
                { label: 'C', text: 'has completed', correct: false }
            ]
        },
        {
            id: 'mc17',
            type: 'multiple-choice',
            text: 'A new hospital _____ in our town next year.',
            options: [
                { label: 'A', text: 'will build', correct: false },
                { label: 'B', text: 'will be built', correct: true },
                { label: 'C', text: 'is building', correct: false }
            ]
        },
        {
            id: 'mc18',
            type: 'multiple-choice',
            text: 'The house _____ before the storm arrived.',
            options: [
                { label: 'A', text: 'had been evacuated', correct: true },
                { label: 'B', text: 'was evacuated', correct: false },
                { label: 'C', text: 'evacuated', correct: false }
            ]
        },
        {
            id: 'mc19',
            type: 'multiple-choice',
            text: 'All the emails _____ by 5 PM tomorrow.',
            options: [
                { label: 'A', text: 'will send', correct: false },
                { label: 'B', text: 'will have been sent', correct: true },
                { label: 'C', text: 'are sending', correct: false }
            ]
        },
        {
            id: 'mc20',
            type: 'multiple-choice',
            text: 'The cake _____ by my sister for the party.',
            options: [
                { label: 'A', text: 'made', correct: false },
                { label: 'B', text: 'was made', correct: true },
                { label: 'C', text: 'has made', correct: false }
            ]
        },
        
        // Set 5 - Conditionals
        {
            id: 'mc21',
            type: 'multiple-choice',
            text: 'If it rains tomorrow, we _____ the picnic.',
            options: [
                { label: 'A', text: 'cancel', correct: false },
                { label: 'B', text: 'will cancel', correct: true },
                { label: 'C', text: 'would cancel', correct: false }
            ]
        },
        {
            id: 'mc22',
            type: 'multiple-choice',
            text: 'If I had known about the meeting, I _____ attended it.',
            options: [
                { label: 'A', text: 'will have', correct: false },
                { label: 'B', text: 'would have', correct: true },
                { label: 'C', text: 'would', correct: false }
            ]
        },
        {
            id: 'mc23',
            type: 'multiple-choice',
            text: 'If she _____ harder, she would pass the exam.',
            options: [
                { label: 'A', text: 'studies', correct: false },
                { label: 'B', text: 'studied', correct: true },
                { label: 'C', text: 'will study', correct: false }
            ]
        },
        {
            id: 'mc24',
            type: 'multiple-choice',
            text: 'If you heat ice, it _____.',
            options: [
                { label: 'A', text: 'melts', correct: true },
                { label: 'B', text: 'will melt', correct: false },
                { label: 'C', text: 'would melt', correct: false }
            ]
        },
        {
            id: 'mc25',
            type: 'multiple-choice',
            text: 'If they had left earlier, they _____ the traffic.',
            options: [
                { label: 'A', text: 'avoid', correct: false },
                { label: 'B', text: 'would avoid', correct: false },
                { label: 'C', text: 'would have avoided', correct: true }
            ]
        },
        
        // Set 6 - Reported Speech
        {
            id: 'mc26',
            type: 'multiple-choice',
            text: 'She said that she _____ to the party the next day.',
            options: [
                { label: 'A', text: 'will go', correct: false },
                { label: 'B', text: 'would go', correct: true },
                { label: 'C', text: 'goes', correct: false }
            ]
        },
        {
            id: 'mc27',
            type: 'multiple-choice',
            text: 'He asked me _____ I had finished my work.',
            options: [
                { label: 'A', text: 'that', correct: false },
                { label: 'B', text: 'if', correct: true },
                { label: 'C', text: 'what', correct: false }
            ]
        },
        {
            id: 'mc28',
            type: 'multiple-choice',
            text: 'They told us _____ there.',
            options: [
                { label: 'A', text: 'don\'t go', correct: false },
                { label: 'B', text: 'not to go', correct: true },
                { label: 'C', text: 'not go', correct: false }
            ]
        },
        {
            id: 'mc29',
            type: 'multiple-choice',
            text: 'She said she _____ there before.',
            options: [
                { label: 'A', text: 'has been', correct: false },
                { label: 'B', text: 'had been', correct: true },
                { label: 'C', text: 'was', correct: false }
            ]
        },
        {
            id: 'mc30',
            type: 'multiple-choice',
            text: 'The teacher told the students _____ quietly.',
            options: [
                { label: 'A', text: 'work', correct: false },
                { label: 'B', text: 'to work', correct: true },
                { label: 'C', text: 'working', correct: false }
            ]
        },
        
        // Set 7 - Relative Clauses
        {
            id: 'mc31',
            type: 'multiple-choice',
            text: 'The book _____ I borrowed from the library is very interesting.',
            options: [
                { label: 'A', text: 'which', correct: true },
                { label: 'B', text: 'who', correct: false },
                { label: 'C', text: 'whose', correct: false }
            ]
        },
        {
            id: 'mc32',
            type: 'multiple-choice',
            text: 'The woman _____ lives next door is a doctor.',
            options: [
                { label: 'A', text: 'which', correct: false },
                { label: 'B', text: 'who', correct: true },
                { label: 'C', text: 'whom', correct: false }
            ]
        },
        {
            id: 'mc33',
            type: 'multiple-choice',
            text: 'This is the house _____ I grew up.',
            options: [
                { label: 'A', text: 'which', correct: false },
                { label: 'B', text: 'where', correct: true },
                { label: 'C', text: 'that', correct: false }
            ]
        },
        {
            id: 'mc34',
            type: 'multiple-choice',
            text: 'The car, _____ was red, was parked outside.',
            options: [
                { label: 'A', text: 'that', correct: false },
                { label: 'B', text: 'which', correct: true },
                { label: 'C', text: 'who', correct: false }
            ]
        },
        {
            id: 'mc35',
            type: 'multiple-choice',
            text: 'The man _____ wallet was stolen reported it to the police.',
            options: [
                { label: 'A', text: 'who', correct: false },
                { label: 'B', text: 'whose', correct: true },
                { label: 'C', text: 'which', correct: false }
            ]
        },
        
        // Set 8 - Prepositions
        {
            id: 'mc36',
            type: 'multiple-choice',
            text: 'She is interested _____ learning new languages.',
            options: [
                { label: 'A', text: 'in', correct: true },
                { label: 'B', text: 'on', correct: false },
                { label: 'C', text: 'at', correct: false }
            ]
        },
        {
            id: 'mc37',
            type: 'multiple-choice',
            text: 'We arrived _____ the airport just in time.',
            options: [
                { label: 'A', text: 'in', correct: false },
                { label: 'B', text: 'at', correct: true },
                { label: 'C', text: 'to', correct: false }
            ]
        },
        {
            id: 'mc38',
            type: 'multiple-choice',
            text: 'The picture is hanging _____ the wall.',
            options: [
                { label: 'A', text: 'in', correct: false },
                { label: 'B', text: 'on', correct: true },
                { label: 'C', text: 'at', correct: false }
            ]
        },
        {
            id: 'mc39',
            type: 'multiple-choice',
            text: 'They have been waiting _____ two hours.',
            options: [
                { label: 'A', text: 'since', correct: false },
                { label: 'B', text: 'for', correct: true },
                { label: 'C', text: 'during', correct: false }
            ]
        },
        {
            id: 'mc40',
            type: 'multiple-choice',
            text: 'He is good _____ mathematics.',
            options: [
                { label: 'A', text: 'in', correct: false },
                { label: 'B', text: 'at', correct: true },
                { label: 'C', text: 'with', correct: false }
            ]
        },
        
        // Set 9 - Articles
        {
            id: 'mc41',
            type: 'multiple-choice',
            text: 'I need _____ umbrella because it\'s raining.',
            options: [
                { label: 'A', text: 'a', correct: false },
                { label: 'B', text: 'an', correct: true },
                { label: 'C', text: 'the', correct: false }
            ]
        },
        {
            id: 'mc42',
            type: 'multiple-choice',
            text: '_____ sun rises in the east.',
            options: [
                { label: 'A', text: 'A', correct: false },
                { label: 'B', text: 'An', correct: false },
                { label: 'C', text: 'The', correct: true }
            ]
        },
        {
            id: 'mc43',
            type: 'multiple-choice',
            text: 'She is _____ honest person.',
            options: [
                { label: 'A', text: 'a', correct: false },
                { label: 'B', text: 'an', correct: true },
                { label: 'C', text: 'the', correct: false }
            ]
        },
        {
            id: 'mc44',
            type: 'multiple-choice',
            text: 'I go to _____ gym three times a week.',
            options: [
                { label: 'A', text: 'a', correct: false },
                { label: 'B', text: 'an', correct: false },
                { label: 'C', text: 'the', correct: true }
            ]
        },
        {
            id: 'mc45',
            type: 'multiple-choice',
            text: '_____ life is full of surprises.',
            options: [
                { label: 'A', text: 'A', correct: false },
                { label: 'B', text: 'An', correct: false },
                { label: 'C', text: '(no article)', correct: true }
            ]
        },
        
        // Set 10 - Quantifiers
        {
            id: 'mc46',
            type: 'multiple-choice',
            text: 'There is _____ milk left in the fridge.',
            options: [
                { label: 'A', text: 'few', correct: false },
                { label: 'B', text: 'little', correct: true },
                { label: 'C', text: 'many', correct: false }
            ]
        },
        {
            id: 'mc47',
            type: 'multiple-choice',
            text: 'I have _____ friends who live abroad.',
            options: [
                { label: 'A', text: 'much', correct: false },
                { label: 'B', text: 'a little', correct: false },
                { label: 'C', text: 'a few', correct: true }
            ]
        },
        {
            id: 'mc48',
            type: 'multiple-choice',
            text: 'How _____ water do you drink per day?',
            options: [
                { label: 'A', text: 'many', correct: false },
                { label: 'B', text: 'much', correct: true },
                { label: 'C', text: 'few', correct: false }
            ]
        },
        {
            id: 'mc49',
            type: 'multiple-choice',
            text: 'There are _____ students in the classroom.',
            options: [
                { label: 'A', text: 'much', correct: false },
                { label: 'B', text: 'several', correct: true },
                { label: 'C', text: 'a little', correct: false }
            ]
        },
        {
            id: 'mc50',
            type: 'multiple-choice',
            text: 'She doesn\'t have _____ time to finish the project.',
            options: [
                { label: 'A', text: 'many', correct: false },
                { label: 'B', text: 'much', correct: true },
                { label: 'C', text: 'few', correct: false }
            ]
        }
    ],
    
    dropdown: [
        // Synonym Questions
        {
            id: 'syn1',
            type: 'synonym',
            text: 'Choose the correct synonym for each word:',
            items: [
                {
                    text: 'abundant',
                    options: ['scarce', 'plentiful', 'limited', 'rare'],
                    correct: 'plentiful'
                },
                {
                    text: 'courageous',
                    options: ['brave', 'timid', 'fearful', 'scared'],
                    correct: 'brave'
                },
                {
                    text: 'innovative',
                    options: ['traditional', 'creative', 'conventional', 'ordinary'],
                    correct: 'creative'
                }
            ]
        },
        
        // Definition Questions
        {
            id: 'def1',
            type: 'definition',
            text: 'Match the words with their definitions:',
            items: [
                {
                    text: 'benevolent',
                    options: ['kind and helpful', 'angry and hostile', 'lazy and slow', 'rich and wealthy'],
                    correct: 'kind and helpful'
                },
                {
                    text: 'gregarious',
                    options: ['sociable', 'shy', 'intelligent', 'wealthy'],
                    correct: 'sociable'
                },
                {
                    text: 'meticulous',
                    options: ['careless', 'very careful', 'fast', 'lazy'],
                    correct: 'very careful'
                }
            ]
        },
        
        // Sentence Completion
        {
            id: 'sent1',
            type: 'sentence',
            text: 'Complete the sentences with the appropriate words:',
            items: [
                {
                    text: 'Despite the challenges, she remained _____.',
                    options: ['optimistic', 'pessimistic', 'angry', 'confused'],
                    correct: 'optimistic'
                },
                {
                    text: 'The evidence was _____, leaving no doubt.',
                    options: ['vague', 'unclear', 'conclusive', 'ambiguous'],
                    correct: 'conclusive'
                },
                {
                    text: 'His _____ attitude made everyone uncomfortable.',
                    options: ['friendly', 'arrogant', 'humble', 'polite'],
                    correct: 'arrogant'
                }
            ]
        },
        
        // Collocation
        {
            id: 'col1',
            type: 'collocation',
            text: 'Choose the correct collocations:',
            items: [
                {
                    text: '_____ attention',
                    options: ['pay', 'give', 'make', 'do'],
                    correct: 'pay'
                },
                {
                    text: '_____ a decision',
                    options: ['do', 'have', 'make', 'take'],
                    correct: 'make'
                },
                {
                    text: '_____ business',
                    options: ['make', 'do', 'have', 'take'],
                    correct: 'do'
                }
            ]
        },
        
        // Word Family
        {
            id: 'wf1',
            type: 'word-family',
            text: 'Choose the correct form of the word:',
            items: [
                {
                    text: 'The _____ (innovate) approach solved the problem.',
                    options: ['innovative', 'innovate', 'innovation', 'innovator'],
                    correct: 'innovative'
                },
                {
                    text: 'Her _____ (determine) helped her succeed.',
                    options: ['determine', 'determined', 'determination', 'determining'],
                    correct: 'determination'
                },
                {
                    text: 'The results were _____ (impress).',
                    options: ['impress', 'impressed', 'impressive', 'impression'],
                    correct: 'impressive'
                }
            ]
        },
        
        // More Synonyms
        {
            id: 'syn2',
            type: 'synonym',
            text: 'Select the best synonym:',
            items: [
                {
                    text: 'diligent',
                    options: ['lazy', 'hardworking', 'careless', 'slow'],
                    correct: 'hardworking'
                },
                {
                    text: 'lucid',
                    options: ['clear', 'confused', 'dark', 'loud'],
                    correct: 'clear'
                },
                {
                    text: 'tenacious',
                    options: ['weak', 'persistent', 'gentle', 'quiet'],
                    correct: 'persistent'
                }
            ]
        },
        
        // Context-based
        {
            id: 'cont1',
            type: 'sentence',
            text: 'Choose the word that best fits the context:',
            items: [
                {
                    text: 'The company needs to _____ its market share.',
                    options: ['expand', 'reduce', 'ignore', 'forget'],
                    correct: 'expand'
                },
                {
                    text: 'She has a _____ understanding of the subject.',
                    options: ['shallow', 'superficial', 'profound', 'basic'],
                    correct: 'profound'
                },
                {
                    text: 'The results _____ our hypothesis.',
                    options: ['contradict', 'confirm', 'ignore', 'avoid'],
                    correct: 'confirm'
                }
            ]
        },
        
        // Academic Vocabulary
        {
            id: 'acad1',
            type: 'definition',
            text: 'Match these academic words with their meanings:',
            items: [
                {
                    text: 'empirical',
                    options: ['based on observation', 'theoretical', 'imaginary', 'historical'],
                    correct: 'based on observation'
                },
                {
                    text: 'coherent',
                    options: ['logical and consistent', 'random', 'incomplete', 'boring'],
                    correct: 'logical and consistent'
                },
                {
                    text: 'inherent',
                    options: ['natural and essential', 'added later', 'removable', 'temporary'],
                    correct: 'natural and essential'
                }
            ]
        },
        
        // Phrasal Verbs
        {
            id: 'pv1',
            type: 'collocation',
            text: 'Complete with the correct particle:',
            items: [
                {
                    text: 'Look _____ (search for)',
                    options: ['after', 'for', 'up', 'out'],
                    correct: 'for'
                },
                {
                    text: 'Give _____ (surrender)',
                    options: ['in', 'up', 'out', 'away'],
                    correct: 'up'
                },
                {
                    text: 'Put _____ (postpone)',
                    options: ['on', 'up', 'off', 'in'],
                    correct: 'off'
                }
            ]
        },
        
        // Advanced Word Forms
        {
            id: 'wf2',
            type: 'word-family',
            text: 'Select the appropriate word form:',
            items: [
                {
                    text: 'The _____ (analyze) revealed important insights.',
                    options: ['analyze', 'analysis', 'analytical', 'analyzer'],
                    correct: 'analysis'
                },
                {
                    text: 'She spoke _____ (eloquent) at the conference.',
                    options: ['eloquent', 'eloquence', 'eloquently', 'eloquentness'],
                    correct: 'eloquently'
                },
                {
                    text: 'The _____ (signify) of the discovery cannot be overstated.',
                    options: ['signify', 'significant', 'significance', 'significantly'],
                    correct: 'significance'
                }
            ]
        }
    ]
};

// Export for use in test
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QUESTION_BANK;
}
