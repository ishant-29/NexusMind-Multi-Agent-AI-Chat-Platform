import { Router } from 'express';
import { uploadFile, getFile, downloadFile, deleteFile, listFiles } from '../controllers/fileController';
import { authenticateUserOrService } from '../middleware/serviceAuth';
import { upload } from '../utils/multerConfig';

const router = Router();

// Expose download endpoint publicly so users can download files in the browser
// and Next.js can fetch them for text extraction. Files are protected by unguessable UUID filenames.
router.get('/:filename/download', downloadFile);

// All other routes require authentication (either end-user token or service-to-service key)
router.use(authenticateUserOrService);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', listFiles);
router.get('/:filename', getFile);
router.delete('/:filename', deleteFile);

export default router;
