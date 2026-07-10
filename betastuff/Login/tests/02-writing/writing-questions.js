// UPSI Writing Test Question Bank - Complete with Clear Instructions

const WRITING_QUESTION_BANK = {

    // Part 1: Word-level writing (5 text message responses)
    part1: {
        title: "Part 1: Word-Level Writing",
        instruction: "In this part you need to respond in single words or short phrases to five text messages from another member of the club or group.",
        context: "You want to join a Travel Club. You have 5 text messages from a member of the club. Write short answers (1-5 words each). Recommended time: 3 minutes.",
        messages: [
            {
                id: "msg1",
                question: "What do you usually do in the morning?",
                placeholder: "Type your answer here",
                maxWords: 5,
                sampleAnswer: "Exercise and have breakfast"
            },
            {
                id: "msg2",
                question: "What is your favourite place?",
                placeholder: "Type your answer here",
                maxWords: 5,
                sampleAnswer: "Beach or mountains"
            },
            {
                id: "msg3",
                question: "What is your favourite animal?",
                placeholder: "Type your answer here",
                maxWords: 5,
                sampleAnswer: "Dogs or cats"
            },
            {
                id: "msg4",
                question: "What is the weather like today?",
                placeholder: "Type your answer here",
                maxWords: 5,
                sampleAnswer: "Sunny and warm"
            },
            {
                id: "msg5",
                question: "What is your favourite time of year?",
                placeholder: "Type your answer here",
                maxWords: 5,
                sampleAnswer: "Summer vacation time"
            }
        ]
    },

    // Part 2: Short text writing (20-30 words)
    part2: {
        title: "Part 2: Short Text Writing",
        instruction: "In this part, you will respond to a request for information from the club or group by writing sentences. You are asked to write 20 to 30 words. You should focus on writing sentences that are relevant to the request and have accurate grammar, punctuation and spelling.",
        context: "You are a new member of the Travel Club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
        question: "Please tell us why you are interested in travel.",
        placeholder: "Type your answer here",
        minWords: 20,
        maxWords: 30,
        toolbarEnabled: true,
        sampleAnswer: "I love exploring new cultures and meeting people from different countries. Travel helps me learn about the world and broaden my perspective on life."
    },

    // Part 3: Social media responses (3 responses, 30-40 words each)
    part3: {
        title: "Part 3: Three Written Responses to Questions",
        instruction: "You will have to respond to three questions from other members of the club or group on a social network platform. You are asked to write around 40 words for each response.",
        context: "You are communicating online with other members of the club. Reply to their questions. Write in sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
        questions: [
            {
                id: "social1",
                author: "Sam",
                question: "Hi! Welcome to the club. Can you remember the first time you went on a journey by yourself? What was it like?",
                placeholder: "Type your answer here",
                minWords: 30,
                maxWords: 40,
                toolbarEnabled: true,
                sampleAnswer: "My first solo journey was to Paris when I was twenty-two. I felt nervous but excited exploring the city alone, visiting museums and trying local food."
            },
            {
                id: "social2",
                author: "Miguel",
                question: "Welcome! What are the most interesting places to visit in your country?",
                placeholder: "Type your answer here",
                minWords: 30,
                maxWords: 40,
                toolbarEnabled: true,
                sampleAnswer: "In my country, the mountains offer incredible hiking trails and beautiful scenery. The coastal cities also have amazing beaches, fresh seafood, and vibrant nightlife for tourists."
            },
            {
                id: "social3",
                author: "Michelle",
                question: "What is the most exciting journey you've been on?",
                placeholder: "Type your answer here",
                minWords: 30,
                maxWords: 40,
                toolbarEnabled: true,
                sampleAnswer: "My most exciting journey was backpacking through Southeast Asia for three months. I experienced diverse cultures, tried exotic foods, and made lifelong friends from around the world."
            }
        ]
    },

    // Part 4: Email writing (informal 40-50 words, formal 120-150 words)
    part4: {
        title: "Part 4: Formal and Informal Writing",
        instruction: "Here you are expected to write two emails in response to some information you have received from the club or group. You are asked to write a short informal email of 40 to 50 words to a friend, and a longer formal email of 120 to 150 words to a person in authority. Both emails are on the same topic, but should differ in terms of the language you use. Make sure that you use the appropriate vocabulary for each email and also that you use linking devices to make the text coherent. Also watch your grammar, punctuation and spelling.",
        context: "You are a member of the Travel Club. You have received this email from the club:",
        emailReceived: {
            subject: "Travel Club Price Increase",
            from: "The President",
            content: `Dear Member,

We are writing to tell you that the Travel Club's annual membership price will increase from £50 to £70 next month. We need to do this because of inflation. We will continue to organize our monthly activities and can now afford to visit new places and offer better services.

Best regards,
The President`
        },
        tasks: [
            {
                id: "informal",
                title: "Informal Email to Friend",
                instruction: "Write an email to your friend. Write about your feelings and what you think the club should do about the situation. Write about 40-50 words. Recommended time: 10 minutes.",
                recipient: "To: Your friend",
                minWords: 40,
                maxWords: 50,
                toolbarEnabled: true,
                placeholder: "Dear [Friend],\n\nType your answer here",
                sampleAnswer: "Hi Sarah! The travel club is increasing membership fees from £50 to £70. I'm quite disappointed about this price rise. Do you think I should continue my membership or look for a cheaper alternative? Let me know your thoughts! Best regards"
            },
            {
                id: "formal",
                title: "Formal Email to Club President",
                instruction: "Write an email to the president of the club. Write about your feelings and what you think the club should do about the situation. Write 120-150 words. Recommended time: 15 minutes.",
                recipient: "To: The president of the club",
                minWords: 120,
                maxWords: 150,
                toolbarEnabled: true,
                placeholder: "Dear President/Manager,\n\nType your answer here",
                sampleAnswer: "Dear President,\n\nI am writing to express my concerns regarding the recent announcement about the membership fee increase from £50 to £70 per year.\n\nWhile I understand that inflation affects all organizations, I believe this 40% increase is quite substantial for many members. Although you mentioned better services and new destinations, I would appreciate more specific details about these improvements.\n\nI would like to suggest that the club considers a gradual price increase over two years instead of implementing it all at once. This would give members time to adjust to the higher costs while still allowing the club to improve its services.\n\nAdditionally, perhaps the club could offer different membership tiers to accommodate varying budgets and preferences.\n\nI look forward to hearing your thoughts on these suggestions.\n\nYours sincerely,\n[Student Name]"
            }
        ]
    }
};

// Word counting utility
function countWords(text) {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
}

// Character counting utility
function countCharacters(text) {
    if (!text) return 0;
    return text.length;
}

// Text formatting utilities for rich text editor
function formatText(command, value = null) {
    document.execCommand(command, false, value);
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WRITING_QUESTION_BANK, countWords, countCharacters, formatText };
}
