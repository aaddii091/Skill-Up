const express = require('express');
const authController = require('./../controllers/authController');
const router = express();

router.get('/login', authController.protect, (req, res, next) => {
  res.status(200).json({
    message: 'Good',
  });
});

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.post(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword/:token', authController.resetPassword);

module.exports = router;
