const catchAsync = require('../utils/catchAsync');
const { generateQuiz } = require('../utils/quiz');

exports.createQuiz = catchAsync(async (req, res, next) => {
  const topic = String(req.body.topic || '').trim();
  const count = req.body.count;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const quiz = await generateQuiz({ topic, count });
  res.status(200).json({ status: 'success', ...quiz });
});
