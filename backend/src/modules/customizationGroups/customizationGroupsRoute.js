import express from 'express';
import * as customizationController from './customizationGroupsController.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.status(400).json({ message: "Vui lòng cung cấp publicId nhà hàng" });
});
router.get('/:publicId', customizationController.getGroups);
router.post('/', customizationController.createGroup);
router.put('/:groupId', customizationController.updateGroup);
router.delete('/:groupId', customizationController.deleteGroup);

export default router;