const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const galleryService = require('../services/gallery.service');

const getPublicGalleries = asyncHandler(async (req, res) => {
  const result = await galleryService.getPublicGalleries(req.query);
  return res.status(200).json(ApiResponse.success('Galleries retrieved successfully', result));
});

const getPublicGalleryByPublicId = asyncHandler(async (req, res) => {
  const result = await galleryService.getPublicGalleryByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Gallery retrieved successfully', result));
});

const getAdminGalleries = asyncHandler(async (req, res) => {
  const result = await galleryService.getAdminGalleries(req.query);
  return res.status(200).json(ApiResponse.success('Galleries retrieved successfully', result));
});

const getAdminGalleryByPublicId = asyncHandler(async (req, res) => {
  const result = await galleryService.getAdminGalleryByPublicId(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Gallery retrieved successfully', result));
});

const createAdminGallery = asyncHandler(async (req, res) => {
  const result = await galleryService.createAdminGallery(req.body, req);
  return res.status(201).json(ApiResponse.success('Gallery created successfully', result));
});

const updateAdminGallery = asyncHandler(async (req, res) => {
  const result = await galleryService.updateAdminGallery(req.params.publicId, req.body, req);
  return res.status(200).json(ApiResponse.success('Gallery updated successfully', result));
});

const deleteAdminGallery = asyncHandler(async (req, res) => {
  const result = await galleryService.deleteAdminGallery(req.params.publicId, req);
  return res.status(200).json(ApiResponse.success(result.message));
});

const publishAdminGallery = asyncHandler(async (req, res) => {
  const result = await galleryService.publishAdminGallery(req.params.publicId, req);
  return res.status(200).json(ApiResponse.success('Gallery published successfully', result));
});

const archiveAdminGallery = asyncHandler(async (req, res) => {
  const result = await galleryService.archiveAdminGallery(req.params.publicId, req);
  return res.status(200).json(ApiResponse.success('Gallery archived successfully', result));
});

const getGalleryImages = asyncHandler(async (req, res) => {
  const result = await galleryService.getGalleryImages(req.params.publicId);
  return res.status(200).json(ApiResponse.success('Gallery images retrieved successfully', result));
});

const addGalleryImage = asyncHandler(async (req, res) => {
  const result = await galleryService.addGalleryImage(req.params.publicId, req.body, req);
  return res.status(201).json(ApiResponse.success('Gallery image added successfully', result));
});

const updateGalleryImage = asyncHandler(async (req, res) => {
  const result = await galleryService.updateGalleryImage(
    req.params.publicId,
    req.params.imagePublicId,
    req.body,
    req
  );
  return res.status(200).json(ApiResponse.success('Gallery image updated successfully', result));
});

const deleteGalleryImage = asyncHandler(async (req, res) => {
  const result = await galleryService.deleteGalleryImage(
    req.params.publicId,
    req.params.imagePublicId,
    req
  );
  return res.status(200).json(ApiResponse.success(result.message));
});

module.exports = {
  getPublicGalleries,
  getPublicGalleryByPublicId,
  getAdminGalleries,
  getAdminGalleryByPublicId,
  createAdminGallery,
  updateAdminGallery,
  deleteAdminGallery,
  publishAdminGallery,
  archiveAdminGallery,
  getGalleryImages,
  addGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
};
