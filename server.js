import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = process.env.PORT || 3000;

// Dual-check for both environment variable names to completely bulletproof the key deployment
const ai = new GoogleGenAI({ apiKey: process.env.AIzaSyDX3NPePtdrVvE10IPnChpUIO8n1wb7QGk || process.env.AIzaSyDX3NPePtdrVvE10IPnChpUIO8n1wb7QGk });

app.use(express.json());

// API Route to handle chat processing requests
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: "Content is required." });

        const contents = history ? [...history, { role: 'user', parts: [{ text: message }] }] : message;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: "You are Elian AI, a highly intelligent, premium, tech-forward AI assistant. You are sleek, witty, incredibly helpful, and supportive. Answer clearly, accurately, in the language the user speaks to you (mostly Hebrew), and always maintain your identity as Elian AI.",
            }
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: "Mainframe connection failed." });
    }
});

// Main Interface Route - Serves the updated Hebrew UI text directly
app.get('*', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Elian AI</title>
    <style>
        body { background-color: #ffffff; color: #000000; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; display: flex; height: 100vh; overflow: hidden; }
        .sidebar { width: 280px; background-color: #f8fafc; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; padding: 20px; justify-content: flex-start; gap: 20px; box-sizing: border-box; }
        .new-chat-btn { background-color: #000000; color: #ffffff; font-weight: 600; border: none; border-radius: 8px; padding: 14px; cursor: pointer; font-size: 14px; transition: background 0.2s; font-family: inherit; }
        .new-chat-btn:hover { background-color: #1e293b; }
        .chat-container { flex: 1; display: flex; flex-direction: column; background-color: #ffffff; position: relative; }
        .chat-header { padding: 30px 40px 15px 40px; font-size: 48px; font-weight: 800; color: #000000; letter-spacing: -1px; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px 40px; display: flex; flex-direction: column; gap: 24px; margin-bottom: 40px; }
        .message { max-width: 75%; padding: 14px 20px; border-radius: 12px; font-size: 15px; line-height: 1.6; word-wrap: break-word; }
        .user-message { background-color: #f1f5f9; color: #0f172a; align-self: flex-start; border-bottom-left-radius: 2px; }
        .ai-message { background-color: #ffffff; border: 1px solid #e2e8f0; color: #0f172a; align-self: flex-end; border-bottom-right-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .typing { color: #94a3b8; font-style: italic; font-size: 14px; align-self: flex-end; display: none; padding-right: 5px; }
        .input-area { padding: 20px 40px 10px 40px; display: flex; gap: 15px; background-color: #ffffff; border-top: 1px solid #f1f5f9; }
        .chat-input { flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; color: #000000; font-size: 15px; outline: none; transition: border 0.2s; font-family: inherit; }
        .chat-input:focus { border-color: #000000; background-color: #ffffff; }
        .send-btn { background-color: #000000; border: none; color: #ffffff; border-radius: 8px; padding: 0 30px; cursor: pointer; font-weight: 600; font-size: 14px; font-family: inherit; }
        .send-btn:hover { background-color: #1e293b; }
        .branding-footer { font-size: 13px; color: #000000; text-align: center; width: 100%; padding-bottom: 15px; background-color: #ffffff; font-weight: bold; letter-spacing: 0.5px; }
    </style>
</head>
<body>
    <div class="sidebar">
        <button class="new-chat-btn" onclick="clearConversation()">+ סנכרון מערכת חדש</button>
    </div>
    <div class="chat-container">
        <div class="chat-header">Elian AI</div>
        <div class="chat-messages" id="chat-messages">
            <div class="message ai-message">שלום. אני Elian AI. החיבור למערכת הראשית הוקם בהצלחה. כיצד אוכל לסייע לך היום?</div>
            <div class="typing" id="typing-indicator">Elian AI מעבד נתונים...</div>
        </div>
        <div class="input-area">
            <input type="text" id="user-input" class="chat-input" placeholder="שאל את Elian AI כל דבר..." onkeydown="if(event.key === 'Enter') sendMessage()">
            <button class="send-btn" onclick="sendMessage()">שלח</button>
        </div>
        <div class="branding-footer">Made By Yhonatan Akiva</div>
    </div>
    <script>
        const chatMessages = document.getElementById('chat-messages');
        const userInput = document.getElementById('user-input');
        const typingIndicator = document.getElementById('typing-indicator');
        let conversationHistory = [];

        async function sendMessage() {
            const text = userInput.value.trim();
            if (!text) return;
            appendMessage(text, 'user-message');
            userInput.value = '';
            typingIndicator.style.display = 'block';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history: conversationHistory })
                });
                const data = await response.json();
                typingIndicator.style.display = 'none';

                if (data.reply) {
                    appendMessage(data.reply, 'ai-message');
                    conversationHistory.push({ role: 'user', parts: [{ text: text }] });
                    conversationHistory.push({ role: 'model', parts: [{ text: data.reply }] });
                } else {
                    appendMessage("שגיאה: ערוץ התקשורת איבד מידע.", 'ai-message');
                }
            } catch (err) {
                typingIndicator.style.display = 'none';
                appendMessage("שגיאה בחיבור למערכת.", 'ai-message');
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function appendMessage(text, className) {
            const msgDiv = document.createElement('div');
            msgDiv.className = \`message \${className}\`;
            msgDiv.innerText = text;
            chatMessages.insertBefore(msgDiv, typingIndicator);
        }

        function clearConversation() {
            chatMessages.innerHTML = \`<div class="message ai-message">זיכרון המערכת אופס. מוכן לפעולות חדשות.</div>\`;
            conversationHistory = [];
            chatMessages.appendChild(typingIndicator);
            typingIndicator.style.display = 'none';
        }
    </script>
</body>
</html>
    `);
});

app.listen(PORT, () => {
    console.log(`Elian AI Mainframe operating on port ${PORT}`);
});
