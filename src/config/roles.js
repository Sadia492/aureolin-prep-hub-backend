const allRoles = {
  student: [
    'getCourses',
    'enrollCourses',
    'getExams',
    'getQuestions',
    'createAttempts',
    'getAttempts',
    'createQnAs',
    'getQnAs',
    'getDashboard',
  ],
  teacher: [
    'getUsers',
    'manageCourses',
    'getCourses',
    'manageExams',
    'getExams',
    'manageQuestions',
    'getQuestions',
    'getAttempts',
    'answerQnAs',
    'getQnAs',
    'getAnalytics',
    'getDashboard',
  ],
  admin: [
    'getUsers',
    'manageUsers',
    'manageCourses',
    'getCourses',
    'manageExams',
    'getExams',
    'manageQuestions',
    'getQuestions',
    'getAttempts',
    'manageAttempts',
    'answerQnAs',
    'getQnAs',
    'manageQnAs',
    'getAnalytics',
    'getDashboard',
  ],
};

const roles = Object.keys(allRoles);

const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
