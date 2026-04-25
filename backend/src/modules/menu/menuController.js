import * as menuService from './menuService.js';

export const addDish = async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ message: "Thiếu publicId nhà hàng." });
    const result = await menuService.addDish(publicId, req.body, req.file);
    res.status(201).json({ message: "Thêm thành công", menu: result.menu });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDish = async (req, res) => {
  try {
    const { publicId } = req.body;
    const { itemId } = req.params;
    if (!publicId) return res.status(400).json({ message: "Thiếu publicId nhà hàng." });
    const result = await menuService.updateDish(publicId, itemId, req.body, req.file);
    res.status(200).json({ message: "Cập nhật thành công", menu: result.menu});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDish = async (req, res) => {
  try {
    const { publicId } = req.body;
    const { itemId } = req.params;
    if (!publicId) return res.status(400).json({ message: "Thiếu publicId nhà hàng." });
    const result = await menuService.deleteDish(publicId, itemId);
    if (!result) return res.status(404).json({ message: "Món ăn không tồn tại." });
    res.status(200).json({ message: "Xóa thành công", menu: result.menu });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRestaurantMenu = async (req, res) => {
  try {
    const menu = await menuService.getRestaurantMenu(req.params.publicId);
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMenuItem = async (req, res) => {
  try {
    const item = await menuService.getMenuItem(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Món ăn không tồn tại" });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};