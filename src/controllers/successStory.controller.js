// backend/src/controllers/successStory.controller.js
const httpStatus = require('http-status').default;
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { successStoryService } = require('../services');

const createSuccessStory = catchAsync(async (req, res) => {
  const story = await successStoryService.createSuccessStory({
    ...req.body,
    createdBy: req.user.id,
  });
  res
    .status(httpStatus.CREATED)
    .send(new ApiResponse(httpStatus.CREATED, story, 'Success story created successfully'));
});

const getSuccessStories = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.name) filter.name = { $regex: req.query.name, $options: 'i' };
  if (req.query.background) filter.background = req.query.background;
  if (req.query.session) filter.session = req.query.session;
  if (req.query.isPublished !== undefined) {
    filter.isPublished = req.query.isPublished === 'true';
  }

  const options = {
    sortBy: req.query.sortBy || 'createdAt:desc',
    limit: parseInt(req.query.limit) || 10,
    page: parseInt(req.query.page) || 1,
    populate: 'createdBy',
  };

  const result = await successStoryService.querySuccessStories(filter, options);
  res.send(new ApiResponse(httpStatus.OK, result, 'Success stories retrieved successfully'));
});

// ✅ Public endpoint
const getPublicSuccessStories = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const background = req.query.background;

  // ✅ Only published stories for public
  const filter = { isPublished: true };
  if (background) filter.background = background;

  const options = {
    limit,
    sortBy: 'createdAt:desc',
  };

  const result = await successStoryService.querySuccessStories(filter, options);
  const stories = result?.docs || result || [];

  res.send(
    new ApiResponse(
      httpStatus.OK,
      { docs: stories, totalDocs: stories.length },
      'Success stories retrieved successfully'
    )
  );
});

const getSuccessStory = catchAsync(async (req, res) => {
  const story = await successStoryService.getSuccessStoryById(req.params.storyId);
  if (!story) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Success story not found');
  }
  res.send(new ApiResponse(httpStatus.OK, story, 'Success story retrieved successfully'));
});

const updateSuccessStory = catchAsync(async (req, res) => {
  const story = await successStoryService.updateSuccessStoryById(
    req.params.storyId,
    req.body
  );
  res.send(new ApiResponse(httpStatus.OK, story, 'Success story updated successfully'));
});

const deleteSuccessStory = catchAsync(async (req, res) => {
  await successStoryService.deleteSuccessStoryById(req.params.storyId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSuccessStory,
  getSuccessStories,
  getPublicSuccessStories,
  getSuccessStory,
  updateSuccessStory,
  deleteSuccessStory,
};