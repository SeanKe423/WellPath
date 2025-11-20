const User = require('../models/User');
const Institution = require('../models/Institution');

//Function to calculate the distance between the user and institution's coordinates using the Haversine formula
const calculateDistance = (coords1, coords2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coords2[0] - coords1[0]); //Difference in latitude
  const dLon = toRad(coords2[1] - coords1[1]); //Difference in longitude
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(coords1[0])) * Math.cos(toRad(coords2[0])) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; //Distance in km
};

//Function to convert degrees to radians
const toRad = (degrees) => {
  return degrees * (Math.PI/180);
};

const filterEligibleInstitutions = (institutions, userPreferences) => {
  return institutions.filter(institution => {
    // Basic requirements
    if (!institution.isLegallyRegistered || 
        !institution.consentToDisplay ||
        institution.approvalStatus === 'rejected' || // Exclude rejected institutions
        institution.approvalStatus !== 'approved') { // Only include approved institutions
      return false;
    }

    // Mode compatibility
    const userPrefersOnline = userPreferences.preferredMode.includes('online');
    const userPrefersInPerson = userPreferences.preferredMode.includes('in-person');
    
    if (userPrefersOnline && institution.virtualCounseling !== 'yes') {
      return false;
    }

    return true;
  });
};

const calculateCounselingMatchScore = (userTypes, institutionServices, severityLevel) => {
  let score = 0;
  const maxScore = 40;

  // Count matching services
  const matches = userTypes.filter(type => 
    institutionServices.includes(type)
  ).length;

  // Base score on number of matches
  score = (matches / userTypes.length) * maxScore;

  // Adjust for severity level
  if (severityLevel === 'severe') {
    // Prioritize institutions with more matching services
    score *= 1.2;
  } else if (severityLevel === 'mild') {
    // More lenient matching for mild cases
    score *= 0.9;
  }

  return Math.min(score, maxScore);
};

const calculateLanguageMatchScore = (userLanguages, institutionLanguages) => {
  const maxScore = 20;
  const matches = userLanguages.filter(lang => 
    institutionLanguages.includes(lang)
  ).length;

  return (matches / userLanguages.length) * maxScore;
};

const calculateLocationMatchScore = (userLocation, institutionLocation, preferredMode) => {
  const maxScore = 20;
  let score = 0;

  if (preferredMode.includes('online')) {
    // For online sessions, location is less important so we multiply by 0.8
    score = maxScore * 0.8;
  } else {
    // Calculate distance between user and institution
    const distance = calculateDistance(
      userLocation.coordinates,
      institutionLocation.coordinates
    );

    // Score based on distance (closer = higher score)
    const MAX_DISTANCE = 100; // 100km
    score = maxScore * (1 - (distance / MAX_DISTANCE));
  }

  return Math.min(score, maxScore);
};

// Age group matching uses standardized values: children (3–12), adolescents (13–17), youngAdults (18–35), adults (36–60), seniors (61+)
const calculateAgeGroupMatchScore = (userAgeGroup, institutionTargetAgeGroups) => {
  const maxScore = 10;
  return institutionTargetAgeGroups.includes(userAgeGroup) ? maxScore : 0;
};

const calculateWaitTimeScore = (institutionWaitTime, userSeverityLevel) => {
  const waitValue = {
    'sameWeek': 1,
    '1-2weeks': 2,
    '3+weeks': 3
  }[institutionWaitTime] || 3;

  // Smooth base score: 10 → 7 → 4
  let score = 10 - (waitValue - 1) * 3;

  const severityMultiplier = {
    mild: 1,
    moderate: 0.8,
    severe: 0.4
  };

  score *= severityMultiplier[userSeverityLevel] || 1;

  return score;
};

const getMatchQuality = (score) => {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Moderate Match';
  return 'Weak Match';
};

const findMatches = (user, institutions) => {
  try {
    // 1. Filter eligible institutions
    const eligibleInstitutions = filterEligibleInstitutions(institutions, user);

    // 2. Calculate scores for each institution
    const scoredInstitutions = eligibleInstitutions.map(institution => {
      // Ensure targetAgeGroups is an array
      const targetAgeGroups = Array.isArray(institution.targetAgeGroups) ? 
        institution.targetAgeGroups : 
        [];

      console.log('Institution age groups:', {
        id: institution._id,
        name: institution.institutionName,
        targetAgeGroups
      });

      const counselingScore = calculateCounselingMatchScore(
        user.counselingServices || [],
        institution.counselingServices || [],
        user.severityLevel || 'moderate'
      );

      const languageScore = calculateLanguageMatchScore(
        user.languages || [],
        institution.languages || []
      );

      const locationScore = calculateLocationMatchScore(
        user.location || { coordinates: [0, 0] },
        institution.location || { coordinates: [0, 0] },
        user.preferredMode || ['online']
      );

      const ageGroupScore = calculateAgeGroupMatchScore(
        user.ageGroup || 'adult',
        targetAgeGroups
      );

      const waitTimeScore = calculateWaitTimeScore(
        institution.waitTime,
        user.severityLevel || 'moderate'
      );

      // Calculate total score
      const totalScore = 
        counselingScore +
        languageScore +
        locationScore +
        ageGroupScore +
        waitTimeScore;

      return {
        institution: {
          ...institution.toObject(),
          id: institution._id,
          name: institution.institutionName,
          counselingServices: institution.counselingServices || institution.services || [],
          targetAgeGroups
        },
        scores: {
          counseling: counselingScore,
          language: languageScore,
          location: locationScore,
          ageGroup: ageGroupScore,
          waitTime: waitTimeScore,
          total: totalScore
        }
      };
    });

    // 3. Sort by total score and get top matches
    const sortedMatches = scoredInstitutions
      .sort((a, b) => b.scores.total - a.scores.total)
      .slice(0, 5);

    // 4. Add match quality indicators
    return sortedMatches.map(match => ({
      ...match,
      matchQuality: getMatchQuality(match.scores.total)
    }));
  } catch (error) {
    console.error('Error in findMatches:', error);
    throw error;
  }
};

// Export the findMatches function
module.exports = {
  findMatches
}; 