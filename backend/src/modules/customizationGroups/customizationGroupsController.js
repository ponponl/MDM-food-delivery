import * as customizationService from './customizationGroupsService.js';

export const getGroups = async (req, res) => {
    try {
        const { publicId } = req.params;
        if (!publicId) {
            return res.status(400).json({ message: "Thiếu publicId của nhà hàng" });
        }

        const groups = await customizationService.getGroupsByRestaurant(publicId);
        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getGroups controller:", error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách nhóm tùy chỉnh" });
    }
};

export const createGroup = async (req, res) => {
    try {
        const { publicId } = req.body;
        const groupData = req.body;

        if (!publicId || !groupData.groupName) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
        }

        const newGroup = await customizationService.addGroup(publicId, groupData);
        res.status(201).json({
            message: "Tạo nhóm tùy chỉnh thành công",
            data: newGroup
        });
    } catch (error) {
        console.error("Error in createGroup controller:", error);
        res.status(500).json({ message: "Lỗi khi tạo nhóm tùy chỉnh" });
    }
};

export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { publicId, ...updateData } = req.body;

        if (!groupId || !publicId) {
            return res.status(400).json({ message: "Thiếu thông tin cập nhật" });
        }

        const updated = await customizationService.updateGroup(publicId, groupId, updateData);
        if (!updated) {
            return res.status(404).json({ message: "Không tìm thấy nhóm để cập nhật" });
        }

        res.status(200).json({
            message: "Cập nhật thành công",
            data: updated
        });
    } catch (error) {
        console.error("Error in updateGroup controller:", error);
        res.status(500).json({ message: "Lỗi khi cập nhật nhóm tùy chỉnh" });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { publicId } = req.query; // Thường delete truyền publicId qua query để xóa cache

        if (!groupId || !publicId) {
            return res.status(400).json({ message: "Thiếu thông tin để xóa" });
        }

        const deleted = await customizationService.deleteGroup(publicId, groupId);
        if (!deleted) {
            return res.status(404).json({ message: "Không tìm thấy nhóm để xóa" });
        }

        res.status(200).json({ message: "Xóa nhóm tùy chỉnh thành công" });
    } catch (error) {
        console.error("Error in deleteGroup controller:", error);
        res.status(500).json({ message: "Lỗi khi xóa nhóm tùy chỉnh" });
    }
};