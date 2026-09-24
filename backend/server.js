require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// =========================================================
// CONFIG
// =========================================================
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

// =========================================================
// COURSE CONTENT CACHE (5 minute)
// =========================================================
const courseCache = {};
const CACHE_DURATION = 5 * 60 * 1000;

// =========================================================
// MOODLE SE COURSE CONTENT LAO
// =========================================================
async function getCourseContent(courseId) {
    const cached = courseCache[courseId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`📦 Cache use kar rahe hain: course ${courseId}`);
        return cached.content;
    }

    console.log(`🔗 Moodle se content laa rahe hain: course ${courseId}`);

    const url = `${MOODLE_URL}/webservice/rest/server.php`;
    const response = await axios.get(url, {
        params: {
            wstoken: MOODLE_TOKEN,
            wsfunction: 'core_course_get_contents',
            moodlewsrestformat: 'json',
            courseid: courseId
        }
    });

    if (response.data.exception) {
        throw new Error(response.data.message);
    }

    let text = `COURSE CONTENT:\n\n`;
    response.data.forEach(section => {
        text += `## Section: ${section.name}\n`;
        if (section.summary) {
            text += `Summary: ${stripHtml(section.summary)}\n`;
        }
        (section.modules || []).forEach(mod => {
            text += `- ${mod.name} (type: ${mod.modname})\n`;
        });
        text += `\n`;
    });

    courseCache[courseId] = {
        content: text,
        timestamp: Date.now()
    };

    console.log(`✅ Content load ho gaya (${text.length} chars)`);
    return text;
}

function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

// =========================================================
// AI CHAT ENDPOINT
// =========================================================
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, courseId } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message required' });
        }
        if (!courseId) {
            return res.status(400).json({ success: false, error: 'Course ID required' });
        }

        console.log(`\n💬 User: "${message}" (Course: ${courseId})`);

        // 1. Moodle se content laao
        let courseContent = '';
        try {
            courseContent = await getCourseContent(courseId);
        } catch (err) {
            console.error('Moodle error:', err.message);
            return res.json({
                success: false,
                error: 'Course content load nahi ho saka. Moodle check karein.'
            });
        }

        // 2. System prompt
        const systemPrompt = `You are an AI teaching assistant for an online learning platform.

STUDENT'S COURSE CONTENT:
${courseContent}

YOUR INSTRUCTIONS:
1. Answer the student's question based on the course content above.
2. If the answer is not in the course content, be honest but try to help with general knowledge.
3. Keep answers concise (2-4 paragraphs max).
4. If the student writes in Roman Urdu/Hindi, reply in Roman Urdu/Hindi.
5. Be friendly and encouraging.

Now answer the student's question.`;

        // 3. Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

        const geminiResponse = await axios.post(geminiUrl, {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\nSTUDENT'S QUESTION: ${message}` }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800
            }
        });

        const reply = geminiResponse.data.candidates[0].content.parts[0].text;

        console.log(`🤖 AI reply: "${reply.substring(0, 80)}..."`);

        res.json({ success: true, reply });

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error?.message || error.message
        });
    }
});

// =========================================================
// HEALTH CHECK
// =========================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        moodle: MOODLE_URL,
        gemini: GEMINI_KEY ? 'configured' : 'missing'
    });
});

// =========================================================
// START
// =========================================================
app.listen(process.env.PORT, () => {
    console.log(`\n🚀 Backend chal raha hai: http://localhost:${process.env.PORT}`);
    console.log(`📡 Moodle: ${MOODLE_URL}`);
    console.log(`🤖 Gemini: ${GEMINI_KEY ? '✅ Ready' : '❌ API key missing'}\n`);
});
