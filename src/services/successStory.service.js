// backend/src/services/successStory.service.js
const httpStatus = require('http-status').default;
const { SuccessStory } = require('../models');
const ApiError = require('../utils/ApiError');

const createSuccessStory = async (storyBody) => {
  return SuccessStory.create(storyBody);
};

const querySuccessStories = async (filter = {}, options = {}) => {
  const stories = await SuccessStory.paginate(filter, options);
  return stories;
};

const getSuccessStoryById = async (storyId) => {
  return SuccessStory.findById(storyId).populate('createdBy', 'name email');
};

const updateSuccessStoryById = async (storyId, updateBody) => {
  const story = await getSuccessStoryById(storyId);
  if (!story) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Success story not found');
  }
  Object.assign(story, updateBody);
  await story.save();
  return story;
};

const deleteSuccessStoryById = async (storyId) => {
  const story = await getSuccessStoryById(storyId);
  if (!story) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Success story not found');
  }
  await story.deleteOne();
  return story;
};

module.exports = {
  createSuccessStory,
  querySuccessStories,
  getSuccessStoryById,
  updateSuccessStoryById,
  deleteSuccessStoryById,
};