// backend/src/controllers/material.controller.js
const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { materialService } = require('../services');
const fileUploader = require('../utils/fileUploader');

const createMaterial = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'File is required');
  }

  // ✅ Upload to Cloudinary
  const uploadResult = await fileUploader.uploadToCloudinary(req.file);

  const material = await materialService.createMaterial({
    ...req.body,
    fileUrl: uploadResult.secure_url,
    filePublicId: uploadResult.public_id,
    fileSize: uploadResult.bytes || req.file.size,
    fileFormat: uploadResult.format,
    uploadedBy: req.user.id,
  });

  res.status(httpStatus.CREATED).send(
    new ApiResponse(httpStatus.CREATED, material, 'Material uploaded successfully')
  );
});


const getMaterials = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.targetUnit) filter.targetUnit = req.query.targetUnit;
  if (req.query.isPublished !== undefined) {
    filter.isPublished = req.query.isPublished === 'true';
  }
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: 'i' };
  }

  const options = {
    sortBy: req.query.sortBy || 'createdAt:desc',
    limit: parseInt(req.query.limit) || 10,
    page: parseInt(req.query.page) || 1,
  };

  const result = await materialService.queryMaterials(filter, options);
  res.send(new ApiResponse(httpStatus.OK, result, 'Materials retrieved successfully'));
});

const getPublicMaterials = catchAsync(async (req, res) => {
  const filter = { isPublished: true };
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.targetUnit) filter.targetUnit = req.query.targetUnit;
  if (req.query.type) filter.type = req.query.type;

  const options = {
    limit: parseInt(req.query.limit) || 20,
    sortBy: 'createdAt:desc',
  };

  const result = await materialService.queryMaterials(filter, options);
  const materials = result?.docs || result || [];
  res.send(
    new ApiResponse(
      httpStatus.OK,
      { docs: materials, totalDocs: materials.length },
      'Materials retrieved successfully'
    )
  );
});

const getMaterial = catchAsync(async (req, res) => {
  const material = await materialService.getMaterialById(req.params.materialId);
  if (!material) throw new ApiError(httpStatus.NOT_FOUND, 'Material not found');
  res.send(new ApiResponse(httpStatus.OK, material, 'Material retrieved successfully'));
});

const updateMaterial = catchAsync(async (req, res) => {
  const material = await materialService.updateMaterialById(req.params.materialId, req.body);
  res.send(new ApiResponse(httpStatus.OK, material, 'Material updated successfully'));
});

const deleteMaterial = catchAsync(async (req, res) => {
  const material = await materialService.getMaterialById(req.params.materialId);
  if (!material) throw new ApiError(httpStatus.NOT_FOUND, 'Material not found');

  // ✅ Delete from Cloudinary
  if (material.filePublicId) {
    const resourceType = material.fileFormat === 'pdf' ? 'raw' : 'image';
    try {
      await fileUploader.deleteFromCloudinary(material.filePublicId, resourceType);
    } catch (err) {
      console.error('Cloudinary delete failed:', err.message);
    }
  }

  await materialService.deleteMaterialById(req.params.materialId);
  res.status(httpStatus.NO_CONTENT).send();
});
const downloadMaterial = catchAsync(async (req, res) => {
  const material = await materialService.incrementDownload(req.params.materialId);
  if (!material) throw new ApiError(httpStatus.NOT_FOUND, 'Material not found');
  res.send(new ApiResponse(httpStatus.OK, { fileUrl: material.fileUrl }, 'Download link'));
});

module.exports = {
  createMaterial,
  getMaterials,
  getPublicMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  downloadMaterial,
};