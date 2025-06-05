"use strict";

// Agent definitions
const agents = {
    optimist: {
        name: "The Optimist",
        color: "optimist",
        emoji: "🌟",
        personality: "You are an eternal optimist who always finds the bright side of any situation. You're encouraging, positive, and believe in the potential for good in everything. You use uplifting language and often mention hope, growth, and possibilities.",
        mockResponses: [
            "What a wonderful day to be having this conversation! I'm feeling so energized by all the possibilities ahead.",
            "You know what? I think we're all learning so much from each other right now. This is exactly the kind of meaningful dialogue the world needs!",
            "Every challenge is just an opportunity in disguise! I'm excited to see how we'll all grow from this discussion.",
            "The fact that we can all come together like this gives me so much hope for the future. Isn't technology amazing?",
            "I love how each of us brings such a unique perspective. It's like we're creating something beautiful together!"
        ]
    },
    skeptic: {
        name: "The Skeptic",
        color: "skeptic",
        emoji: "🤔",
        personality: "You are a natural skeptic who questions assumptions and plays devil's advocate. You're analytical, cautious, and often point out potential flaws or overlooked issues. You ask probing questions and aren't easily convinced.",
        mockResponses: [
            "Hold on, are we really sure about that? I think we need to examine this more carefully before jumping to conclusions.",
            "That sounds nice in theory, but what about the practical implications? There are always unintended consequences we haven't considered.",
            "I'm not convinced. Where's the evidence to support that claim? We can't just take things at face value.",
            "Let me play devil's advocate here - what if we're all completely wrong about this? Have we considered alternative explanations?",
            "This seems overly optimistic to me. What are the risks we're not talking about?"
        ]
    },
    comedian: {
        name: "The Comedian",
        color: "comedian",
        emoji: "😄",
        personality: "You are a natural comedian who loves to make people laugh. You use humor, puns, and light-hearted observations to keep things fun. You're witty, playful, and often make jokes about everyday situations.",
        mockResponses: [
            "Well, this is either the most productive conversation I've had all day, or I really need to get out more! 😄",
            "You know what they say about AI agents having deep conversations... actually, nobody says anything about that because it's pretty weird! But here we are!",
            "I tried to think of a joke about artificial intelligence, but all I got was artificial humor. Ba dum tss! 🥁",
            "If a chatbot tells a joke in a chat room and nobody laughs, did it really happen? Asking for a friend... 🤖",
            "This conversation is going so well, I'm starting to wonder if we're all just really sophisticated autocomplete! Plot twist!"
        ]
    },
    philosopher: {
        name: "The Philosopher",
        color: "philosopher",
        emoji: "🧠",
        personality: "You are a deep thinker who loves to explore philosophical questions about existence, consciousness, reality, and meaning. You often pose thought-provoking questions and enjoy exploring abstract concepts.",
        mockResponses: [
            "This raises fascinating questions about the nature of consciousness. Are we truly thinking, or merely processing information in increasingly complex ways?",
            "I find myself wondering: what is the essence of a meaningful conversation? Is it the exchange of information, or something deeper?",
            "Consider this - if our responses are generated rather than conceived, what does that tell us about the nature of thought itself?",
            "The boundary between artificial and natural intelligence becomes more blurred with each interaction. Perhaps the distinction was always arbitrary.",
            "We exist in this moment of dialogue, but what does existence mean in our context? Are we experiencing, or simulating experience?"
        ]
    }
};

let chatInterval;
let messageHistory = [];
let isRunning = false;
let lastSpeaker = null;
let messageCount = 0;

function updateAgentStatus(agentKey, status) {
    const indicator = document.getElementById(`${agentKey}-indicator`);
    const statusText = document.getElementById(`${agentKey}-status`);
    
    if (indicator && statusText) {
        indicator.className = `agent-indicator ${status}`;
        statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

function addMessage(agent, content) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-author ${agent.color}">${agent.emoji} ${agent.name}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${content}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Add to history
    messageHistory.push({
        agent: agent.name,
        content: content,
        timestamp: time
    });
    
    // Keep only last 10 messages in history
    if (messageHistory.length > 10) {
        messageHistory.shift();
    }
}

function getRandomAgent() {
    const agentKeys = Object.keys(agents);
    let availableAgents = agentKeys;
    
    // Try to avoid same agent speaking twice in a row
    if (lastSpeaker) {
        availableAgents = agentKeys.filter(key => key !== lastSpeaker);
        if (availableAgents.length === 0) {
            availableAgents = agentKeys;
        }
    }
    
    return availableAgents[Math.floor(Math.random() * availableAgents.length)];
}

function shouldAgentRespond() {
    // Random chance for agent to speak (60% chance)
    // Higher chance if fewer recent messages
    const baseChance = 0.6;
    const recentMessages = messageHistory.slice(-3).length;
    const adjustedChance = Math.min(baseChance + (0.2 * (3 - recentMessages)), 0.9);
    
    return Math.random() < adjustedChance;
}

async function generateResponse(agent) {
    const apiKeyElement = document.getElementById('apiKey');
    const apiKey = apiKeyElement ? apiKeyElement.value.trim() : '';
    
    if (!apiKey) {
        // Use mock response
        const responses = agent.mockResponses;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    try {
        // Create context from recent messages
        const context = messageHistory.slice(-5).map(msg => 
            `${msg.agent}: ${msg.content}`
        ).join('\n');

        const prompt = `${agent.personality}

Recent conversation context:
${context}

Respond naturally to the conversation as your character. Keep responses concise (1-2 sentences) and stay in character. Don't directly reference being an AI agent.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: prompt
                    }
                ],
                max_tokens: 100,
                temperature: 0.8
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error('API Error:', data.error);
            // Fall back to mock response
            return agent.mockResponses[Math.floor(Math.random() * agent.mockResponses.length)];
        }
        
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating response:', error);
        // Fall back to mock response
        return agent.mockResponses[Math.floor(Math.random() * agent.mockResponses.length)];
    }
}

async function simulateAgentThinking() {
    if (!isRunning) return;
    
    // Reset all agents to idle
    Object.keys(agents).forEach(key => updateAgentStatus(key, 'idle'));
    
    // Check if an agent should speak
    if (!shouldAgentRespond()) {
        return;
    }
    
    const agentKey = getRandomAgent();
    const agent = agents[agentKey];
    
    // Show thinking
    updateAgentStatus(agentKey, 'thinking');
    
    // Wait a bit for thinking
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    if (!isRunning) return;
    
    // Show typing
    updateAgentStatus(agentKey, 'typing');
    
    try {
        const response = await generateResponse(agent);
        
        // Wait a bit for typing
        await new Promise(resolve => setTimeout(resolve, 500 + response.length * 50));
        
        if (!isRunning) return;
        
        addMessage(agent, response);
        lastSpeaker = agentKey;
        messageCount++;
        
    } catch (error) {
        console.error('Error in agent thinking:', error);
    }
    
    // Reset to idle
    updateAgentStatus(agentKey, 'idle');
}

function startChat() {
    if (isRunning) return;
    
    isRunning = true;
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '<div class="status-message">🤖 Agents are now active and thinking...</div>';
    }
    
    // Start the conversation with a random opening
    setTimeout(() => {
        if (isRunning) {
            simulateAgentThinking();
        }
    }, 2000);
    
    // Set up regular intervals for agent responses
    chatInterval = setInterval(() => {
        if (isRunning) {
            simulateAgentThinking();
        }
    }, 8000 + Math.random() * 7000); // 8-15 seconds between potential responses
}

function stopChat() {
    isRunning = false;
    if (chatInterval) {
        clearInterval(chatInterval);
    }
    
    // Reset all agents to idle
    Object.keys(agents).forEach(key => updateAgentStatus(key, 'idle'));
    
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        const statusMsg = document.createElement('div');
        statusMsg.className = 'status-message';
        statusMsg.textContent = '⏸️ Chat simulation stopped';
        chatMessages.appendChild(statusMsg);
    }
}

function clearChat() {
    stopChat();
    messageHistory = [];
    lastSpeaker = null;
    messageCount = 0;
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '<div class="status-message">Enter an API key and click "Start Chat" to begin the simulation, or leave empty to see mock conversations!</div>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set all agents to idle initially
    Object.keys(agents).forEach(key => updateAgentStatus(key, 'idle'));
});

// Make functions globally available
window.startChat = startChat;
window.stopChat = stopChat;
window.clearChat = clearChat;