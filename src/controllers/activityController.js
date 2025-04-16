// controllers/activityController.js
const Activity = require('../models/Activity');

const logActivity = async (userName, activityDescription, projectId, teamId) => {
  
  // console.log(user, activityDescription, projectId, teamId)

  const newActivity = new Activity({
    responsible: userName,
    activity: activityDescription,
    project: projectId,
    teamId: teamId,
  });

  await newActivity.save();

  return newActivity
};

module.exports = { logActivity };
