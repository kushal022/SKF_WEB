const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const productMediaService = require('../services/productMedia.service');

// ==================== PRODUCT IMAGES ====================

const getProductImages = asyncHandler(async (req, res) => {
  const images = await productMediaService.getProductImages(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Product images fetched successfully', { images })
  );
});

const addProductImage = asyncHandler(async (req, res) => {
  const image = await productMediaService.addProductImage(req.params.publicId, req.body, req);
  return res.status(201).json(
    ApiResponse.success('Product image added successfully', { image })
  );
});

const updateProductImage = asyncHandler(async (req, res) => {
  const image = await productMediaService.updateProductImage(
    req.params.publicId,
    req.params.imagePublicId,
    req.body,
    req
  );
  return res.status(200).json(
    ApiResponse.success('Product image updated successfully', { image })
  );
});

const deleteProductImage = asyncHandler(async (req, res) => {
  await productMediaService.deleteProductImage(req.params.publicId, req.params.imagePublicId, req);
  return res.status(200).json(
    ApiResponse.success('Product image deleted successfully', {})
  );
});

const setPrimaryProductImage = asyncHandler(async (req, res) => {
  const image = await productMediaService.setPrimaryProductImage(
    req.params.publicId,
    req.params.imagePublicId,
    req
  );
  return res.status(200).json(
    ApiResponse.success('Primary product image updated successfully', { image })
  );
});

const reorderProductImages = asyncHandler(async (req, res) => {
  const images = await productMediaService.reorderProductImages(
    req.params.publicId,
    req.body.items,
    req
  );
  return res.status(200).json(
    ApiResponse.success('Product images reordered successfully', { images })
  );
});

// ==================== PRODUCT VIDEOS ====================

const getProductVideos = asyncHandler(async (req, res) => {
  const videos = await productMediaService.getProductVideos(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Product videos fetched successfully', { videos })
  );
});

const addProductVideo = asyncHandler(async (req, res) => {
  const video = await productMediaService.addProductVideo(req.params.publicId, req.body, req);
  return res.status(201).json(
    ApiResponse.success('Product video added successfully', { video })
  );
});

const updateProductVideo = asyncHandler(async (req, res) => {
  const video = await productMediaService.updateProductVideo(
    req.params.publicId,
    req.params.videoPublicId,
    req.body,
    req
  );
  return res.status(200).json(
    ApiResponse.success('Product video updated successfully', { video })
  );
});

const deleteProductVideo = asyncHandler(async (req, res) => {
  await productMediaService.deleteProductVideo(req.params.publicId, req.params.videoPublicId, req);
  return res.status(200).json(
    ApiResponse.success('Product video deleted successfully', {})
  );
});

// ==================== PRODUCT SPECS ====================

const getProductSpecs = asyncHandler(async (req, res) => {
  const specs = await productMediaService.getProductSpecs(req.params.publicId);
  return res.status(200).json(
    ApiResponse.success('Product specifications fetched successfully', { specs })
  );
});

const addProductSpec = asyncHandler(async (req, res) => {
  const spec = await productMediaService.addProductSpec(req.params.publicId, req.body, req);
  return res.status(201).json(
    ApiResponse.success('Product specification added successfully', { spec })
  );
});

const updateProductSpec = asyncHandler(async (req, res) => {
  const spec = await productMediaService.updateProductSpec(
    req.params.publicId,
    req.params.specPublicId,
    req.body,
    req
  );
  return res.status(200).json(
    ApiResponse.success('Product specification updated successfully', { spec })
  );
});

const deleteProductSpec = asyncHandler(async (req, res) => {
  await productMediaService.deleteProductSpec(req.params.publicId, req.params.specPublicId, req);
  return res.status(200).json(
    ApiResponse.success('Product specification deleted successfully', {})
  );
});

module.exports = {
  getProductImages,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  reorderProductImages,
  getProductVideos,
  addProductVideo,
  updateProductVideo,
  deleteProductVideo,
  getProductSpecs,
  addProductSpec,
  updateProductSpec,
  deleteProductSpec,
};
