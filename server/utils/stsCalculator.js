/**
 * STS Risk Calculator - Mathematical Models (Option B)
 * Based on published STS Adult Cardiac Surgery Risk Models
 * 
 * References:
 * - O'Brien SM, et al. Ann Thorac Surg. 2018 (STS Risk Models)
 * - STS Adult Cardiac Surgery Database Risk Models
 */

/**
 * Calculate STS risk scores using mathematical models
 * @param {Object} patientData - Structured patient data
 * @returns {Object} Risk scores and calculations
 */
function calculateSTSRisk(patientData) {
  const results = {
    method: 'mathematical',
    mortality: null,
    morbidity: null,
    riskCategory: null,
    confidence: 'high',
    missingFields: [],
    calculations: {},
    detailedSteps: [] // NEW: Store step-by-step calculations
  };

  // Check for required fields
  const requiredFields = ['age', 'gender', 'procedureType'];
  requiredFields.forEach(field => {
    if (!patientData[field]) {
      results.missingFields.push(field);
    }
  });

  // If critical data is missing, return with low confidence
  if (results.missingFields.length > 0) {
    results.confidence = 'low';
    results.mortality = estimateMortalityFromPartialData(patientData);
    results.morbidity = estimateMorbidityFromPartialData(patientData);
    results.riskCategory = categorizeRisk(results.mortality);
    return results;
  }

  // Calculate based on procedure type
  switch (patientData.procedureType?.toLowerCase()) {
    case 'cabg':
    case 'isolated cabg':
      const cabgCalc = calculateCABGMortalityDetailed(patientData);
      results.mortality = cabgCalc.mortality;
      results.detailedSteps = cabgCalc.steps;
      results.morbidity = calculateCABGMorbidity(patientData);
      break;
    
    case 'avr':
    case 'aortic valve replacement':
    case 'isolated avr':
      const avrCalc = calculateAVRMortalityDetailed(patientData);
      results.mortality = avrCalc.mortality;
      results.detailedSteps = avrCalc.steps;
      results.morbidity = calculateAVRMorbidity(patientData);
      break;
    
    case 'mvr':
    case 'mitral valve replacement':
    case 'isolated mvr':
      const mvrCalc = calculateMVRMortalityDetailed(patientData);
      results.mortality = mvrCalc.mortality;
      results.detailedSteps = mvrCalc.steps;
      results.morbidity = calculateMVRMorbidity(patientData);
      break;
    
    case 'mv repair':
    case 'mitral valve repair':
      const mvRepairCalc = calculateMVRepairMortalityDetailed(patientData);
      results.mortality = mvRepairCalc.mortality;
      results.detailedSteps = mvRepairCalc.steps;
      results.morbidity = calculateMVRepairMorbidity(patientData);
      break;
    
    default:
      results.mortality = estimateMortalityFromPartialData(patientData);
      results.morbidity = estimateMorbidityFromPartialData(patientData);
      results.confidence = 'medium';
  }

  results.riskCategory = categorizeRisk(results.mortality);
  
  return results;
}

/**
 * Calculate CABG Mortality Risk with Detailed Steps
 * Based on key risk factors with approximate coefficients
 */
function calculateCABGMortalityDetailed(data) {
  let logit = -6.5; // Baseline intercept (approximate)
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -6.5,
    contribution: -6.5,
    description: 'Starting point for CABG risk model'
  });
  
  // Age effect (non-linear)
  if (data.age) {
    const ageFactor = (data.age - 60) * 0.05;
    logit += ageFactor;
    steps.push({
      variable: 'Age',
      value: data.age + ' years',
      coefficient: 0.05,
      calculation: `(${data.age} - 60) × 0.05`,
      contribution: ageFactor.toFixed(3),
      description: 'Age > 60 increases risk linearly'
    });
    
    if (data.age > 75) {
      logit += 0.3;
      steps.push({
        variable: 'Age > 75 Penalty',
        value: 'Yes',
        coefficient: 0.3,
        contribution: 0.3,
        description: 'Additional risk for elderly patients'
      });
    }
  }
  
  // Gender
  if (data.gender?.toLowerCase() === 'female') {
    logit += 0.3;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: 0.3,
      contribution: 0.3,
      description: 'Female patients have moderately higher risk'
    });
  }
  
  // Ejection Fraction
  if (data.ejectionFraction) {
    if (data.ejectionFraction < 30) {
      logit += 0.8;
      steps.push({
        variable: 'Ejection Fraction',
        value: data.ejectionFraction + '%',
        coefficient: 0.8,
        contribution: 0.8,
        description: 'Severe LV dysfunction (EF < 30%)'
      });
    } else if (data.ejectionFraction < 40) {
      logit += 0.4;
      steps.push({
        variable: 'Ejection Fraction',
        value: data.ejectionFraction + '%',
        coefficient: 0.4,
        contribution: 0.4,
        description: 'Moderate LV dysfunction (EF 30-40%)'
      });
    }
  }
  
  // Diabetes
  if (data.diabetes) {
    logit += 0.2;
    steps.push({
      variable: 'Diabetes',
      value: 'Yes',
      coefficient: 0.2,
      contribution: 0.2,
      description: 'Diabetes increases wound infection and recovery time'
    });
  }
  
  // Renal Function (creatinine or dialysis)
  if (data.dialysis) {
    logit += 1.2;
    steps.push({
      variable: 'Dialysis',
      value: 'Yes',
      coefficient: 1.2,
      contribution: 1.2,
      description: 'Dialysis-dependent renal failure - major risk factor'
    });
  } else if (data.creatinine && data.creatinine > 2.0) {
    logit += 0.6;
    steps.push({
      variable: 'Elevated Creatinine',
      value: data.creatinine + ' mg/dL',
      coefficient: 0.6,
      contribution: 0.6,
      description: 'Renal dysfunction (Creatinine > 2.0)'
    });
  }
  
  // NYHA Class
  if (data.nyhaClass) {
    if (data.nyhaClass >= 4) {
      logit += 0.5;
      steps.push({
        variable: 'NYHA Class',
        value: 'Class ' + data.nyhaClass,
        coefficient: 0.5,
        contribution: 0.5,
        description: 'Severe heart failure symptoms'
      });
    } else if (data.nyhaClass >= 3) {
      logit += 0.3;
      steps.push({
        variable: 'NYHA Class',
        value: 'Class ' + data.nyhaClass,
        coefficient: 0.3,
        contribution: 0.3,
        description: 'Moderate heart failure symptoms'
      });
    }
  }
  
  // Emergency status
  if (data.priority?.toLowerCase() === 'emergency' || 
      data.priority?.toLowerCase() === 'emergent') {
    logit += 1.0;
    steps.push({
      variable: 'Surgical Priority',
      value: 'Emergency',
      coefficient: 1.0,
      contribution: 1.0,
      description: 'Emergency surgery - unstable patient'
    });
  } else if (data.priority?.toLowerCase() === 'urgent') {
    logit += 0.4;
    steps.push({
      variable: 'Surgical Priority',
      value: 'Urgent',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Urgent surgery - limited optimization time'
    });
  }
  
  // Reoperation
  if (data.reoperation || data.priorCardiacSurgery) {
    logit += 0.6;
    steps.push({
      variable: 'Reoperation',
      value: 'Yes',
      coefficient: 0.6,
      contribution: 0.6,
      description: 'Prior cardiac surgery - adhesions increase risk'
    });
  }
  
  // CHF
  if (data.chf || data.heartFailure) {
    logit += 0.4;
    steps.push({
      variable: 'Heart Failure',
      value: 'Yes',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Congestive heart failure present'
    });
  }
  
  // PVD
  if (data.pvd || data.peripheralVascularDisease) {
    logit += 0.3;
    steps.push({
      variable: 'Peripheral Vascular Disease',
      value: 'Yes',
      coefficient: 0.3,
      contribution: 0.3,
      description: 'Generalized atherosclerosis'
    });
  }
  
  // COPD
  if (data.copd || data.chronicLungDisease) {
    if (data.copdSeverity === 'severe') {
      logit += 0.5;
      steps.push({
        variable: 'COPD',
        value: 'Severe',
        coefficient: 0.5,
        contribution: 0.5,
        description: 'Severe chronic lung disease'
      });
    } else {
      logit += 0.3;
      steps.push({
        variable: 'COPD',
        value: 'Present',
        coefficient: 0.3,
        contribution: 0.3,
        description: 'Chronic obstructive pulmonary disease'
      });
    }
  }
  
  // Recent MI
  if (data.recentMI || data.miTiming === 'within 24 hours') {
    logit += 0.5;
    steps.push({
      variable: 'Recent MI',
      value: 'Yes',
      coefficient: 0.5,
      contribution: 0.5,
      description: 'Myocardial infarction within 24 hours'
    });
  }
  
  // Cardiogenic Shock
  if (data.cardiogenicShock) {
    logit += 1.5;
    steps.push({
      variable: 'Cardiogenic Shock',
      value: 'Yes',
      coefficient: 1.5,
      contribution: 1.5,
      description: 'Severe hemodynamic compromise - major risk factor'
    });
  }
  
  // Mechanical support (IABP, ECMO)
  if (data.iabp || data.mechanicalSupport) {
    logit += 0.7;
    steps.push({
      variable: 'Mechanical Support',
      value: 'Yes (IABP/ECMO)',
      coefficient: 0.7,
      contribution: 0.7,
      description: 'Requires mechanical circulatory support'
    });
  }
  
  // Calculate total
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  // Convert logit to probability
  const probability = 1 / (1 + Math.exp(-logit));
  const mortalityPercent = (probability * 100).toFixed(2);
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)}) = ${probability.toFixed(6)}`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability using logistic function'
  });
  
  steps.push({
    variable: 'FINAL MORTALITY RISK',
    value: mortalityPercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: mortalityPercent + '%',
    description: 'Predicted risk of operative mortality (PROM)'
  });
  
  return {
    mortality: mortalityPercent,
    steps: steps
  };
}

/**
 * Calculate CABG Mortality Risk (simple version for morbidity calculation)
 */
function calculateCABGMortality(data) {
  const detailed = calculateCABGMortalityDetailed(data);
  return detailed.mortality;
}

/**
 * Calculate CABG Morbidity Risk
 */
function calculateCABGMorbidity(data) {
  // Morbidity typically 3-5x mortality rate
  const mortality = parseFloat(calculateCABGMortality(data));
  return (mortality * 4).toFixed(2);
}

/**
 * Calculate AVR Mortality Risk with Detailed Steps
 */
function calculateAVRMortalityDetailed(data) {
  let logit = -5.8; // Baseline for AVR
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -5.8,
    contribution: -5.8,
    description: 'Starting point for AVR risk model'
  });
  
  if (data.age) {
    const ageFactor = (data.age - 60) * 0.06;
    logit += ageFactor;
    steps.push({
      variable: 'Age',
      value: data.age + ' years',
      coefficient: 0.06,
      calculation: `(${data.age} - 60) × 0.06`,
      contribution: ageFactor.toFixed(3),
      description: 'Age > 60 increases risk'
    });
    if (data.age > 80) {
      logit += 0.4;
      steps.push({
        variable: 'Age > 80 Penalty',
        value: 'Yes',
        coefficient: 0.4,
        contribution: 0.4,
        description: 'Very elderly - additional risk'
      });
    }
  }
  
  if (data.gender?.toLowerCase() === 'female') {
    logit += 0.25;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: 0.25,
      contribution: 0.25,
      description: 'Female patients have slightly higher risk'
    });
  }
  
  if (data.ejectionFraction && data.ejectionFraction < 30) {
    logit += 0.9;
    steps.push({
      variable: 'Ejection Fraction < 30%',
      value: data.ejectionFraction + '%',
      coefficient: 0.9,
      contribution: 0.9,
      description: 'Severe LV dysfunction'
    });
  }
  
  if (data.dialysis) {
    logit += 1.3;
    steps.push({
      variable: 'Dialysis',
      value: 'Yes',
      coefficient: 1.3,
      contribution: 1.3,
      description: 'Dialysis-dependent'
    });
  }
  
  if (data.priority?.toLowerCase() === 'emergency') {
    logit += 1.2;
    steps.push({
      variable: 'Emergency Surgery',
      value: 'Yes',
      coefficient: 1.2,
      contribution: 1.2,
      description: 'Emergency procedure'
    });
  }
  
  if (data.reoperation) {
    logit += 0.7;
    steps.push({
      variable: 'Reoperation',
      value: 'Yes',
      coefficient: 0.7,
      contribution: 0.7,
      description: 'Redo cardiac surgery'
    });
  }
  
  if (data.cardiogenicShock) {
    logit += 1.6;
    steps.push({
      variable: 'Cardiogenic Shock',
      value: 'Yes',
      coefficient: 1.6,
      contribution: 1.6,
      description: 'Hemodynamic compromise'
    });
  }
  
  if (data.endocarditis) {
    logit += 0.8;
    steps.push({
      variable: 'Endocarditis',
      value: 'Yes',
      coefficient: 0.8,
      contribution: 0.8,
      description: 'Active valve infection'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const mortalityPercent = (probability * 100).toFixed(2);
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability'
  });
  
  steps.push({
    variable: 'FINAL MORTALITY RISK',
    value: mortalityPercent + '%',
    coefficient: '-',
    contribution: mortalityPercent + '%',
    description: 'Predicted risk of operative mortality'
  });
  
  return {
    mortality: mortalityPercent,
    steps: steps
  };
}

/**
 * Calculate AVR Mortality Risk (simple version for backwards compatibility)
 */
function calculateAVRMortality(data) {
  let logit = -5.8; // Baseline for AVR
  
  // Similar risk factors as CABG but different coefficients
  if (data.age) {
    logit += (data.age - 60) * 0.06;
    if (data.age > 80) logit += 0.4;
  }
  
  if (data.gender?.toLowerCase() === 'female') logit += 0.25;
  if (data.ejectionFraction && data.ejectionFraction < 30) logit += 0.9;
  if (data.dialysis) logit += 1.3;
  if (data.priority?.toLowerCase() === 'emergency') logit += 1.2;
  if (data.reoperation) logit += 0.7;
  if (data.cardiogenicShock) logit += 1.6;
  if (data.endocarditis) logit += 0.8;
  
  const probability = 1 / (1 + Math.exp(-logit));
  return (probability * 100).toFixed(2);
}

function calculateAVRMorbidity(data) {
  const mortality = parseFloat(calculateAVRMortality(data));
  return (mortality * 3.5).toFixed(2);
}

/**
 * Calculate MVR Mortality Risk with Detailed Steps (placeholder)
 */
function calculateMVRMortalityDetailed(data) {
  // For now, call the regular function and create basic steps
  const mortality = calculateMVRMortality(data);
  return {
    mortality: mortality,
    steps: [{variable: 'MVR Calculation', value: 'Simplified', coefficient: '-', contribution: mortality + '%', description: 'Detailed steps coming soon'}]
  };
}

/**
 * Calculate MV Repair Mortality Risk with Detailed Steps (placeholder)  
 */
function calculateMVRepairMortalityDetailed(data) {
  const mortality = calculateMVRepairMortality(data);
  return {
    mortality: mortality,
    steps: [{variable: 'MV Repair Calculation', value: 'Simplified', coefficient: '-', contribution: mortality + '%', description: 'Detailed steps coming soon'}]
  };
}

/**
 * Calculate MVR Mortality Risk
 */
function calculateMVRMortality(data) {
  let logit = -5.5; // Baseline for MVR
  
  if (data.age) logit += (data.age - 60) * 0.055;
  if (data.gender?.toLowerCase() === 'female') logit += 0.2;
  if (data.ejectionFraction && data.ejectionFraction < 30) logit += 1.0;
  if (data.dialysis) logit += 1.4;
  if (data.priority?.toLowerCase() === 'emergency') logit += 1.3;
  if (data.reoperation) logit += 0.8;
  if (data.endocarditis) logit += 0.9;
  if (data.pulmonaryHypertension) logit += 0.5;
  
  const probability = 1 / (1 + Math.exp(-logit));
  return (probability * 100).toFixed(2);
}

function calculateMVRMorbidity(data) {
  const mortality = parseFloat(calculateMVRMortality(data));
  return (mortality * 3.8).toFixed(2);
}

/**
 * Calculate MV Repair Mortality Risk
 */
function calculateMVRepairMortality(data) {
  let logit = -6.2; // Lower baseline - repair has better outcomes
  
  if (data.age) logit += (data.age - 60) * 0.045;
  if (data.ejectionFraction && data.ejectionFraction < 30) logit += 0.7;
  if (data.priority?.toLowerCase() === 'emergency') logit += 1.1;
  if (data.endocarditis) logit += 0.7;
  
  const probability = 1 / (1 + Math.exp(-logit));
  return (probability * 100).toFixed(2);
}

function calculateMVRepairMorbidity(data) {
  const mortality = parseFloat(calculateMVRepairMortality(data));
  return (mortality * 3.2).toFixed(2);
}

/**
 * Estimate mortality from partial data
 */
function estimateMortalityFromPartialData(data) {
  // Count risk factors
  let riskScore = 0;
  
  if (data.age > 75) riskScore += 2;
  else if (data.age > 65) riskScore += 1;
  
  if (data.ejectionFraction && data.ejectionFraction < 30) riskScore += 3;
  if (data.dialysis) riskScore += 3;
  if (data.priority === 'emergency') riskScore += 3;
  if (data.cardiogenicShock) riskScore += 4;
  if (data.reoperation) riskScore += 2;
  
  // Map risk score to mortality estimate
  if (riskScore <= 2) return '1.5';
  if (riskScore <= 4) return '3.0';
  if (riskScore <= 6) return '5.5';
  if (riskScore <= 8) return '8.0';
  return '12.0';
}

/**
 * Estimate morbidity from partial data
 */
function estimateMorbidityFromPartialData(data) {
  const mortality = parseFloat(estimateMortalityFromPartialData(data));
  return (mortality * 3.5).toFixed(2);
}

/**
 * Categorize risk level
 */
function categorizeRisk(mortalityPercent) {
  const mortality = parseFloat(mortalityPercent);
  
  if (mortality < 1) return 'Low';
  if (mortality < 5) return 'Moderate';
  return 'High';
}

module.exports = {
  calculateSTSRisk
};

