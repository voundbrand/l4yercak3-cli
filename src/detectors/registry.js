/**
 * Detector Registry
 * 
 * Central registry for all project type detectors.
 * Detectors are automatically sorted by priority (highest first).
 */

const nextJsDetector = require('./nextjs-detector');
const expoDetector = require('./expo-detector');
// Future detectors will be added here:
// const reactDetector = require('./react-detector');
// const vueDetector = require('./vue-detector');

/**
 * All registered detectors
 * Add new detectors here as they're implemented
 */
const detectors = [
  nextJsDetector,
  expoDetector,
  // Future: reactDetector, vueDetector, etc.
];

/**
 * Sort detectors by priority (highest first)
 */
const sortedDetectors = [...detectors].sort((a, b) => b.priority - a.priority);

/**
 * Detect project type
 * 
 * Runs all detectors in priority order and returns the first match
 * with confidence > 0.8, or all results if no high-confidence match.
 * 
 * @param {string} projectPath - Path to project directory
 * @returns {object} Detection results
 */
function detectProjectType(projectPath = process.cwd()) {
  const results = {
    detected: null,      // Best match detector
    confidence: 0,       // Confidence of best match
    metadata: {},       // Metadata from best match
    allResults: [],     // All detector results (for debugging)
  };

  // Run all detectors
  for (const detector of sortedDetectors) {
    try {
      const result = detector.detect(projectPath);
      
      results.allResults.push({
        detector: detector.name,
        priority: detector.priority,
        ...result,
      });

      // If this detector found a match with high confidence, use it
      if (result.detected && result.confidence > 0.8) {
        if (result.confidence > results.confidence) {
          results.detected = detector.name;
          results.confidence = result.confidence;
          results.metadata = result.metadata;
        }
      }
    } catch (error) {
      console.error(`Error in detector ${detector.name}:`, error);
      // Continue with other detectors
    }
  }

  return results;
}

/**
 * Get detector by name
 * 
 * @param {string} name - Detector name
 * @returns {object|null} Detector instance or null
 */
function getDetector(name) {
  return detectors.find(d => d.name === name) || null;
}

/**
 * Get all registered detectors
 * 
 * @returns {array} Array of detector instances
 */
function getAllDetectors() {
  return sortedDetectors;
}

module.exports = {
  detectProjectType,
  getDetector,
  getAllDetectors,
  detectors: sortedDetectors, // Expose sorted list
};

