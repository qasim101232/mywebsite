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
const PORT = process.env.PORT || 5000;

// =========================================================
// COURSE CONTENT CACHE (5 minute)
// =========================================================
const courseCache = {};
const CACHE_DURATION = 5 * 60 * 1000;

// =========================================================
// HTML STRIP HELPER
// =========================================================
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
}

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

// =========================================================
// AI CHAT ENDPOINT (NAYA INTERACTIONS API)
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
        if (!GEMINI_KEY) {
            return res.status(500).json({
                success: false,
                error: 'GEMINI_API_KEY .env mein set nahi hai'
            });
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

        // 3. NAYA GEMINI INTERACTIONS API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/interactions`;

        const geminiResponse = await axios.post(
            geminiUrl,
            {
                model: 'gemini-3.6-flash',
                input: `${systemPrompt}\n\nSTUDENT'S QUESTION: ${message}`
            },
            {
                headers: {
                    'x-goog-api-key': GEMINI_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        // 4. Reply extract karo naye format se
        const reply = geminiResponse.data.steps
            .filter(step => step.type === 'model_output')
            .flatMap(step => step.content)
            .filter(c => c.type === 'text')
            .map(c => c.text)
            .join('');

        if (!reply) {
            throw new Error('AI ne koi text jawab nahi diya');
        }

        console.log(`🤖 AI reply: "${reply.substring(0, 80)}..."`);

        res.json({ success: true, reply });

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);

        let errorMsg = error.message;
        if (error.response?.data?.error?.message) {
            errorMsg = error.response.data.error.message;
        }

        res.status(500).json({
            success: false,
            error: errorMsg
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
        gemini: GEMINI_KEY ? 'configured' : 'missing',
        model: 'gemini-3.6-flash',
        api: 'interactions'
    });
});

// =========================================================
// START
// =========================================================
app.listen(PORT, () => {
    console.log(`\n🚀 Backend chal raha hai: http://localhost:${PORT}`);
    console.log(`📡 Moodle: ${MOODLE_URL}`);
    console.log(`🤖 Gemini: ${GEMINI_KEY ? '✅ Ready' : '❌ API key missing'}`);
    console.log(`🧠 Model: gemini-3.6-flash`);
    console.log(`🔌 API: Interactions API\n`);
});
