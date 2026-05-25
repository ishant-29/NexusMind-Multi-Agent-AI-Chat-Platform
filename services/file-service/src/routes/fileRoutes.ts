import { Router } from 'express';
import { uploadFile, getFile, downloadFile, deleteFile, listFiles } from '../controllers/fileController';
import { authenticate } from '../middleware/authMiddleware';
import { upload } from '../utils/multerConfig';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', listFiles);
router.get('/:filename', getFile);
router.get('/:filename/download', downloadFile);
router.delete('/:filename', deleteFile);

export default router;
