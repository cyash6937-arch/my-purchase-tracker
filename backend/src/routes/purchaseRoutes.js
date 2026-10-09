import express from 'express';
import {
  getAllPurchases,
  getPurchaseById,
  createPurchase,
  createBulkPurchases,
  updatePurchase,
  deletePurchase,
  getCategories
} from '../controllers/purchaseController.js';
import { uploadInvoice } from '../middleware/upload.js';

const router = express.Router();

router.get('/', getAllPurchases);
router.get('/categories', getCategories);
router.get('/:id', getPurchaseById);
router.post('/bulk', uploadInvoice.single('invoice_file'), createBulkPurchases);
router.post('/', uploadInvoice.single('invoice_file'), createPurchase);
router.put('/:id', uploadInvoice.single('invoice_file'), updatePurchase);
router.delete('/:id', deletePurchase);

export default router;
