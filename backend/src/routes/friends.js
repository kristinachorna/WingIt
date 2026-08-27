import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  searchUsers,
  sendRequest,
  respondToRequest,
  removeFriend,
  blockUser,
  listFriends,
  listPendingRequests,
} from '../controllers/friendsController.js';

const router = Router();
router.use(requireAuth); // every friends route requires login

router.get('/search', searchUsers);
router.get('/', listFriends);
router.get('/requests', listPendingRequests);
router.post('/requests', sendRequest);
router.post('/requests/:id/respond', respondToRequest);
router.delete('/:id', removeFriend);
router.post('/:id/block', blockUser);

export default router;
