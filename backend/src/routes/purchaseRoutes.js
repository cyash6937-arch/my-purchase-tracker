import express from 'express';
import {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getCategories
} from '../controllers/purchaseController.js';
import { uploadInvoice } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getAllPurchases);
router.get('/categories', getCategories);
router.get('/:id', getPurchaseById);
router.post('/', uploadInvoice.single('invoice_file'), createPurchase);
router.put('/:id', uploadInvoice.single('invoice_file'), updatePurchase);
router.delete('/:id', deletePurchase);

export default router;
