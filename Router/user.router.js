import { Router } from 'express';
import controller from '../Controllers/user.controller.js';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.put('/update', controller.updateUser);
router.get('/profile', controller.getProfile);
router.post('/logout', controller.logout);
router.post('/refresh-token', controller.refreshToken);
router.put('/saveMessage', controller.messageHandle);
router.put('/deleteAllMessages', controller.deleteAllUserMessages);

export default router;
