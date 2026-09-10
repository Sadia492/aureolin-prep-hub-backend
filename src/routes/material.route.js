// backend/src/routes/material.route.js
const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const materialValidation = require('../validations/material.validation');
const materialController = require('../controllers/material.controller');
const fileUploader = require('../utils/fileUploader');

const router = express.Router();

// ✅ Public (no auth) — must be BEFORE /:materialId
router.get(
  '/public',
  validate(materialValidation.getPublicMaterials),
  materialController.getPublicMaterials
);

// Protected
router
  .route('/')
  .post(
    auth('manageMaterials'),
    fileUploader.upload.single('file'),
    validate(materialValidation.createMaterial),
    materialController.createMaterial
  )
  .get(
    auth('getMaterials'),
    validate(materialValidation.getMaterials),
    materialController.getMaterials
  );

router
  .route('/:materialId')
  .get(
    auth('getMaterials'),
    validate(materialValidation.getMaterial),
    materialController.getMaterial
  )
  .patch(
    auth('manageMaterials'),
    validate(materialValidation.updateMaterial),
    materialController.updateMaterial
  )
  .delete(
    auth('manageMaterials'),
    validate(materialValidation.deleteMaterial),
    materialController.deleteMaterial
  );

router.get(
  '/:materialId/download',
  auth('getMaterials'),
  materialController.downloadMaterial
);

module.exports = router;