// backend/src/utils/examHelpers.js

/**
 * Global exam deadline = scheduledAt + duration (minutes)
 */
const getExamDeadline = (exam) => {
  return new Date(
    new Date(exam.scheduledAt).getTime() + exam.duration * 60 * 1000
  );
};

/**
 * Student's personal deadline = startedAt + duration (minutes)
 */
const getAttemptDeadline = (exam, attempt) => {
  return new Date(
    new Date(attempt.startedAt).getTime() + exam.duration * 60 * 1000
  );
};

/**
 * Effective deadline = earlier of personal or global.
 * - If student starts at exam.scheduledAt → both are equal
 * - If student starts later → global wins (they get less time)
 */
const getEffectiveDeadline = (exam, attempt) => {
  const globalDeadline = getExamDeadline(exam);
  const personalDeadline = getAttemptDeadline(exam, attempt);
  return personalDeadline < globalDeadline ? personalDeadline : globalDeadline;
};

module.exports = {
  getExamDeadline,
  getAttemptDeadline,
  getEffectiveDeadline,
};