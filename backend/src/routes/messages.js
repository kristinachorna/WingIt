import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  sendPhoto,
  listConversations,
  listThread,
  openPhoto,
  getPhotoBytes,
} from '../controllers/messagesController.js';

// Keep uploads in memory briefly, cap size, and only accept images —
// basic protection against abusive or malformed uploads.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  },
});

const router = Router();
router.use(requireAuth);

router.post('/', upload.single('photo'), sendPhoto);
router.get('/', listConversations);
router.get('/thread/:userId', listThread);
router.post('/:id/open', openPhoto);
router.get('/:id/photo', getPhotoBytes);

export default router;
