const catchAsync = require('../utils/catchAsync');
const axios = require('axios');

exports.createQuiz = catchAsync(async (req, res, next) => {
  const topic = req.body.topic;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: `Generate 5 multiple-choice questions related to the topic: ${topic}. Each question should have four options and one correct answer. Format the response in JSON only.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let quizData;
    try {
      quizData = response.data.choices[0].message.content.trim();
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return res.status(500).json({ error: 'Failed to parse quiz data' });
    }

    res.status(200).json({
      status: 'success',
      quiz: quizData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});
