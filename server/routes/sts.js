const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const { calculateSTSRisk } = require('../utils/stsCalculator');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate FULL official STS calculator form HTML with exact 3-column structure
 */
function generateSTSFormHTML(data) {
  // Helper functions
  const getSelected = (field, value) => data[field] === value ? 'selected' : '';
  const getChecked = (field) => data[field] ? 'checked' : '';
  const getValue = (field) => data[field] || '';
  const highlight = (field) => data[field] ? 'background-color: #fffacd;' : '';
  
  // Helper functions for cleaner code
  const row = (label, input) => `<tr><td class="sts-label">${label}</td><td class="sts-value">${input}</td></tr>`;
  
  const select = (field, options) => {
    const opts = options.map(opt => {
      const val = typeof opt === 'string' ? opt : opt.value;
      const text = typeof opt === 'string' ? opt : opt.text;
      return `<option value="${val}" ${getSelected(field, val)}>${text}</option>`;
    }).join('');
    return `<select class="sts-select" style="${highlight(field)}" disabled><option value="">Select</option>${opts}</select>`;
  };
  
  const inputField = (field, type = 'text') => {
    return `<input type="${type}" class="sts-input" style="${highlight(field)}" value="${getValue(field)}" disabled />`;
  };
  
  const checkboxField = (field, label) => {
    return `<tr><td colspan="2"><label class="sts-checkbox-label"><input type="checkbox" ${getChecked(field)} disabled /> ${label}</label></td></tr>`;
  };
  
  const sectionHeader = (title) => {
    return `<tr><td colspan="2" class="sts-section">${title}</td></tr>`;
  };
  
  return `
<style>
  .sts-wrapper { width: 100%; font-family: Arial, sans-serif; font-size: 9px; }
  .sts-main-table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0; padding: 0; border-spacing: 0; }
  .sts-main-table tr { margin: 0; padding: 0; }
  .sts-main-table td { margin: 0; padding: 0 10px; vertical-align: top; width: 33.33%; }
  .sts-col-table { width: 100%; border-collapse: collapse; margin: 0; padding: 0; border-spacing: 0; }
  .sts-col-table tr { margin: 0; padding: 0; }
  .sts-col-table td { margin: 0; padding: 3px 5px; vertical-align: middle; }
  .sts-label { font-weight: 500; font-size: 9px; width: 38%; padding-right: 6px; }
  .sts-value { width: 62%; }
  .sts-section { background: #e0e0e0; padding: 6px 8px; font-weight: 600; font-size: 10px; border: 1px solid #999; margin: 0; }
  .sts-input, .sts-select { padding: 3px 5px; border: 1px solid #666; border-radius: 2px; font-size: 9px; width: 100%; margin: 0; font-family: Arial, sans-serif; }
  .sts-checkbox-label { font-size: 9px; margin: 0; padding: 0; display: block; }
  .sts-checkbox-label input { margin-right: 5px; }
</style>

<div class="sts-wrapper">
<table class="sts-main-table"><tr>
<td><table class="sts-col-table">
${sectionHeader('PLANNED SURGERY')}
${row('Procedure Type:', select('procedureType', ['Isolated CABG', 'Isolated AVR', 'Isolated MVR', 'AVR + CABG', 'MVR + CABG', 'MV Repair', 'MV Repair for Primary MR', 'MV Repair + CABG']))}
${row('Surgery Incidence:', select('surgeryIncidence', ['First CV surgery', 'ReOp#1', 'ReOp#2', 'ReOp#3', 'ReOp≥4']))}
${row('Surgical Priority:', select('priority', ['Elective', 'Urgent', 'Emergent', 'Emergent Salvage']))}
${sectionHeader('DEMOGRAPHICS')}
${row('Sex:', select('gender', ['Male', 'Female']))}
${row('Age (years):', inputField('age', 'number'))}
${row('Height (cm):', inputField('height', 'number'))}
${row('Weight (kg):', inputField('weight', 'number'))}
${row('BMI (kg/m²):', inputField('bmi', 'number'))}
${row('Race:', inputField('race'))}
${row('Payor / Insurance:', inputField('payor'))}
${sectionHeader('LABORATORY VALUES')}
${row('Creatinine (mg/dL):', inputField('creatinine', 'number'))}
${row('Hematocrit (%):', inputField('hematocrit', 'number'))}
${row('WBC Count (10³/μL):', inputField('wbc', 'number'))}
${row('Platelet Count (cells/μL):', inputField('platelets', 'number'))}
${sectionHeader('PREOPERATIVE MEDICATIONS')}
${checkboxField('medACEInhibitors', 'ACE Inhibitors/ARBs ≤ 48 hrs')}
${checkboxField('medGPInhibitor', 'GP IIb/IIIa Inhibitor ≤ 24 hrs')}
${checkboxField('medInotropes', 'Inotropes ≤ 48 hrs')}
${checkboxField('medSteroids', 'Steroids ≤ 24 hrs')}
${checkboxField('medADPInhibitors', 'ADP Inhibitors ≤ 5 days')}
</table></td>
<td><table class="sts-col-table">
${sectionHeader('RISK FACTORS / COMORBIDITIES')}
${row('Diabetes:', select('diabetes', ['No', 'Yes, Diet Only', 'Yes, Oral', 'Yes, Insulin', 'Yes, Other SubQ', 'Yes, Other Control', 'Yes, Unknown Control']))}
${checkboxField('familyHxCAD', 'Family Hx of CAD')}
${checkboxField('hypertension', 'Hypertension')}
${checkboxField('liverDisease', 'Liver Disease')}
${checkboxField('mediastinalRadiation', 'Mediastinal Radiation')}
${checkboxField('unresponsiveState', 'Unresponsive State')}
${checkboxField('dialysis', 'Dialysis')}
${checkboxField('cancer', 'Cancer ≤ 5 yrs')}
${checkboxField('syncope', 'Syncope')}
${checkboxField('immunocompromised', 'Immunocompromised')}
${row('Endocarditis:', select('endocarditis', ['No', 'Yes, treated', 'Yes, active', 'Yes, unknown']))}
${row('Illicit Drug Use:', select('illicitDrugUse', ['No', 'Yes', 'Unknown']))}
${row('Alcohol Use:', select('alcoholUse', ['None', '≤ 1 drink/week', '2-7 drinks/week', '≥ 8 drinks/week']))}
${row('Tobacco Use:', select('tobaccoUse', ['Never smoker', 'Current smoker', 'Former smoker']))}
${sectionHeader('PULMONARY')}
${row('Chronic Lung Disease:', select('chronicLungDisease', ['No', 'Mild', 'Moderate', 'Severe', 'Severity Unknown']))}
${checkboxField('recentPneumonia', 'Recent Pneumonia')}
${checkboxField('sleepApnea', 'Sleep Apnea')}
${checkboxField('homeOxygen', 'Home O₂')}
${sectionHeader('VASCULAR')}
${row('Cerebrovascular Disease:', select('cerebrovascularDisease', ['No', 'CVA ≤ 30 days', 'CVA > 30 days', 'TIA', 'Other CVD']))}
${checkboxField('pvd', 'Peripheral Artery Disease')}
${checkboxField('priorCarotidSurgery', 'Prior Carotid Surgery')}
${checkboxField('rightCarotidStenosis', 'Right Carotid Sten. ≥ 80%')}
${checkboxField('leftCarotidStenosis', 'Left Carotid Sten. ≥ 80%')}
${sectionHeader('CARDIAC STATUS')}
${row('Heart Failure:', select('heartFailure', ['None', 'Yes - Acute', 'Yes - Chronic', 'Yes - Both']))}
${row('NYHA Classification:', select('nyhaClass', ['Class I', 'Class II', 'Class III', 'Class IV']))}
${row('PreOp Mech Circ Support:', inputField('mechanicalSupport'))}
${row('Ejection Fraction (%):', inputField('ejectionFraction', 'number'))}
${checkboxField('cardiogenicShock', 'Cardiogenic Shock')}
${checkboxField('resuscitation', 'Resuscitation ≤ 1hr')}
</table></td>
<td><table class="sts-col-table">
${sectionHeader('CORONARY ARTERY DISEASE')}
${row('Primary Coronary Symptom:', select('primaryCoronarySymptom', ['No coronary symptoms', 'Stable Angina', 'Unstable Angina', 'Non-ST Elevation MI', 'STEMI']))}
${row('Myocardial Infarction - When:', select('miTiming', ['No MI', '≤ 6 Hrs', '>6 Hrs but <24 Hrs', '1 to 7 Days', '8 to 21 Days', '> 21 Days']))}
${row('No. of Diseased Vessels:', select('numberOfDiseasedVessels', ['None', 'One', 'Two', 'Three']))}
${checkboxField('leftMainStenosis', 'Left Main Sten. ≥ 50%')}
${checkboxField('proximalLADStenosis', 'Proximal LAD Sten. ≥ 70%')}
${sectionHeader('VALVE DISEASE')}
${checkboxField('aorticStenosis', 'Aortic Stenosis')}
${checkboxField('mitralStenosis', 'Mitral Stenosis')}
${checkboxField('aorticRootAbscess', 'Aortic Root Abscess')}
${row('Aortic Regurgitation:', select('aorticRegurgitation', ['None', 'Trivial/Trace', 'Mild', 'Moderate', 'Severe']))}
${row('Mitral Regurgitation:', select('mitralRegurgitation', ['None', 'Trivial/Trace', 'Mild', 'Moderate', 'Severe']))}
${row('Tricuspid Regurgitation:', select('tricuspidRegurgitation', ['None', 'Trivial/Trace', 'Mild', 'Moderate', 'Severe']))}
${sectionHeader('ARRHYTHMIA')}
${row('Atrial Fibrillation:', select('atrialFibrillation', ['None', 'Remote', 'Recent']))}
${row('Atrial Flutter:', select('atrialFlutter', ['None', 'Remote', 'Recent']))}
${row('V. Tach / V. Fib:', select('ventricularArrhythmia', ['None', 'Remote', 'Recent']))}
${sectionHeader('PREVIOUS CARDIAC INTERVENTIONS')}
${checkboxField('previousCABG', 'Previous CABG')}
${checkboxField('previousValve', 'Previous Valve Surgery')}
${checkboxField('previousPCI', 'Previous PCI')}
</table></td>
</tr></table>

<div style="margin-top: 10px; padding: 6px; background: #e6f2ff; border-left: 3px solid #003366; font-size: 9px;">
<strong>📊 Data Extraction Summary:</strong> ${Object.values(data).filter(v => v !== null && v !== undefined && v !== '').length} fields extracted. Yellow highlights = extracted values.
</div>

</div>`;
}

router.post('/', async (req, res) => {
  const { mode, data, patientNotes, manualOverrides } = req.body;

  // Handle re-analysis with manual overrides
  if (manualOverrides && patientNotes) {
    console.log('🔄 Re-analysis with manual overrides detected...');
    try {
      const structuredData = manualOverrides;
      
      console.log('🔢 Stage 2B: Mathematical calculation with overrides...');
      const mathResult = calculateSTSRisk(structuredData);

      // Format results as clean table similar to official STS calculator
      let mathTable = `
### 🔬 CALCULATED PERIOPERATIVE RISK ESTIMATES

**Model Type:** ${structuredData.procedureType || 'STS CABG'} Risk Model  
**Method:** Published STS Logistic Regression Coefficients (2018)  

| PERIOPERATIVE OUTCOME | ESTIMATE % |
|---|---|
| **Operative Mortality** | **${mathResult.mortality}%** |
| **Morbidity & Mortality** | **${mathResult.morbidity || 'Not calculated'}%** |`;

      // Add additional outcomes if available (CABG only)
      if (mathResult.stroke) {
        mathTable += `
| **Stroke** | **${mathResult.stroke}%** |`;
      }
      
      if (mathResult.renalFailure) {
        mathTable += `
| **Renal Failure** | **${mathResult.renalFailure}** |`;
      }
      
      if (mathResult.reoperation) {
        mathTable += `
| **Reoperation** | **${mathResult.reoperation}%** |`;
      }
      
      if (mathResult.prolongedVentilation) {
        mathTable += `
| **Prolonged Ventilation** | **${mathResult.prolongedVentilation}%** |`;
      }
      
      if (mathResult.deepSternalWoundInfection) {
        mathTable += `
| **Deep Sternal Wound Infection** | **${mathResult.deepSternalWoundInfection}%** |`;
      }
      
      if (mathResult.longHospitalStay) {
        mathTable += `
| **Long Hospital Stay (> 14 days)** | **${mathResult.longHospitalStay}%** |`;
      }
      
      if (mathResult.shortHospitalStay) {
        mathTable += `
| **Short Hospital Stay (<6 days)*** | **${mathResult.shortHospitalStay}%** |`;
      }
      
      mathTable += `\n\n**Risk Category:** ${mathResult.riskCategory}  \n**Calculation Confidence:** ${mathResult.confidence}\n\n`;
      
      // Helper function to format detailed calculation steps for any outcome
      function formatDetailedCalculation(steps, outcomeName, outcomeIcon) {
        if (!steps || steps.length === 0) return '';
        
        let output = `---\n\n### ${outcomeIcon} DETAILED CALCULATION: ${outcomeName}\n\n`;
        output += `This section shows the step-by-step mathematical calculation for **${outcomeName}** using logistic regression.\n\n`;
        output += `**Formula:** P(outcome) = 1 / (1 + e^(-logit))  \n**Where:** logit = intercept + Σ(coefficient × risk_factor)\n\n`;
        output += `---\n\n`;
        output += `#### Risk Factor Contributions\n\n`;
        output += `| Step | Risk Factor | Patient Value | Coefficient | Calculation | Logit Contribution |\n|---|---|---|---|---|---|\n`;
        
        let stepNum = 1;
        let logitSum = 0;
        let finalProbability = null;
        
        steps.forEach(s => {
          // Skip the final transformation steps for now
          if (s.variable.includes('TOTAL LOGIT')) {
            logitSum = parseFloat(s.contribution);
            return;
          }
          if (s.variable.includes('LOGISTIC TRANSFORMATION') || s.variable.includes('FINAL')) {
            if (s.variable.includes('LOGISTIC TRANSFORMATION')) {
              finalProbability = parseFloat(s.contribution);
            }
            return;
          }
          
          // Format calculation field
          let calcDisplay = s.calculation || '-';
          if (!s.calculation && s.coefficient !== '-' && s.variable !== 'Baseline Intercept') {
            calcDisplay = `${s.coefficient} × 1 = ${s.contribution}`;
          } else if (s.variable === 'Baseline Intercept') {
            calcDisplay = `Intercept = ${s.contribution}`;
          }
          
          output += `| ${stepNum} | **${s.variable}** | ${s.value || 'N/A'} | ${s.coefficient} | ${calcDisplay} | **${s.contribution}** |\n`;
          stepNum++;
        });
        
        // Add summary steps
        const totalLogitStep = steps.find(s => s.variable.includes('TOTAL LOGIT'));
        if (totalLogitStep) {
          output += `\n#### Total Logit (Sum of All Contributions)\n\n`;
          output += `**Total Logit = ${totalLogitStep.contribution}**\n\n`;
        }
        
        const logisticStep = steps.find(s => s.variable.includes('LOGISTIC TRANSFORMATION'));
        if (logisticStep) {
          output += `#### Logistic Transformation\n\n`;
          output += `**P = 1 / (1 + e^(-${logitSum.toFixed(3)})) = ${finalProbability ? finalProbability.toFixed(6) : logisticStep.contribution}**\n\n`;
        }
        
        const finalStep = steps.find(s => s.variable.includes('FINAL'));
        if (finalStep) {
          output += `#### Final Risk Estimate\n\n`;
          output += `**${outcomeName} Risk = ${finalStep.contribution}**\n\n`;
        }
        
        return output;
      }
      
      // Add detailed step-by-step calculations for ALL outcomes
      if (mathResult.detailedSteps && mathResult.detailedSteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.detailedSteps, 'Operative Mortality', '💀');
      }
      
      if (mathResult.morbiditySteps && mathResult.morbiditySteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.morbiditySteps, 'Morbidity & Mortality (PROMM)', '⚕️');
      }
      
      if (mathResult.strokeSteps && mathResult.strokeSteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.strokeSteps, 'Stroke', '🧠');
      }
      
      if (mathResult.renalFailureSteps && mathResult.renalFailureSteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.renalFailureSteps, 'Renal Failure', '🫘');
      }
      
      if (mathResult.reoperationSteps && mathResult.reoperationSteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.reoperationSteps, 'Reoperation', '🔄');
      }
      
      if (mathResult.prolongedVentilationSteps && mathResult.prolongedVentilationSteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.prolongedVentilationSteps, 'Prolonged Ventilation (>24 hrs)', '🫁');
      }
      
      if (mathResult.deepSternalWoundInfectionSteps && mathResult.deepSternalWoundInfectionSteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.deepSternalWoundInfectionSteps, 'Deep Sternal Wound Infection', '🦠');
      }
      
      if (mathResult.longHospitalStaySteps && mathResult.longHospitalStaySteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.longHospitalStaySteps, 'Long Hospital Stay (>14 days)', '🏥');
      }
      
      if (mathResult.shortHospitalStaySteps && mathResult.shortHospitalStaySteps.length > 0) {
        mathTable += formatDetailedCalculation(mathResult.shortHospitalStaySteps, 'Short Hospital Stay (<6 days)', '✨');
      }
      
      const stsForm = generateSTSFormHTML(structuredData);
      
      // Prepare manual calculation summary for AI
      const manualCalculationSummary = `
**Manual Mathematical Model Results (ALL STS OUTCOMES):**

| Outcome | Calculated Risk |
|---|---|
| Operative Mortality (PROM) | ${mathResult.mortality}% |
| Morbidity & Mortality (PROMM) | ${mathResult.morbidity}% |
${mathResult.stroke ? `| Stroke | ${mathResult.stroke}% |` : ''}
${mathResult.renalFailure ? `| Renal Failure | ${mathResult.renalFailure} |` : ''}
${mathResult.reoperation ? `| Reoperation | ${mathResult.reoperation}% |` : ''}
${mathResult.prolongedVentilation ? `| Prolonged Ventilation | ${mathResult.prolongedVentilation}% |` : ''}
${mathResult.deepSternalWoundInfection ? `| Deep Sternal Wound Infection | ${mathResult.deepSternalWoundInfection}% |` : ''}
${mathResult.longHospitalStay ? `| Long Hospital Stay (>14d) | ${mathResult.longHospitalStay}% |` : ''}
${mathResult.shortHospitalStay ? `| Short Hospital Stay (<6d) | ${mathResult.shortHospitalStay}% |` : ''}

**Risk Category:** ${mathResult.riskCategory}
**Model Type:** ${structuredData.procedureType || 'STS CABG'} Risk Model

**Key Risk Factors:**
${mathResult.detailedSteps ? mathResult.detailedSteps.slice(1, 8).map(s => `- ${s.variable}: ${s.contribution}`).join('\n') : 'Detailed steps available'}
`;

      console.log('🤖 Stage 2A: AI risk estimation with manual calculation comparison...');
      
      const aiPrompt = `You are a cardiac surgery risk assessment specialist. You have been provided with both patient data and the manual mathematical calculation results from the official STS risk model.

**Patient Data (Structured - MANUALLY EDITED):**
${JSON.stringify(structuredData, null, 2)}

${manualCalculationSummary}

Your task is to:
1. **ANALYZE THE MANUAL CALCULATIONS**: Review the mathematically calculated risks
2. **COMPARE WITH YOUR ASSESSMENT**: Provide your own clinical risk assessment
3. **IDENTIFY DISCREPANCIES**: If your assessment differs from the manual calculation, explain why
4. **VALIDATE OR QUESTION**: Do the manual calculations align with the patient's clinical picture?

Provide your analysis in this format:

### MANUAL CALCULATION REVIEW
- Briefly summarize what the mathematical model calculated
- State whether these numbers seem reasonable for this patient

### YOUR INDEPENDENT ASSESSMENT
- **Estimated Mortality Risk (PROM)**: X%
- **Estimated Morbidity Risk (PROMM)**: X%
- **Risk Category**: Low/Moderate/High
- Brief clinical reasoning

### COMPARISON & DISCREPANCY ANALYSIS
- Compare your assessment with the manual calculation
- If they differ significantly (>1%), explain the clinical reasons
- Highlight any risk factors the mathematical model might have weighted differently

### KEY RISK FACTORS & RECOMMENDATIONS
- List major contributors to risk
- Perioperative considerations
- Clinical recommendations

Be specific, analytical, and highlight any important differences between the mathematical model and clinical judgment.`;

      const aiEst = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: aiPrompt }],
        temperature: 0.3
      });

      const aiText = aiEst.choices[0].message.content;
      
      const report = `
# STS RISK SCORE ANALYSIS
## Comprehensive Three-Method Assessment

---

## 📋 TAB 1: PATIENT DATA (Complete Official STS Form)

${stsForm}

---

## 🔢 TAB 2: MANUAL MATHEMATICAL CALCULATIONS

**⚠️ NOTE:** This section uses **purely algorithmic calculations** based on published STS mathematical models. This is NOT AI-generated - it is deterministic mathematical computation using logistic regression coefficients.

**Model Type:** ${structuredData.procedureType || 'General'} Risk Model  
**Method:** Deterministic Logistic Regression with Published STS Coefficients  
**Calculation Type:** Algorithmic (non-AI)

---

${mathTable}

---SECTION---

## 🤖 TAB 3: AI ANALYSIS WITH COMPARISON

**⚠️ NOTE:** This section provides **AI-powered clinical analysis** that reviews and compares the mathematical calculations. The AI validates the numbers and provides clinical context.

${aiText}

---

### Methodology Summary

This analysis combines three approaches:
1. **Patient Data Extraction** (AI + Human Review): Structured data from clinical notes
2. **Manual Mathematical Calculation** (Algorithmic): Deterministic STS logistic regression models  
3. **AI Clinical Analysis** (GPT-4o): Independent assessment and comparison with mathematical results

This three-method approach ensures comprehensive risk stratification. Use alongside clinical judgment and patient preferences for shared decision-making.

**Medical Disclaimer:** These estimates are computational tools for clinical decision support and do not replace physician judgment.

---SECTION---`;

      return res.json({ 
        response: report,
        structuredData: structuredData
      });

    } catch (err) {
      console.error('Error in re-analysis:', err);
      return res.status(500).json({ error: 'Failed to re-analyze with overrides', details: err.message });
    }
  }

  // Original flow - initial analysis
  if (!mode || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (mode !== 'notes') {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const patientNotesInput = data.patientNotes || data.history || '';
  
  if (!patientNotesInput) {
    return res.status(400).json({ error: 'Patient notes required' });
  }

  try {
    console.log('📝 Stage 1: Comprehensive data extraction...');
    
    const extractionPrompt = `Extract ALL STS Risk Calculator fields from these patient notes. Return ONLY valid JSON.

REQUIRED FIELDS (extract every one possible):

{
  // PLANNED SURGERY
  "procedureType": "Isolated CABG" | "Isolated AVR" | "Isolated MVR" | "AVR + CABG" | "MVR + CABG" | "MV Repair" | "MV Repair for Primary MR" | "MV Repair + CABG" | null,
  "surgeryIncidence": "First CV surgery" | "ReOp#1" | "ReOp#2" | "ReOp#3" | "ReOp≥4" | null,
  "priority": "Elective" | "Urgent" | "Emergent" | "Emergent Salvage" | null,
  
  // DEMOGRAPHICS
  "age": number | null,
  "gender": "Male" | "Female" | null,
  "height": number (cm) | null,
  "weight": number (kg) | null,
  "bmi": number | null,
  "race": string | null,
  "payor": string | null,
  
  // LABORATORY
  "creatinine": number (mg/dL) | null,
  "hematocrit": number (%) | null,
  "wbc": number (10³/μL) | null,
  "platelets": number (cells/μL) | null,
  
  // PREOP MEDICATIONS
  "medACEInhibitors": boolean,
  "medGPInhibitor": boolean,
  "medInotropes": boolean,
  "medSteroids": boolean,
  "medADPInhibitors": boolean,
  
  // RISK FACTORS
  "diabetes": "No" | "Yes, Diet Only" | "Yes, Oral" | "Yes, Insulin" | "Yes, Other SubQ" | null,
  "familyHxCAD": boolean,
  "hypertension": boolean,
  "liverDisease": boolean,
  "mediastinalRadiation": boolean,
  "unresponsiveState": boolean,
  "dialysis": boolean,
  "cancer": boolean,
  "syncope": boolean,
  "immunocompromised": boolean,
  "endocarditis": "No" | "Yes, treated" | "Yes, active" | "Yes, unknown" | null,
  "illicitDrugUse": "No" | "Yes" | "Unknown" | null,
  "alcoholUse": "None" | "≤ 1 drink/week" | "2-7 drinks/week" | "≥ 8 drinks/week" | null,
  "tobaccoUse": "Never smoker" | "Current smoker" | "Former smoker" | null,
  
  // PULMONARY
  "chronicLungDisease": "No" | "Mild" | "Moderate" | "Severe" | "Severity Unknown" | null,
  "recentPneumonia": boolean,
  "sleepApnea": boolean,
  "homeOxygen": boolean,
  
  // VASCULAR
  "cerebrovascularDisease": "No" | "CVA ≤ 30 days" | "CVA > 30 days" | "TIA" | "Other CVD" | null,
  "pvd": boolean,
  "priorCarotidSurgery": boolean,
  "rightCarotidStenosis": boolean,
  "leftCarotidStenosis": boolean,
  
  // CARDIAC STATUS
  "heartFailure": "None" | "Yes - Acute" | "Yes - Chronic" | "Yes - Both" | null,
  "nyhaClass": "Class I" | "Class II" | "Class III" | "Class IV" | null,
  "mechanicalSupport": string | null,
  "ejectionFraction": number (%) | null,
  "cardiogenicShock": boolean,
  "resuscitation": boolean,
  
  // CAD
  "primaryCoronarySymptom": "No coronary symptoms" | "Stable Angina" | "Unstable Angina" | "Non-ST Elevation MI" | "STEMI" | null,
  "miTiming": "No MI" | "≤ 6 Hrs" | ">6 Hrs but <24 Hrs" | "1 to 7 Days" | "8 to 21 Days" | "> 21 Days" | null,
  "numberOfDiseasedVessels": "None" | "One" | "Two" | "Three" | null,
  "leftMainStenosis": boolean,
  "proximalLADStenosis": boolean,
  
  // VALVE
  "aorticStenosis": boolean,
  "mitralStenosis": boolean,
  "aorticRootAbscess": boolean,
  "aorticRegurgitation": "None" | "Trivial/Trace" | "Mild" | "Moderate" | "Severe" | null,
  "mitralRegurgitation": "None" | "Trivial/Trace" | "Mild" | "Moderate" | "Severe" | null,
  "tricuspidRegurgitation": "None" | "Trivial/Trace" | "Mild" | "Moderate" | "Severe" | null,
  
  // ARRHYTHMIA
  "atrialFibrillation": "None" | "Remote" | "Recent" | null,
  "atrialFlutter": "None" | "Remote" | "Recent" | null,
  "ventricularArrhythmia": "None" | "Remote" | "Recent" | null,
  
  // PREVIOUS INTERVENTIONS
  "previousCABG": boolean,
  "previousValve": boolean,
  "previousPCI": boolean
}

Patient Notes:
${patientNotesInput}

Return ONLY the JSON object. Extract everything possible, use null for missing data, false for booleans.`;

    const extraction = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: extractionPrompt }],
      temperature: 0.1
    });

    let structuredData = JSON.parse(
      extraction.choices[0].message.content.trim()
        .replace(/```json\n?/g, '').replace(/```\n?/g, '')
    );

    console.log('🔢 Stage 2B: Mathematical calculation (performed FIRST)...');
    
    const mathResult = calculateSTSRisk(structuredData);

    // Format results as clean table similar to official STS calculator
    let mathTable = `
### 🔬 CALCULATED PERIOPERATIVE RISK ESTIMATES

**Model Type:** ${structuredData.procedureType || 'STS CABG'} Risk Model  
**Method:** Published STS Logistic Regression Coefficients (2018)  

| PERIOPERATIVE OUTCOME | ESTIMATE % |
|---|---|
| **Operative Mortality** | **${mathResult.mortality}%** |
| **Morbidity & Mortality** | **${mathResult.morbidity || 'Not calculated'}%** |`;

    // Add additional outcomes if available (CABG only)
    if (mathResult.stroke) {
      mathTable += `
| **Stroke** | **${mathResult.stroke}%** |`;
    }
    
    if (mathResult.renalFailure) {
      mathTable += `
| **Renal Failure** | **${mathResult.renalFailure}** |`;
    }
    
    if (mathResult.reoperation) {
      mathTable += `
| **Reoperation** | **${mathResult.reoperation}%** |`;
    }
    
    if (mathResult.prolongedVentilation) {
      mathTable += `
| **Prolonged Ventilation** | **${mathResult.prolongedVentilation}%** |`;
    }
    
    if (mathResult.deepSternalWoundInfection) {
      mathTable += `
| **Deep Sternal Wound Infection** | **${mathResult.deepSternalWoundInfection}%** |`;
    }
    
    if (mathResult.longHospitalStay) {
      mathTable += `
| **Long Hospital Stay (> 14 days)** | **${mathResult.longHospitalStay}%** |`;
    }
    
    if (mathResult.shortHospitalStay) {
      mathTable += `
| **Short Hospital Stay (<6 days)*** | **${mathResult.shortHospitalStay}%** |`;
    }
    
    mathTable += `\n\n**Risk Category:** ${mathResult.riskCategory}  \n**Calculation Confidence:** ${mathResult.confidence}\n\n`;
    
    // Helper function to format detailed calculation steps for any outcome
    function formatDetailedCalculation(steps, outcomeName, outcomeIcon) {
      if (!steps || steps.length === 0) return '';
      
      let output = `---\n\n### ${outcomeIcon} DETAILED CALCULATION: ${outcomeName}\n\n`;
      output += `This section shows the step-by-step mathematical calculation for **${outcomeName}** using logistic regression.\n\n`;
      output += `**Formula:** P(outcome) = 1 / (1 + e^(-logit))  \n**Where:** logit = intercept + Σ(coefficient × risk_factor)\n\n`;
      output += `---\n\n`;
      output += `#### Risk Factor Contributions\n\n`;
      output += `| Step | Risk Factor | Patient Value | Coefficient | Calculation | Logit Contribution |\n|---|---|---|---|---|---|\n`;
      
      let stepNum = 1;
      let logitSum = 0;
      let finalProbability = null;
      
      steps.forEach(s => {
        // Skip the final transformation steps for now
        if (s.variable.includes('TOTAL LOGIT')) {
          logitSum = parseFloat(s.contribution);
          return;
        }
        if (s.variable.includes('LOGISTIC TRANSFORMATION') || s.variable.includes('FINAL')) {
          if (s.variable.includes('LOGISTIC TRANSFORMATION')) {
            finalProbability = parseFloat(s.contribution);
          }
          return;
        }
        
        // Format calculation field
        let calcDisplay = s.calculation || '-';
        if (!s.calculation && s.coefficient !== '-' && s.variable !== 'Baseline Intercept') {
          calcDisplay = `${s.coefficient} × 1 = ${s.contribution}`;
        } else if (s.variable === 'Baseline Intercept') {
          calcDisplay = `Intercept = ${s.contribution}`;
        }
        
        output += `| ${stepNum} | **${s.variable}** | ${s.value || 'N/A'} | ${s.coefficient} | ${calcDisplay} | **${s.contribution}** |\n`;
        stepNum++;
      });
      
      // Add summary steps
      const totalLogitStep = steps.find(s => s.variable.includes('TOTAL LOGIT'));
      if (totalLogitStep) {
        output += `\n#### Total Logit (Sum of All Contributions)\n\n`;
        output += `**Total Logit = ${totalLogitStep.contribution}**\n\n`;
      }
      
      const logisticStep = steps.find(s => s.variable.includes('LOGISTIC TRANSFORMATION'));
      if (logisticStep) {
        output += `#### Logistic Transformation\n\n`;
        output += `**P = 1 / (1 + e^(-${logitSum.toFixed(3)})) = ${finalProbability ? finalProbability.toFixed(6) : logisticStep.contribution}**\n\n`;
      }
      
      const finalStep = steps.find(s => s.variable.includes('FINAL'));
      if (finalStep) {
        output += `#### Final Risk Estimate\n\n`;
        output += `**${outcomeName} Risk = ${finalStep.contribution}**\n\n`;
      }
      
      return output;
    }
    
    // Add detailed step-by-step calculations for ALL outcomes
    if (mathResult.detailedSteps && mathResult.detailedSteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.detailedSteps, 'Operative Mortality', '💀');
    }
    
    if (mathResult.morbiditySteps && mathResult.morbiditySteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.morbiditySteps, 'Morbidity & Mortality (PROMM)', '⚕️');
    }
    
    if (mathResult.strokeSteps && mathResult.strokeSteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.strokeSteps, 'Stroke', '🧠');
    }
    
    if (mathResult.renalFailureSteps && mathResult.renalFailureSteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.renalFailureSteps, 'Renal Failure', '🫘');
    }
    
    if (mathResult.reoperationSteps && mathResult.reoperationSteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.reoperationSteps, 'Reoperation', '🔄');
    }
    
    if (mathResult.prolongedVentilationSteps && mathResult.prolongedVentilationSteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.prolongedVentilationSteps, 'Prolonged Ventilation (>24 hrs)', '🫁');
    }
    
    if (mathResult.deepSternalWoundInfectionSteps && mathResult.deepSternalWoundInfectionSteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.deepSternalWoundInfectionSteps, 'Deep Sternal Wound Infection', '🦠');
    }
    
    if (mathResult.longHospitalStaySteps && mathResult.longHospitalStaySteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.longHospitalStaySteps, 'Long Hospital Stay (>14 days)', '🏥');
    }
    
    if (mathResult.shortHospitalStaySteps && mathResult.shortHospitalStaySteps.length > 0) {
      mathTable += formatDetailedCalculation(mathResult.shortHospitalStaySteps, 'Short Hospital Stay (<6 days)', '✨');
    }
    
    const stsForm = generateSTSFormHTML(structuredData);
    
    // Prepare manual calculation summary for AI
    const manualCalculationSummary = `
**Manual Mathematical Model Results (ALL STS OUTCOMES):**

| Outcome | Calculated Risk |
|---|---|
| Operative Mortality (PROM) | ${mathResult.mortality}% |
| Morbidity & Mortality (PROMM) | ${mathResult.morbidity}% |
${mathResult.stroke ? `| Stroke | ${mathResult.stroke}% |` : ''}
${mathResult.renalFailure ? `| Renal Failure | ${mathResult.renalFailure} |` : ''}
${mathResult.reoperation ? `| Reoperation | ${mathResult.reoperation}% |` : ''}
${mathResult.prolongedVentilation ? `| Prolonged Ventilation | ${mathResult.prolongedVentilation}% |` : ''}
${mathResult.deepSternalWoundInfection ? `| Deep Sternal Wound Infection | ${mathResult.deepSternalWoundInfection}% |` : ''}
${mathResult.longHospitalStay ? `| Long Hospital Stay (>14d) | ${mathResult.longHospitalStay}% |` : ''}
${mathResult.shortHospitalStay ? `| Short Hospital Stay (<6d) | ${mathResult.shortHospitalStay}% |` : ''}

**Risk Category:** ${mathResult.riskCategory}
**Model Type:** ${structuredData.procedureType || 'STS CABG'} Risk Model

**Key Risk Factors:**
${mathResult.detailedSteps ? mathResult.detailedSteps.slice(1, 8).map(s => `- ${s.variable}: ${s.contribution}`).join('\n') : 'Detailed steps available'}
`;

    console.log('🤖 Stage 2A: AI risk estimation with manual calculation comparison...');
    
    const aiPrompt = `You are a cardiac surgery risk assessment specialist. You have been provided with both patient data and the manual mathematical calculation results from the official STS risk model.

**Patient Data (Structured):**
${JSON.stringify(structuredData, null, 2)}

${manualCalculationSummary}

Your task is to:
1. **ANALYZE THE MANUAL CALCULATIONS**: Review the mathematically calculated risks
2. **COMPARE WITH YOUR ASSESSMENT**: Provide your own clinical risk assessment
3. **IDENTIFY DISCREPANCIES**: If your assessment differs from the manual calculation, explain why
4. **VALIDATE OR QUESTION**: Do the manual calculations align with the patient's clinical picture?

Provide your analysis in this format:

### MANUAL CALCULATION REVIEW
- Briefly summarize what the mathematical model calculated
- State whether these numbers seem reasonable for this patient

### YOUR INDEPENDENT ASSESSMENT
- **Estimated Mortality Risk (PROM)**: X%
- **Estimated Morbidity Risk (PROMM)**: X%
- **Risk Category**: Low/Moderate/High
- Brief clinical reasoning

### COMPARISON & DISCREPANCY ANALYSIS
- Compare your assessment with the manual calculation
- If they differ significantly (>1%), explain the clinical reasons
- Highlight any risk factors the mathematical model might have weighted differently

### KEY RISK FACTORS & RECOMMENDATIONS
- List major contributors to risk
- Perioperative considerations
- Clinical recommendations

Be specific, analytical, and highlight any important differences between the mathematical model and clinical judgment.`;

    const aiEst = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: aiPrompt }],
      temperature: 0.3
    });

    const aiText = aiEst.choices[0].message.content;
    
    const report = `
# STS RISK SCORE ANALYSIS
## Comprehensive Three-Method Assessment

---

## 📋 TAB 1: PATIENT DATA (Complete Official STS Form)

${stsForm}

---

## 🔢 TAB 2: MANUAL MATHEMATICAL CALCULATIONS

**⚠️ NOTE:** This section uses **purely algorithmic calculations** based on published STS mathematical models. This is NOT AI-generated - it is deterministic mathematical computation using logistic regression coefficients.

**Model Type:** ${structuredData.procedureType || 'General'} Risk Model  
**Method:** Deterministic Logistic Regression with Published STS Coefficients  
**Calculation Type:** Algorithmic (non-AI)

---

${mathTable}

---SECTION---

## 🤖 TAB 3: AI ANALYSIS WITH COMPARISON

**⚠️ NOTE:** This section provides **AI-powered clinical analysis** that reviews and compares the mathematical calculations. The AI validates the numbers and provides clinical context.

${aiText}

---

### Methodology Summary

This analysis combines three approaches:
1. **Patient Data Extraction** (AI + Human Review): Structured data from clinical notes
2. **Manual Mathematical Calculation** (Algorithmic): Deterministic STS logistic regression models  
3. **AI Clinical Analysis** (GPT-4o): Independent assessment and comparison with mathematical results

This three-method approach ensures comprehensive risk stratification. Use alongside clinical judgment and patient preferences for shared decision-making.

**Medical Disclaimer:** These estimates are computational tools for clinical decision support and do not replace physician judgment.

---SECTION---`;

    res.json({ 
      response: report,
      structuredData: structuredData // Include for standalone page
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to generate STS risk score', details: err.message });
  }
});

module.exports = router;
