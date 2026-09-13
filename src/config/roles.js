const allRoles = {
  student: [
    'getCourses',
    'enrollCourses',
    'getExams',
    'getQuestions',
    'createAttempts',
    'takeExams',
    'getAttempts',
    'createQnAs',
    'getQnAs',
    'getDashboard',
    'getMaterials',
    'getAnalytics',
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
     'getSuccessStories',
     'getMaterials',
     'manageMaterials',
     'manageSuccessStories',
     'getSuccessStories',
     'getAnalytics',
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
    'getSuccessStories', 'manageSuccessStories', // ✅ Added
    'getMaterials', 'manageMaterials', // ✅ Added
    'getAnalytics',
  ],
};

const roles = Object.keys(allRoles);

const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
