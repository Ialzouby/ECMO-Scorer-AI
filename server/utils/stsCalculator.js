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
    stroke: null,
    renalFailure: null,
    reoperation: null,
    prolongedVentilation: null,
    deepSternalWoundInfection: null,
    longHospitalStay: null,
    shortHospitalStay: null,
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
      
      // Get detailed morbidity calculation
      const morbCalc = calculateCABGMorbidityDetailed(patientData);
      results.morbidity = morbCalc.morbidity;
      results.morbiditySteps = morbCalc.steps;
      
      // Get detailed calculations for all outcomes
      const strokeCalc = calculateCABGStrokeDetailed(patientData);
      results.stroke = strokeCalc.stroke;
      results.strokeSteps = strokeCalc.steps;
      
      const renalCalc = calculateCABGRenalFailureDetailed(patientData);
      results.renalFailure = renalCalc.renalFailure;
      results.renalFailureSteps = renalCalc.steps;
      
      const reopCalc = calculateCABGReoperationDetailed(patientData);
      results.reoperation = reopCalc.reoperation;
      results.reoperationSteps = reopCalc.steps;
      
      const ventCalc = calculateCABGProlongedVentilationDetailed(patientData);
      results.prolongedVentilation = ventCalc.prolongedVentilation;
      results.prolongedVentilationSteps = ventCalc.steps;
      
      const infectionCalc = calculateCABGDeepSternalWoundInfectionDetailed(patientData);
      results.deepSternalWoundInfection = infectionCalc.deepSternalWoundInfection;
      results.deepSternalWoundInfectionSteps = infectionCalc.steps;
      
      const longStayCalc = calculateCABGLongHospitalStayDetailed(patientData);
      results.longHospitalStay = longStayCalc.longHospitalStay;
      results.longHospitalStaySteps = longStayCalc.steps;
      
      const shortStayCalc = calculateCABGShortHospitalStayDetailed(patientData);
      results.shortHospitalStay = shortStayCalc.shortHospitalStay;
      results.shortHospitalStaySteps = shortStayCalc.steps;
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
  let logit = -6.0; // Baseline intercept (calibrated to match typical STS baseline risk ~2-3% with standard risk factors)
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -6.0,
    contribution: -6.0,
    description: 'Starting point for CABG risk model'
  });
  
  // Age effect (non-linear) - only applies when age > 60
  if (data.age) {
    if (data.age > 60) {
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
    } else {
      // Age <= 60: no age penalty (baseline risk)
      steps.push({
        variable: 'Age',
        value: data.age + ' years',
        coefficient: 0.0,
        calculation: 'Age ≤ 60 (no penalty)',
        contribution: '0.000',
        description: 'Age ≤ 60: baseline risk (no age penalty)'
      });
    }
    
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
  
  // Diabetes - check if diabetes exists and is not "No"
  if (data.diabetes && data.diabetes.toString().toLowerCase() !== 'no') {
    logit += 0.2;
    steps.push({
      variable: 'Diabetes',
      value: data.diabetes,
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
  
  // Emergency status - handle various formats including "Emergent Salvage"
  const priorityLower = data.priority?.toLowerCase() || '';
  if (priorityLower.includes('emergency') || priorityLower.includes('emergent')) {
    logit += 1.0;
    steps.push({
      variable: 'Surgical Priority',
      value: data.priority || 'Emergency',
      coefficient: 1.0,
      contribution: 1.0,
      description: 'Emergency surgery - unstable patient'
    });
  } else if (priorityLower === 'urgent') {
    logit += 0.4;
    steps.push({
      variable: 'Surgical Priority',
      value: 'Urgent',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Urgent surgery - limited optimization time'
    });
  }
  
  // Reoperation - check multiple fields including surgeryIncidence
  if (data.reoperation || data.priorCardiacSurgery || data.previousCABG || data.previousValve ||
      (data.surgeryIncidence && data.surgeryIncidence.toLowerCase().includes('reop'))) {
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
  
  // Recent MI - only apply penalty for MI within 21 days
  // MI > 21 days ago does NOT increase risk significantly in STS models
  const miTimingLower = data.miTiming?.toLowerCase() || '';
  if (data.recentMI || 
      miTimingLower.includes('≤ 6 hrs') || 
      miTimingLower.includes('≤6 hrs') ||
      miTimingLower.includes('<24') ||
      miTimingLower.includes('1 to 7 days') ||
      miTimingLower.includes('8 to 21 days')) {
    // Only count if within 21 days - "> 21 days" does not trigger penalty
    if (!miTimingLower.includes('> 21 days') && !miTimingLower.includes('>21 days')) {
      const miPenalty = (miTimingLower.includes('≤ 6 hrs') || miTimingLower.includes('≤6 hrs')) ? 0.7 : 0.5;
      logit += miPenalty;
      steps.push({
        variable: 'Recent MI',
        value: data.miTiming || 'Yes',
        coefficient: miPenalty,
        contribution: miPenalty,
        description: 'Myocardial infarction within 21 days'
      });
    }
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
  
  // Left main disease (≥50% stenosis)
  if (data.leftMainStenosis || data.leftMainDisease) {
    logit += 0.5;
    steps.push({
      variable: 'Left Main Stenosis',
      value: '≥50%',
      coefficient: 0.5,
      contribution: 0.5,
      description: 'Left main coronary artery disease - high risk anatomy'
    });
  }
  
  // Note: Three-vessel disease is typically not a separate risk factor in STS models
  // as it's part of the procedure indication itself
  
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
 * Calculate CABG Morbidity & Mortality Risk with Detailed Steps
 * PROMM = Predicted Risk of Morbidity or Mortality (composite outcome)
 */
function calculateCABGMorbidityDetailed(data) {
  let logit = -4.85; // Baseline intercept for PROMM (higher baseline than mortality alone)
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -4.85,
    contribution: -4.85,
    description: 'Starting point for morbidity/mortality composite model'
  });
  
  // Age effect - morbidity increases more sharply with age than mortality
  if (data.age) {
    if (data.age > 60) {
      const ageFactor = (data.age - 60) * 0.055;
      logit += ageFactor;
      steps.push({
        variable: 'Age',
        value: data.age + ' years',
        coefficient: 0.055,
        calculation: `(${data.age} - 60) × 0.055`,
        contribution: ageFactor.toFixed(3),
        description: 'Age > 60 increases complications'
      });
    }
    
    if (data.age > 75) {
      logit += 0.35;
      steps.push({
        variable: 'Age > 75 Penalty',
        value: 'Yes',
        coefficient: 0.35,
        contribution: 0.35,
        description: 'Elderly at higher risk for complications'
      });
    }
  }
  
  // Gender
  if (data.gender?.toLowerCase() === 'female') {
    logit += 0.35;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: 0.35,
      contribution: 0.35,
      description: 'Female patients have higher complication rates'
    });
  }
  
  // Ejection Fraction
  if (data.ejectionFraction) {
    if (data.ejectionFraction < 30) {
      logit += 0.9;
      steps.push({
        variable: 'Ejection Fraction',
        value: data.ejectionFraction + '%',
        coefficient: 0.9,
        contribution: 0.9,
        description: 'Severe LV dysfunction (EF < 30%)'
      });
    } else if (data.ejectionFraction < 40) {
      logit += 0.45;
      steps.push({
        variable: 'Ejection Fraction',
        value: data.ejectionFraction + '%',
        coefficient: 0.45,
        contribution: 0.45,
        description: 'Moderate LV dysfunction (EF 30-40%)'
      });
    }
  }
  
  // Diabetes
  if (data.diabetes && data.diabetes.toString().toLowerCase() !== 'no') {
    logit += 0.32;
    steps.push({
      variable: 'Diabetes',
      value: data.diabetes,
      coefficient: 0.32,
      contribution: 0.32,
      description: 'Diabetes increases wound and recovery complications'
    });
  }
  
  // Renal Function (Dialysis is a major factor for morbidity)
  if (data.dialysis) {
    logit += 1.35;
    steps.push({
      variable: 'Dialysis',
      value: 'Yes',
      coefficient: 1.35,
      contribution: 1.35,
      description: 'Dialysis-dependent - major complication risk factor'
    });
  } else if (data.creatinine && data.creatinine > 2.0) {
    logit += 0.68;
    steps.push({
      variable: 'Elevated Creatinine',
      value: data.creatinine + ' mg/dL',
      coefficient: 0.68,
      contribution: 0.68,
      description: 'Renal dysfunction (Creatinine > 2.0)'
    });
  }
  
  // NYHA Class
  if (data.nyhaClass) {
    const nyhaNum = typeof data.nyhaClass === 'string' ? 
      parseInt(data.nyhaClass.replace(/[^0-9]/g, '')) : data.nyhaClass;
    if (nyhaNum >= 4) {
      logit += 0.58;
      steps.push({
        variable: 'NYHA Class',
        value: 'Class ' + nyhaNum,
        coefficient: 0.58,
        contribution: 0.58,
        description: 'Severe heart failure symptoms'
      });
    } else if (nyhaNum >= 3) {
      logit += 0.35;
      steps.push({
        variable: 'NYHA Class',
        value: 'Class ' + nyhaNum,
        coefficient: 0.35,
        contribution: 0.35,
        description: 'Moderate heart failure symptoms'
      });
    }
  }
  
  // Emergency status
  const priorityLower = data.priority?.toLowerCase() || '';
  if (priorityLower.includes('emergency') || priorityLower.includes('emergent')) {
    logit += 1.15;
    steps.push({
      variable: 'Surgical Priority',
      value: data.priority || 'Emergency',
      coefficient: 1.15,
      contribution: 1.15,
      description: 'Emergency surgery - unstable patient with higher complications'
    });
  } else if (priorityLower === 'urgent') {
    logit += 0.48;
    steps.push({
      variable: 'Surgical Priority',
      value: 'Urgent',
      coefficient: 0.48,
      contribution: 0.48,
      description: 'Urgent surgery - limited optimization time'
    });
  }
  
  // Reoperation
  if (data.reoperation || data.priorCardiacSurgery || data.previousCABG || data.previousValve ||
      (data.surgeryIncidence && data.surgeryIncidence.toLowerCase().includes('reop'))) {
    logit += 0.7;
    steps.push({
      variable: 'Reoperation',
      value: 'Yes',
      coefficient: 0.7,
      contribution: 0.7,
      description: 'Prior cardiac surgery increases complication risk'
    });
  }
  
  // CHF
  if (data.chf || data.heartFailure) {
    logit += 0.48;
    steps.push({
      variable: 'Heart Failure',
      value: 'Yes',
      coefficient: 0.48,
      contribution: 0.48,
      description: 'Congestive heart failure present'
    });
  }
  
  // PVD
  if (data.pvd || data.peripheralVascularDisease) {
    logit += 0.38;
    steps.push({
      variable: 'Peripheral Vascular Disease',
      value: 'Yes',
      coefficient: 0.38,
      contribution: 0.38,
      description: 'Generalized atherosclerosis'
    });
  }
  
  // COPD
  const lungDiseaseLower = data.chronicLungDisease?.toLowerCase() || '';
  if (data.copd || (lungDiseaseLower && lungDiseaseLower !== 'no')) {
    if (data.copdSeverity === 'severe' || lungDiseaseLower === 'severe') {
      logit += 0.6;
      steps.push({
        variable: 'COPD',
        value: 'Severe',
        coefficient: 0.6,
        contribution: 0.6,
        description: 'Severe chronic lung disease'
      });
    } else {
      logit += 0.38;
      steps.push({
        variable: 'COPD',
        value: 'Present',
        coefficient: 0.38,
        contribution: 0.38,
        description: 'Chronic obstructive pulmonary disease'
      });
    }
  }
  
  // Recent MI
  const miTimingLower = data.miTiming?.toLowerCase() || '';
  if (data.recentMI || 
      miTimingLower.includes('≤ 6 hrs') || 
      miTimingLower.includes('≤6 hrs') ||
      miTimingLower.includes('<24') ||
      miTimingLower.includes('1 to 7 days') ||
      miTimingLower.includes('8 to 21 days')) {
    if (!miTimingLower.includes('> 21 days') && !miTimingLower.includes('>21 days')) {
      const miPenalty = (miTimingLower.includes('≤ 6 hrs') || miTimingLower.includes('≤6 hrs')) ? 0.8 : 0.55;
      logit += miPenalty;
      steps.push({
        variable: 'Recent MI',
        value: data.miTiming || 'Yes',
        coefficient: miPenalty,
        contribution: miPenalty,
        description: 'Myocardial infarction within 21 days'
      });
    }
  }
  
  // Cardiogenic Shock
  if (data.cardiogenicShock) {
    logit += 1.6;
    steps.push({
      variable: 'Cardiogenic Shock',
      value: 'Yes',
      coefficient: 1.6,
      contribution: 1.6,
      description: 'Severe hemodynamic compromise - major risk factor'
    });
  }
  
  // Mechanical support
  if (data.iabp || data.mechanicalSupport) {
    logit += 0.78;
    steps.push({
      variable: 'Mechanical Support',
      value: 'Yes (IABP/ECMO)',
      coefficient: 0.78,
      contribution: 0.78,
      description: 'Requires mechanical circulatory support'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const morbidityPercent = (probability * 100).toFixed(2);
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability using logistic function'
  });
  
  steps.push({
    variable: 'FINAL MORBIDITY & MORTALITY RISK',
    value: morbidityPercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: morbidityPercent + '%',
    description: 'Predicted risk of morbidity or mortality (PROMM) - composite outcome'
  });
  
  return {
    morbidity: morbidityPercent,
    steps: steps
  };
}

/**
 * Calculate CABG Morbidity Risk (simple version for backwards compatibility)
 */
function calculateCABGMorbidity(data) {
  const detailed = calculateCABGMorbidityDetailed(data);
  return detailed.morbidity;
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
    if (data.age > 60) {
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
    } else {
      steps.push({
        variable: 'Age',
        value: data.age + ' years',
        coefficient: 0.0,
        calculation: 'Age ≤ 60 (no penalty)',
        contribution: '0.000',
        description: 'Age ≤ 60: baseline risk (no age penalty)'
      });
    }
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
    if (data.age > 60) {
      logit += (data.age - 60) * 0.06;
    }
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
  
  if (data.age && data.age > 60) logit += (data.age - 60) * 0.055;
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
  
  if (data.age && data.age > 60) logit += (data.age - 60) * 0.045;
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

/**
 * Calculate CABG Stroke Risk with Detailed Steps
 * Based on STS stroke model coefficients
 */
function calculateCABGStrokeDetailed(data) {
  let logit = -5.5; // Baseline intercept for stroke
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -5.5,
    contribution: -5.5,
    description: 'Starting point for stroke risk model'
  });
  
  if (data.age && data.age > 70) {
    const ageFactor = (data.age - 70) * 0.04;
    logit += ageFactor;
    steps.push({
      variable: 'Age > 70',
      value: data.age + ' years',
      coefficient: 0.04,
      calculation: `(${data.age} - 70) × 0.04`,
      contribution: ageFactor.toFixed(3),
      description: 'Advanced age increases stroke risk'
    });
  }
  
  if (data.gender?.toLowerCase() === 'female') {
    logit += 0.15;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: 0.15,
      contribution: 0.15,
      description: 'Female gender modestly increases stroke risk'
    });
  }
  
  if (data.diabetes && data.diabetes.toString().toLowerCase() !== 'no') {
    logit += 0.2;
    steps.push({
      variable: 'Diabetes',
      value: data.diabetes,
      coefficient: 0.2,
      contribution: 0.2,
      description: 'Diabetes increases cerebrovascular risk'
    });
  }
  
  if (data.hypertension) {
    logit += 0.15;
    steps.push({
      variable: 'Hypertension',
      value: 'Yes',
      coefficient: 0.15,
      contribution: 0.15,
      description: 'Hypertension is a cerebrovascular risk factor'
    });
  }
  
  if (data.pvd || data.peripheralVascularDisease) {
    logit += 0.3;
    steps.push({
      variable: 'Peripheral Vascular Disease',
      value: 'Yes',
      coefficient: 0.3,
      contribution: 0.3,
      description: 'PVD indicates diffuse atherosclerosis'
    });
  }
  
  const cvdLower = data.cerebrovascularDisease?.toLowerCase() || '';
  if (data.priorStroke || (cvdLower && cvdLower !== 'no')) {
    logit += 0.6;
    steps.push({
      variable: 'Prior Stroke/CVD',
      value: data.cerebrovascularDisease || 'Yes',
      coefficient: 0.6,
      contribution: 0.6,
      description: 'History of cerebrovascular disease - major risk factor'
    });
  }
  
  if (data.priority?.toLowerCase().includes('emerg')) {
    logit += 0.4;
    steps.push({
      variable: 'Emergency Surgery',
      value: data.priority,
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Emergency procedures increase stroke risk'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const strokePercent = (probability * 100).toFixed(2);
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability'
  });
  
  steps.push({
    variable: 'FINAL STROKE RISK',
    value: strokePercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: strokePercent + '%',
    description: 'Predicted risk of postoperative stroke'
  });
  
  return {
    stroke: strokePercent,
    steps: steps
  };
}

/**
 * Calculate CABG Stroke Risk (simple version for backwards compatibility)
 */
function calculateCABGStroke(data) {
  const detailed = calculateCABGStrokeDetailed(data);
  return detailed.stroke;
}

/**
 * Calculate CABG Renal Failure Risk with Detailed Steps
 * Renal failure defined as new requirement for dialysis or creatinine >4.0
 */
function calculateCABGRenalFailureDetailed(data) {
  // If already on dialysis, renal failure risk is "NA" (already present)
  if (data.dialysis) {
    return {
      renalFailure: 'NA',
      steps: [{
        variable: 'Pre-existing Dialysis',
        value: 'Already on dialysis',
        coefficient: 'N/A',
        contribution: 'N/A',
        description: 'Patient already has end-stage renal disease - risk assessment not applicable'
      }]
    };
  }
  
  let logit = -6.5; // Baseline intercept for renal failure
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -6.5,
    contribution: -6.5,
    description: 'Starting point for renal failure risk model'
  });
  
  if (data.age && data.age > 65) {
    const ageFactor = (data.age - 65) * 0.035;
    logit += ageFactor;
    steps.push({
      variable: 'Age > 65',
      value: data.age + ' years',
      coefficient: 0.035,
      calculation: `(${data.age} - 65) × 0.035`,
      contribution: ageFactor.toFixed(3),
      description: 'Advanced age reduces renal reserve'
    });
  }
  
  if (data.creatinine) {
    if (data.creatinine > 2.0) {
      logit += 0.8;
      steps.push({
        variable: 'Elevated Creatinine',
        value: data.creatinine + ' mg/dL',
        coefficient: 0.8,
        contribution: 0.8,
        description: 'Significant renal dysfunction (Cr > 2.0)'
      });
    } else if (data.creatinine > 1.5) {
      logit += 0.4;
      steps.push({
        variable: 'Elevated Creatinine',
        value: data.creatinine + ' mg/dL',
        coefficient: 0.4,
        contribution: 0.4,
        description: 'Mild renal dysfunction (Cr 1.5-2.0)'
      });
    }
  }
  
  if (data.diabetes && data.diabetes.toString().toLowerCase() !== 'no') {
    logit += 0.3;
    steps.push({
      variable: 'Diabetes',
      value: data.diabetes,
      coefficient: 0.3,
      contribution: 0.3,
      description: 'Diabetes nephropathy risk'
    });
  }
  
  if (data.ejectionFraction && data.ejectionFraction < 30) {
    logit += 0.5;
    steps.push({
      variable: 'Low Ejection Fraction',
      value: data.ejectionFraction + '%',
      coefficient: 0.5,
      contribution: 0.5,
      description: 'Poor cardiac output affects renal perfusion'
    });
  }
  
  if (data.cardiogenicShock) {
    logit += 1.0;
    steps.push({
      variable: 'Cardiogenic Shock',
      value: 'Yes',
      coefficient: 1.0,
      contribution: 1.0,
      description: 'Severely compromised renal perfusion'
    });
  }
  
  if (data.priority?.toLowerCase().includes('emerg')) {
    logit += 0.6;
    steps.push({
      variable: 'Emergency Surgery',
      value: data.priority,
      coefficient: 0.6,
      contribution: 0.6,
      description: 'Limited time for renal optimization'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const renalFailurePercent = (probability * 100).toFixed(2);
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability'
  });
  
  steps.push({
    variable: 'FINAL RENAL FAILURE RISK',
    value: renalFailurePercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: renalFailurePercent + '%',
    description: 'Predicted risk of postoperative renal failure'
  });
  
  return {
    renalFailure: renalFailurePercent,
    steps: steps
  };
}

/**
 * Calculate CABG Renal Failure Risk (simple version for backwards compatibility)
 */
function calculateCABGRenalFailure(data) {
  const detailed = calculateCABGRenalFailureDetailed(data);
  return detailed.renalFailure;
}

/**
 * Calculate CABG Reoperation Risk with Detailed Steps
 * Defined as return to OR for any reason
 */
function calculateCABGReoperationDetailed(data) {
  let logit = -4.0; // Baseline intercept for reoperation
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -4.0,
    contribution: -4.0,
    description: 'Starting point for reoperation risk model'
  });
  
  if (data.age && data.age > 75) {
    logit += 0.25;
    steps.push({
      variable: 'Age > 75',
      value: data.age + ' years',
      coefficient: 0.25,
      contribution: 0.25,
      description: 'Elderly patients have increased bleeding and healing complications'
    });
  }
  
  if (data.gender?.toLowerCase() === 'female') {
    logit += 0.2;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: 0.2,
      contribution: 0.2,
      description: 'Female gender associated with higher reoperation risk'
    });
  }
  
  if (data.ejectionFraction && data.ejectionFraction < 30) {
    logit += 0.4;
    steps.push({
      variable: 'Low Ejection Fraction',
      value: data.ejectionFraction + '%',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Poor ventricular function increases complications'
    });
  }
  
  if (data.dialysis) {
    logit += 0.5;
    steps.push({
      variable: 'Dialysis',
      value: 'Yes',
      coefficient: 0.5,
      contribution: 0.5,
      description: 'Coagulopathy and uremia increase bleeding risk'
    });
  }
  
  if (data.priority?.toLowerCase().includes('emerg')) {
    logit += 0.7;
    steps.push({
      variable: 'Emergency Surgery',
      value: data.priority,
      coefficient: 0.7,
      contribution: 0.7,
      description: 'Emergency procedures have higher complication rates'
    });
  }
  
  if (data.reoperation || data.priorCardiacSurgery || data.previousCABG || data.previousValve ||
      (data.surgeryIncidence && data.surgeryIncidence.toLowerCase().includes('reop'))) {
    logit += 0.6;
    steps.push({
      variable: 'Prior Cardiac Surgery',
      value: 'Yes',
      coefficient: 0.6,
      contribution: 0.6,
      description: 'Reoperations have increased bleeding and adhesion complications'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const reoperationPercent = (probability * 100).toFixed(2);
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability'
  });
  
  steps.push({
    variable: 'FINAL REOPERATION RISK',
    value: reoperationPercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: reoperationPercent + '%',
    description: 'Predicted risk of return to operating room'
  });
  
  return {
    reoperation: reoperationPercent,
    steps: steps
  };
}

/**
 * Calculate CABG Reoperation Risk (simple version for backwards compatibility)
 */
function calculateCABGReoperation(data) {
  const detailed = calculateCABGReoperationDetailed(data);
  return detailed.reoperation;
}

/**
 * Calculate CABG Prolonged Ventilation Risk with Detailed Steps
 * Defined as mechanical ventilation >24 hours
 */
function calculateCABGProlongedVentilationDetailed(data) {
  let logit = -4.2; // Baseline intercept
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -4.2,
    contribution: -4.2,
    description: 'Starting point for prolonged ventilation risk model'
  });
  
  if (data.age && data.age > 70) {
    const ageFactor = (data.age - 70) * 0.03;
    logit += ageFactor;
    steps.push({
      variable: 'Age > 70',
      value: data.age + ' years',
      coefficient: 0.03,
      calculation: `(${data.age} - 70) × 0.03`,
      contribution: ageFactor.toFixed(3),
      description: 'Elderly patients have reduced respiratory reserve'
    });
  }
  
  if (data.gender?.toLowerCase() === 'female') {
    logit += 0.25;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: 0.25,
      contribution: 0.25,
      description: 'Female gender moderately increases ventilation time'
    });
  }
  
  if (data.bmi && data.bmi > 35) {
    logit += 0.4;
    steps.push({
      variable: 'Obesity (BMI > 35)',
      value: data.bmi + ' kg/m²',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Obesity impairs respiratory mechanics'
    });
  }
  
  const lungDiseaseLower = data.chronicLungDisease?.toLowerCase() || '';
  if (data.copd || (lungDiseaseLower && lungDiseaseLower !== 'no')) {
    logit += 0.6;
    steps.push({
      variable: 'Chronic Lung Disease',
      value: data.chronicLungDisease || 'Yes',
      coefficient: 0.6,
      contribution: 0.6,
      description: 'Pre-existing lung disease delays weaning'
    });
  }
  
  if (data.ejectionFraction && data.ejectionFraction < 30) {
    logit += 0.5;
    steps.push({
      variable: 'Low Ejection Fraction',
      value: data.ejectionFraction + '%',
      coefficient: 0.5,
      contribution: 0.5,
      description: 'Heart failure contributes to pulmonary edema'
    });
  }
  
  if (data.dialysis) {
    logit += 0.7;
    steps.push({
      variable: 'Dialysis',
      value: 'Yes',
      coefficient: 0.7,
      contribution: 0.7,
      description: 'Fluid overload and metabolic issues delay extubation'
    });
  }
  
  if (data.priority?.toLowerCase().includes('emerg')) {
    logit += 0.8;
    steps.push({
      variable: 'Emergency Surgery',
      value: data.priority,
      coefficient: 0.8,
      contribution: 0.8,
      description: 'Emergency cases have more complications'
    });
  }
  
  if (data.cardiogenicShock) {
    logit += 1.0;
    steps.push({
      variable: 'Cardiogenic Shock',
      value: 'Yes',
      coefficient: 1.0,
      contribution: 1.0,
      description: 'Severe hemodynamic instability prolongs ventilation'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const prolongedVentPercent = (probability * 100).toFixed(2);
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability'
  });
  
  steps.push({
    variable: 'FINAL PROLONGED VENTILATION RISK',
    value: prolongedVentPercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: prolongedVentPercent + '%',
    description: 'Predicted risk of ventilation >24 hours'
  });
  
  return {
    prolongedVentilation: prolongedVentPercent,
    steps: steps
  };
}

/**
 * Calculate CABG Prolonged Ventilation Risk (simple version for backwards compatibility)
 */
function calculateCABGProlongedVentilation(data) {
  const detailed = calculateCABGProlongedVentilationDetailed(data);
  return detailed.prolongedVentilation;
}

/**
 * Calculate CABG Deep Sternal Wound Infection Risk with Detailed Steps
 */
function calculateCABGDeepSternalWoundInfectionDetailed(data) {
  let logit = -6.0; // Baseline intercept (low baseline ~0.5%)
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -6.0,
    contribution: -6.0,
    description: 'Starting point for wound infection risk model (low baseline)'
  });
  
  if (data.gender?.toLowerCase() === 'female') {
    logit += 0.3;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: 0.3,
      contribution: 0.3,
      description: 'Female patients have increased infection risk'
    });
  }
  
  if (data.bmi && data.bmi > 30) {
    logit += 0.5;
    steps.push({
      variable: 'Obesity (BMI > 30)',
      value: data.bmi + ' kg/m²',
      coefficient: 0.5,
      contribution: 0.5,
      description: 'Obesity impairs wound healing and tissue perfusion'
    });
  }
  
  if (data.diabetes && data.diabetes.toString().toLowerCase() !== 'no') {
    logit += 0.4;
    steps.push({
      variable: 'Diabetes',
      value: data.diabetes,
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Diabetes increases infection risk and delays healing'
    });
  }
  
  const lungDiseaseLower = data.chronicLungDisease?.toLowerCase() || '';
  if (data.copd || (lungDiseaseLower && lungDiseaseLower !== 'no')) {
    logit += 0.3;
    steps.push({
      variable: 'COPD',
      value: data.chronicLungDisease || 'Yes',
      coefficient: 0.3,
      contribution: 0.3,
      description: 'Chronic lung disease increases infection risk'
    });
  }
  
  if (data.reoperation || data.priorCardiacSurgery || data.previousCABG || data.previousValve ||
      (data.surgeryIncidence && data.surgeryIncidence.toLowerCase().includes('reop'))) {
    logit += 0.4;
    steps.push({
      variable: 'Reoperation',
      value: 'Yes',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Prior surgery increases infection and healing complications'
    });
  }
  
  if (data.priority?.toLowerCase().includes('emerg')) {
    logit += 0.3;
    steps.push({
      variable: 'Emergency Surgery',
      value: data.priority,
      coefficient: 0.3,
      contribution: 0.3,
      description: 'Emergency cases have less sterile preparation time'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const infectionPercent = (probability * 100).toFixed(3); // Use 3 decimals for precision
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability'
  });
  
  steps.push({
    variable: 'FINAL DEEP STERNAL WOUND INFECTION RISK',
    value: infectionPercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: infectionPercent + '%',
    description: 'Predicted risk of deep sternal wound infection'
  });
  
  return {
    deepSternalWoundInfection: infectionPercent,
    steps: steps
  };
}

/**
 * Calculate CABG Deep Sternal Wound Infection Risk (simple version for backwards compatibility)
 */
function calculateCABGDeepSternalWoundInfection(data) {
  const detailed = calculateCABGDeepSternalWoundInfectionDetailed(data);
  return detailed.deepSternalWoundInfection;
}

/**
 * Calculate CABG Long Hospital Stay Risk with Detailed Steps
 * Defined as >14 days
 */
function calculateCABGLongHospitalStayDetailed(data) {
  let logit = -3.8; // Baseline intercept
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -3.8,
    contribution: -3.8,
    description: 'Starting point for long hospital stay risk model'
  });
  
  if (data.age && data.age > 75) {
    logit += 0.4;
    steps.push({
      variable: 'Age > 75',
      value: data.age + ' years',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Elderly patients have slower recovery'
    });
  }
  
  if (data.gender?.toLowerCase() === 'female') {
    logit += 0.2;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: 0.2,
      contribution: 0.2,
      description: 'Female gender modestly prolongs hospital stay'
    });
  }
  
  if (data.ejectionFraction && data.ejectionFraction < 30) {
    logit += 0.6;
    steps.push({
      variable: 'Low Ejection Fraction',
      value: data.ejectionFraction + '%',
      coefficient: 0.6,
      contribution: 0.6,
      description: 'Poor cardiac function delays recovery'
    });
  }
  
  if (data.dialysis) {
    logit += 0.8;
    steps.push({
      variable: 'Dialysis',
      value: 'Yes',
      coefficient: 0.8,
      contribution: 0.8,
      description: 'Dialysis-dependent patients require extended care'
    });
  }
  
  const lungDiseaseLower = data.chronicLungDisease?.toLowerCase() || '';
  if (data.copd || (lungDiseaseLower && lungDiseaseLower !== 'no')) {
    logit += 0.4;
    steps.push({
      variable: 'COPD',
      value: data.chronicLungDisease || 'Yes',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Chronic lung disease complicates recovery'
    });
  }
  
  if (data.priority?.toLowerCase().includes('emerg')) {
    logit += 0.7;
    steps.push({
      variable: 'Emergency Surgery',
      value: data.priority,
      coefficient: 0.7,
      contribution: 0.7,
      description: 'Emergency cases have more complications'
    });
  }
  
  if (data.cardiogenicShock) {
    logit += 1.0;
    steps.push({
      variable: 'Cardiogenic Shock',
      value: 'Yes',
      coefficient: 1.0,
      contribution: 1.0,
      description: 'Severe pre-operative instability prolongs recovery'
    });
  }
  
  if (data.reoperation || data.priorCardiacSurgery || data.previousCABG || data.previousValve ||
      (data.surgeryIncidence && data.surgeryIncidence.toLowerCase().includes('reop'))) {
    logit += 0.5;
    steps.push({
      variable: 'Reoperation',
      value: 'Yes',
      coefficient: 0.5,
      contribution: 0.5,
      description: 'Reoperations have more complications and slower healing'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all risk factors'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const longStayPercent = (probability * 100).toFixed(2);
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability'
  });
  
  steps.push({
    variable: 'FINAL LONG HOSPITAL STAY RISK',
    value: longStayPercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: longStayPercent + '%',
    description: 'Predicted risk of hospital stay >14 days'
  });
  
  return {
    longHospitalStay: longStayPercent,
    steps: steps
  };
}

/**
 * Calculate CABG Long Hospital Stay Risk (simple version for backwards compatibility)
 */
function calculateCABGLongHospitalStay(data) {
  const detailed = calculateCABGLongHospitalStayDetailed(data);
  return detailed.longHospitalStay;
}

/**
 * Calculate CABG Short Hospital Stay Probability with Detailed Steps
 * Defined as <6 days (this is a POSITIVE outcome - higher is better)
 */
function calculateCABGShortHospitalStayDetailed(data) {
  let logit = -0.5; // Baseline intercept (baseline ~38% chance)
  const steps = [];
  
  steps.push({
    variable: 'Baseline Intercept',
    value: 'N/A',
    coefficient: -0.5,
    contribution: -0.5,
    description: 'Starting point for short hospital stay model (favorable baseline)'
  });
  
  // Younger age INCREASES probability of short stay
  if (data.age && data.age < 60) {
    logit += 0.4;
    steps.push({
      variable: 'Age < 60',
      value: data.age + ' years',
      coefficient: 0.4,
      contribution: 0.4,
      description: 'Younger patients have faster recovery (POSITIVE factor)'
    });
  } else if (data.age && data.age > 75) {
    logit -= 0.5;
    steps.push({
      variable: 'Age > 75',
      value: data.age + ' years',
      coefficient: -0.5,
      contribution: -0.5,
      description: 'Elderly patients have slower recovery (NEGATIVE factor)'
    });
  }
  
  // These factors DECREASE probability of short stay
  if (data.gender?.toLowerCase() === 'female') {
    logit -= 0.2;
    steps.push({
      variable: 'Female Gender',
      value: 'Female',
      coefficient: -0.2,
      contribution: -0.2,
      description: 'Female gender decreases chance of short stay (NEGATIVE factor)'
    });
  }
  
  if (data.ejectionFraction && data.ejectionFraction < 40) {
    logit -= 0.4;
    steps.push({
      variable: 'Low Ejection Fraction',
      value: data.ejectionFraction + '%',
      coefficient: -0.4,
      contribution: -0.4,
      description: 'Poor cardiac function prolongs recovery (NEGATIVE factor)'
    });
  }
  
  if (data.dialysis) {
    logit -= 0.8;
    steps.push({
      variable: 'Dialysis',
      value: 'Yes',
      coefficient: -0.8,
      contribution: -0.8,
      description: 'Dialysis dependency prolongs stay (NEGATIVE factor)'
    });
  }
  
  const lungDiseaseLower = data.chronicLungDisease?.toLowerCase() || '';
  if (data.copd || (lungDiseaseLower && lungDiseaseLower !== 'no')) {
    logit -= 0.3;
    steps.push({
      variable: 'COPD',
      value: data.chronicLungDisease || 'Yes',
      coefficient: -0.3,
      contribution: -0.3,
      description: 'Lung disease delays recovery (NEGATIVE factor)'
    });
  }
  
  if (data.diabetes && data.diabetes.toString().toLowerCase() !== 'no') {
    logit -= 0.2;
    steps.push({
      variable: 'Diabetes',
      value: data.diabetes,
      coefficient: -0.2,
      contribution: -0.2,
      description: 'Diabetes complicates recovery (NEGATIVE factor)'
    });
  }
  
  if (data.priority?.toLowerCase().includes('emerg')) {
    logit -= 0.6;
    steps.push({
      variable: 'Emergency Surgery',
      value: data.priority,
      coefficient: -0.6,
      contribution: -0.6,
      description: 'Emergency cases have more complications (NEGATIVE factor)'
    });
  }
  
  if (data.cardiogenicShock) {
    logit -= 1.2;
    steps.push({
      variable: 'Cardiogenic Shock',
      value: 'Yes',
      coefficient: -1.2,
      contribution: -1.2,
      description: 'Severe pre-op instability prolongs stay (NEGATIVE factor)'
    });
  }
  
  if (data.reoperation || data.priorCardiacSurgery || data.previousCABG || data.previousValve ||
      (data.surgeryIncidence && data.surgeryIncidence.toLowerCase().includes('reop'))) {
    logit -= 0.4;
    steps.push({
      variable: 'Reoperation',
      value: 'Yes',
      coefficient: -0.4,
      contribution: -0.4,
      description: 'Reoperations have longer recovery (NEGATIVE factor)'
    });
  }
  
  steps.push({
    variable: 'TOTAL LOGIT',
    value: 'Sum of all contributions',
    coefficient: '-',
    contribution: logit.toFixed(3),
    description: 'Sum of intercept and all factors (positive factors increase probability)'
  });
  
  const probability = 1 / (1 + Math.exp(-logit));
  const shortStayPercent = (probability * 100).toFixed(1); // One decimal
  
  steps.push({
    variable: 'LOGISTIC TRANSFORMATION',
    value: `1 / (1 + e^(${logit.toFixed(3)}))`,
    coefficient: '-',
    calculation: `1 / (1 + ${Math.exp(-logit).toFixed(6)})`,
    contribution: probability.toFixed(6),
    description: 'Convert logit to probability'
  });
  
  steps.push({
    variable: 'FINAL SHORT HOSPITAL STAY PROBABILITY',
    value: shortStayPercent + '%',
    coefficient: '-',
    calculation: `${probability.toFixed(6)} × 100`,
    contribution: shortStayPercent + '%',
    description: 'Predicted probability of hospital stay <6 days (POSITIVE outcome)'
  });
  
  return {
    shortHospitalStay: shortStayPercent,
    steps: steps
  };
}

/**
 * Calculate CABG Short Hospital Stay Probability (simple version for backwards compatibility)
 */
function calculateCABGShortHospitalStay(data) {
  const detailed = calculateCABGShortHospitalStayDetailed(data);
  return detailed.shortHospitalStay;
}

module.exports = {
  calculateSTSRisk
};

