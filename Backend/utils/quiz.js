const axios = require('axios');

const fallbackQuiz = (topic, count) => {
  const subject = topic || 'general knowledge';
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    question: `Which statement best describes a key idea in ${subject}?`,
    options: [
      `It is a core concept in ${subject}.`,
      `It only applies outside ${subject}.`,
      `It cannot be learned or improved.`,
      `It has no practical use.`,
    ],
    answer: `It is a core concept in ${subject}.`,
    explanation: 'A fallback quiz is used when AI generation is unavailable.',
  }));
};

const normaliseQuiz = (quiz, count) => {
  if (!Array.isArray(quiz?.questions) || quiz.questions.length < count) {
    throw new Error('The generated quiz did not contain enough questions.');
  }

  return quiz.questions.slice(0, count).map((item, index) => {
    const options = Array.isArray(item.options) ? item.options.map(String) : [];
    const answer = String(item.answer || item.correctAnswer || '');
    if (!item.question || options.length !== 4 || !options.includes(answer)) {
      throw new Error('The generated quiz has an invalid question format.');
    }
    return {
      id: index + 1,
      question: String(item.question),
      options,
      answer,
      explanation: String(item.explanation || ''),
    };
  });
};

exports.generateQuiz = async ({ topic, count }) => {
  const questionCount = Math.min(Math.max(Number(count) || 5, 1), 10);

  if (!process.env.OPENAI_API_KEY) {
    return { questions: fallbackQuiz(topic, questionCount), source: 'fallback' };
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Return valid JSON only. Create fair multiple-choice learning questions. Each question needs question, options (exactly 4 strings), answer (one exact option), and explanation.',
          },
          {
            role: 'user',
            content: `Create ${questionCount} questions about "${topic}". Use this JSON shape: {"questions":[{"question":"...","options":["...","...","...","..."],"answer":"...","explanation":"..."}]}.`,
          },
        ],
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    return { questions: normaliseQuiz(JSON.parse(content), questionCount), source: 'ai' };
  } catch (error) {
    console.error('Quiz generation failed; serving fallback quiz:', error.message);
    return { questions: fallbackQuiz(topic, questionCount), source: 'fallback' };
  }
};
