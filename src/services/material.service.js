// backend/src/services/material.service.js
const httpStatus = require('http-status').default;
const { Material } = require('../models');
const ApiError = require('../utils/ApiError');

const createMaterial = async (body) => Material.create(body);

const queryMaterials = async (filter = {}, options = {}) => {
  return Material.paginate(filter, {
    ...options,
    populate: [
      { path: 'uploadedBy', select: 'name email role' },
      { path: 'course', select: 'title unit' },
    ],
  });
};

const getMaterialById = async (id) => {
  return Material.findById(id)
    .populate('uploadedBy', 'name email role')
    .populate('course', 'title unit');
};

const updateMaterialById = async (id, body) => {
  const material = await getMaterialById(id);
  if (!material) throw new ApiError(httpStatus.NOT_FOUND, 'Material not found');
  Object.assign(material, body);
  await material.save();
  return material;
};

const deleteMaterialById = async (id) => {
  const material = await getMaterialById(id);
  if (!material) throw new ApiError(httpStatus.NOT_FOUND, 'Material not found');
  await material.deleteOne();
  return material;
};

const incrementDownload = async (id) => {
  return Material.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } }, { new: true });
};

module.exports = {
  createMaterial,
  queryMaterials,
  getMaterialById,
  updateMaterialById,
  deleteMaterialById,
  incrementDownload,
};