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
  
  return `
<style>
  .sts-container { font-family: Arial, sans-serif; font-size: 9px; width: 100%; }
  .sts-outer-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .sts-outer-table td { padding: 0 8px; vertical-align: top; width: 33.33%; }
  .sts-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .sts-table td { padding: 3px 5px; vertical-align: middle; border: none; }
  .sts-label { font-weight: 500; font-size: 9px; width: 35%; }
  .sts-value { width: 65%; }
  .sts-input, .sts-select { padding: 2px 4px; border: 1px solid #999; border-radius: 2px; font-size: 9px; width: 100%; }
  .sts-section { background: #e8e8e8; padding: 5px; font-weight: 600; font-size: 10px; border: 1px solid #ccc; margin: 0; }
  .sts-subsection { background: #f5f5f5; padding: 4px; font-weight: 600; font-size: 9px; }
  .sts-checkbox-label { font-size: 9px; margin-left: 3px; }
</style>

<div style="overflow-x: auto; width: 100%; margin: 0; padding: 0;">
<div class="sts-container" style="margin: 0; padding: 0;">
  <div style="background: #003366; color: white; padding: 6px; margin: 0; text-align: center;">
    <div style="font-size: 14px; font-weight: 600; margin: 0;">STS Short-term / Operative Risk Calculator</div>
    <div style="font-size: 9px; font-style: italic; margin: 2px 0 0 0;">Adult Cardiac Surgery Database - Extracted Patient Data</div>
  </div>
  <table class="sts-outer-table" style="margin: 0; padding: 0; border-spacing: 0;">
    <tr>
    
    <!-- COLUMN 1 -->
    <td>
      
      <table class="sts-table">
        <tr><td colspan="2" class="sts-section">PLANNED SURGERY</td></tr>
        
        <tr>
          <td class="sts-label">Procedure Type:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('procedureType')}" disabled>
              <option ${getSelected('procedureType', null)}>Select</option>
              <option ${getSelected('procedureType', 'Isolated CABG')}>Isolated CABG</option>
              <option ${getSelected('procedureType', 'Isolated AVR')}>Isolated AVR</option>
              <option ${getSelected('procedureType', 'Isolated MVR')}>Isolated MVR</option>
              <option ${getSelected('procedureType', 'AVR + CABG')}>AVR + CABG</option>
              <option ${getSelected('procedureType', 'MVR + CABG')}>MVR + CABG</option>
              <option ${getSelected('procedureType', 'MV Repair')}>MV Repair - Any Etiology</option>
              <option ${getSelected('procedureType', 'MV Repair for Primary MR')}>MV Repair for Primary MR</option>
              <option ${getSelected('procedureType', 'MV Repair + CABG')}>MV Repair + CABG</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Surgery Incidence:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('surgeryIncidence')}" disabled>
              <option ${getSelected('surgeryIncidence', null)}>Select</option>
              <option ${getSelected('surgeryIncidence', 'First CV surgery')}>First CV surgery</option>
              <option ${getSelected('surgeryIncidence', 'ReOp#1')}>ReOp#1 CV surgery</option>
              <option ${getSelected('surgeryIncidence', 'ReOp#2')}>ReOp#2 CV surgery</option>
              <option ${getSelected('surgeryIncidence', 'ReOp#3')}>ReOp#3 CV surgery</option>
              <option ${getSelected('surgeryIncidence', 'ReOp≥4')}>ReOp≥4 CV surgery</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Surgical Priority:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('priority')}" disabled>
              <option ${getSelected('priority', null)}>Select</option>
              <option ${getSelected('priority', 'Elective')}>Elective</option>
              <option ${getSelected('priority', 'Urgent')}>Urgent</option>
              <option ${getSelected('priority', 'Emergent')}>Emergent</option>
              <option ${getSelected('priority', 'Emergent Salvage')}>Emergent Salvage</option>
            </select>
          </td>
        </tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">DEMOGRAPHICS</td></tr>
        
        <tr>
          <td class="sts-label">Sex:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('gender')}" disabled>
              <option ${getSelected('gender', null)}>Select</option>
              <option ${getSelected('gender', 'Male')}>Male</option>
              <option ${getSelected('gender', 'Female')}>Female</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Age (years):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('age')}" value="${getValue('age')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Height (cm):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('height')}" value="${getValue('height')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Weight (kg):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('weight')}" value="${getValue('weight')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">BMI (kg/m²):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('bmi')}" value="${getValue('bmi')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Race:</td>
          <td class="sts-value">
            <input type="text" class="sts-input" style="${highlight('race')}" value="${getValue('race')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Payor / Insurance:</td>
          <td class="sts-value">
            <input type="text" class="sts-input" style="${highlight('payor')}" value="${getValue('payor')}" disabled />
          </td>
        </tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">LABORATORY VALUES</td></tr>
        
        <tr>
          <td class="sts-label">Creatinine (mg/dL):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('creatinine')}" value="${getValue('creatinine')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Hematocrit (%):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('hematocrit')}" value="${getValue('hematocrit')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">WBC Count (10³/μL):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('wbc')}" value="${getValue('wbc')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Platelet Count (cells/μL):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('platelets')}" value="${getValue('platelets')}" disabled />
          </td>
        </tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">PREOPERATIVE MEDICATIONS</td></tr>
        
        <tr>
          <td colspan="2">
            <label style="font-size: 9px;"><input type="checkbox" ${getChecked('medACEInhibitors')} disabled /> ACE Inhibitors/ARBs ≤ 48 hrs</label>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <label style="font-size: 9px;"><input type="checkbox" ${getChecked('medGPInhibitor')} disabled /> GP IIb/IIIa Inhibitor ≤ 24 hrs</label>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <label style="font-size: 9px;"><input type="checkbox" ${getChecked('medInotropes')} disabled /> Inotropes ≤ 48 hrs</label>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <label style="font-size: 9px;"><input type="checkbox" ${getChecked('medSteroids')} disabled /> Steroids ≤ 24 hrs</label>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <label style="font-size: 9px;"><input type="checkbox" ${getChecked('medADPInhibitors')} disabled /> ADP Inhibitors ≤ 5 days</label>
          </td>
        </tr>
        
      </table>
      
    </td>
    
    <!-- COLUMN 2 -->
    <td>
      
      <table class="sts-table">
        <tr><td colspan="2" class="sts-section">RISK FACTORS / COMORBIDITIES</td></tr>
        
        <tr>
          <td class="sts-label">Diabetes:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('diabetes')}" disabled>
              <option ${getSelected('diabetes', null)}>Select</option>
              <option ${getSelected('diabetes', 'No')}>No</option>
              <option ${getSelected('diabetes', 'Yes, Diet Only')}>Yes, Diet Only</option>
              <option ${getSelected('diabetes', 'Yes, Oral')}>Yes, Oral</option>
              <option ${getSelected('diabetes', 'Yes, Insulin')}>Yes, Insulin</option>
              <option ${getSelected('diabetes', 'Yes, Other SubQ')}>Yes, Other SubQ</option>
              <option ${getSelected('diabetes', 'Yes, Other Control')}>Yes, Other Control</option>
              <option ${getSelected('diabetes', 'Yes, Unknown Control')}>Yes, Unknown Control</option>
            </select>
          </td>
        </tr>
        
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('familyHxCAD')} disabled /> Family Hx of CAD</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('hypertension')} disabled /> Hypertension</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('liverDisease')} disabled /> Liver Disease</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('mediastinalRadiation')} disabled /> Mediastinal Radiation</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('unresponsiveState')} disabled /> Unresponsive State</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('dialysis')} disabled /> Dialysis</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('cancer')} disabled /> Cancer ≤ 5 yrs</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('syncope')} disabled /> Syncope</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('immunocompromised')} disabled /> Immunocompromised</label></td></tr>
        
        <tr>
          <td class="sts-label">Endocarditis:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('endocarditis')}" disabled>
              <option ${getSelected('endocarditis', null)}>Select</option>
              <option ${getSelected('endocarditis', 'No')}>No</option>
              <option ${getSelected('endocarditis', 'Yes, treated')}>Yes, treated</option>
              <option ${getSelected('endocarditis', 'Yes, active')}>Yes, active</option>
              <option ${getSelected('endocarditis', 'Yes, unknown')}>Yes, unknown</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Illicit Drug Use:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('illicitDrugUse')}" disabled>
              <option ${getSelected('illicitDrugUse', null)}>Select</option>
              <option ${getSelected('illicitDrugUse', 'No')}>No</option>
              <option ${getSelected('illicitDrugUse', 'Yes')}>Yes</option>
              <option ${getSelected('illicitDrugUse', 'Unknown')}>Unknown</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Alcohol Use:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('alcoholUse')}" disabled>
              <option ${getSelected('alcoholUse', null)}>Select</option>
              <option ${getSelected('alcoholUse', 'None')}>None</option>
              <option ${getSelected('alcoholUse', '≤ 1 drink/week')}>≤ 1 drink/week</option>
              <option ${getSelected('alcoholUse', '2-7 drinks/week')}>2-7 drinks/week</option>
              <option ${getSelected('alcoholUse', '≥ 8 drinks/week')}>≥ 8 drinks/week</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Tobacco Use:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('tobaccoUse')}" disabled>
              <option ${getSelected('tobaccoUse', null)}>Select</option>
              <option ${getSelected('tobaccoUse', 'Never smoker')}>Never smoker</option>
              <option ${getSelected('tobaccoUse', 'Current smoker')}>Current smoker</option>
              <option ${getSelected('tobaccoUse', 'Former smoker')}>Former smoker</option>
            </select>
          </td>
        </tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">PULMONARY</td></tr>
        
        <tr>
          <td class="sts-label">Chronic Lung Disease:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('chronicLungDisease')}" disabled>
              <option ${getSelected('chronicLungDisease', null)}>Select</option>
              <option ${getSelected('chronicLungDisease', 'No')}>No</option>
              <option ${getSelected('chronicLungDisease', 'Mild')}>Mild</option>
              <option ${getSelected('chronicLungDisease', 'Moderate')}>Moderate</option>
              <option ${getSelected('chronicLungDisease', 'Severe')}>Severe</option>
              <option ${getSelected('chronicLungDisease', 'Severity Unknown')}>Severity Unknown</option>
            </select>
          </td>
        </tr>
        
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('recentPneumonia')} disabled /> Recent Pneumonia</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('sleepApnea')} disabled /> Sleep Apnea</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('homeOxygen')} disabled /> Home O₂</label></td></tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">VASCULAR</td></tr>
        
        <tr>
          <td class="sts-label">Cerebrovascular Disease:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('cerebrovascularDisease')}" disabled>
              <option ${getSelected('cerebrovascularDisease', null)}>Select</option>
              <option ${getSelected('cerebrovascularDisease', 'No')}>No</option>
              <option ${getSelected('cerebrovascularDisease', 'CVA ≤ 30 days')}>CVA ≤ 30 days</option>
              <option ${getSelected('cerebrovascularDisease', 'CVA > 30 days')}>CVA > 30 days</option>
              <option ${getSelected('cerebrovascularDisease', 'TIA')}>TIA</option>
              <option ${getSelected('cerebrovascularDisease', 'Other CVD')}>Other CVD</option>
            </select>
          </td>
        </tr>
        
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('pvd')} disabled /> Peripheral Artery Disease</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('priorCarotidSurgery')} disabled /> Prior Carotid Surgery</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('rightCarotidStenosis')} disabled /> Right Carotid Sten. ≥ 80%</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('leftCarotidStenosis')} disabled /> Left Carotid Sten. ≥ 80%</label></td></tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">CARDIAC STATUS</td></tr>
        
        <tr>
          <td class="sts-label">Heart Failure:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('heartFailure')}" disabled>
              <option ${getSelected('heartFailure', null)}>Select</option>
              <option ${getSelected('heartFailure', 'None')}>None</option>
              <option ${getSelected('heartFailure', 'Yes - Acute')}>Yes - Acute</option>
              <option ${getSelected('heartFailure', 'Yes - Chronic')}>Yes - Chronic</option>
              <option ${getSelected('heartFailure', 'Yes - Both')}>Yes - Both</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">NYHA Classification:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('nyhaClass')}" disabled>
              <option ${getSelected('nyhaClass', null)}>Select</option>
              <option ${getSelected('nyhaClass', 'Class I')}>Class I</option>
              <option ${getSelected('nyhaClass', 'Class II')}>Class II</option>
              <option ${getSelected('nyhaClass', 'Class III')}>Class III</option>
              <option ${getSelected('nyhaClass', 'Class IV')}>Class IV</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">PreOp Mech Circ Support:</td>
          <td class="sts-value">
            <input type="text" class="sts-input" style="${highlight('mechanicalSupport')}" value="${getValue('mechanicalSupport')}" disabled />
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Ejection Fraction (%):</td>
          <td class="sts-value">
            <input type="number" class="sts-input" style="${highlight('ejectionFraction')}" value="${getValue('ejectionFraction')}" disabled />
          </td>
        </tr>
        
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('cardiogenicShock')} disabled /> Cardiogenic Shock</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('resuscitation')} disabled /> Resuscitation ≤ 1hr</label></td></tr>
        
      </table>
      
    </td>
    
    <!-- COLUMN 3 -->
    <td>
      
      <table class="sts-table">
        <tr><td colspan="2" class="sts-section">CORONARY ARTERY DISEASE</td></tr>
        
        <tr>
          <td class="sts-label">Primary Coronary Symptom:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('primaryCoronarySymptom')}" disabled>
              <option ${getSelected('primaryCoronarySymptom', null)}>Select</option>
              <option ${getSelected('primaryCoronarySymptom', 'No coronary symptoms')}>No coronary symptoms</option>
              <option ${getSelected('primaryCoronarySymptom', 'Stable Angina')}>Stable Angina</option>
              <option ${getSelected('primaryCoronarySymptom', 'Unstable Angina')}>Unstable Angina</option>
              <option ${getSelected('primaryCoronarySymptom', 'Non-ST Elevation MI')}>Non-ST Elevation MI</option>
              <option ${getSelected('primaryCoronarySymptom', 'STEMI')}>STEMI</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Myocardial Infarction - When:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('miTiming')}" disabled>
              <option ${getSelected('miTiming', null)}>Select</option>
              <option ${getSelected('miTiming', 'No MI')}>No MI</option>
              <option ${getSelected('miTiming', '≤ 6 Hrs')}>≤ 6 Hrs</option>
              <option ${getSelected('miTiming', '>6 Hrs but <24 Hrs')}>>6 Hrs but <24 Hrs</option>
              <option ${getSelected('miTiming', '1 to 7 Days')}>1 to 7 Days</option>
              <option ${getSelected('miTiming', '8 to 21 Days')}>8 to 21 Days</option>
              <option ${getSelected('miTiming', '> 21 Days')}>> 21 Days</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">No. of Diseased Vessels:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('numberOfDiseasedVessels')}" disabled>
              <option ${getSelected('numberOfDiseasedVessels', null)}>Select</option>
              <option ${getSelected('numberOfDiseasedVessels', 'None')}>None</option>
              <option ${getSelected('numberOfDiseasedVessels', 'One')}>One</option>
              <option ${getSelected('numberOfDiseasedVessels', 'Two')}>Two</option>
              <option ${getSelected('numberOfDiseasedVessels', 'Three')}>Three</option>
            </select>
          </td>
        </tr>
        
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('leftMainStenosis')} disabled /> Left Main Sten. ≥ 50%</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('proximalLADStenosis')} disabled /> Proximal LAD Sten. ≥ 70%</label></td></tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">VALVE DISEASE</td></tr>
        
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('aorticStenosis')} disabled /> Aortic Stenosis</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('mitralStenosis')} disabled /> Mitral Stenosis</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('aorticRootAbscess')} disabled /> Aortic Root Abscess</label></td></tr>
        
        <tr>
          <td class="sts-label">Aortic Regurgitation:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('aorticRegurgitation')}" disabled>
              <option ${getSelected('aorticRegurgitation', null)}>Select</option>
              <option ${getSelected('aorticRegurgitation', 'None')}>None</option>
              <option ${getSelected('aorticRegurgitation', 'Trivial/Trace')}>Trivial/Trace</option>
              <option ${getSelected('aorticRegurgitation', 'Mild')}>Mild</option>
              <option ${getSelected('aorticRegurgitation', 'Moderate')}>Moderate</option>
              <option ${getSelected('aorticRegurgitation', 'Severe')}>Severe</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Mitral Regurgitation:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('mitralRegurgitation')}" disabled>
              <option ${getSelected('mitralRegurgitation', null)}>Select</option>
              <option ${getSelected('mitralRegurgitation', 'None')}>None</option>
              <option ${getSelected('mitralRegurgitation', 'Trivial/Trace')}>Trivial/Trace</option>
              <option ${getSelected('mitralRegurgitation', 'Mild')}>Mild</option>
              <option ${getSelected('mitralRegurgitation', 'Moderate')}>Moderate</option>
              <option ${getSelected('mitralRegurgitation', 'Severe')}>Severe</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Tricuspid Regurgitation:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('tricuspidRegurgitation')}" disabled>
              <option ${getSelected('tricuspidRegurgitation', null)}>Select</option>
              <option ${getSelected('tricuspidRegurgitation', 'None')}>None</option>
              <option ${getSelected('tricuspidRegurgitation', 'Trivial/Trace')}>Trivial/Trace</option>
              <option ${getSelected('tricuspidRegurgitation', 'Mild')}>Mild</option>
              <option ${getSelected('tricuspidRegurgitation', 'Moderate')}>Moderate</option>
              <option ${getSelected('tricuspidRegurgitation', 'Severe')}>Severe</option>
            </select>
          </td>
        </tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">ARRHYTHMIA</td></tr>
        
        <tr>
          <td class="sts-label">Atrial Fibrillation:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('atrialFibrillation')}" disabled>
              <option ${getSelected('atrialFibrillation', null)}>Select</option>
              <option ${getSelected('atrialFibrillation', 'None')}>None</option>
              <option ${getSelected('atrialFibrillation', 'Remote')}>Remote</option>
              <option ${getSelected('atrialFibrillation', 'Recent')}>Recent</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">Atrial Flutter:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('atrialFlutter')}" disabled>
              <option ${getSelected('atrialFlutter', null)}>Select</option>
              <option ${getSelected('atrialFlutter', 'None')}>None</option>
              <option ${getSelected('atrialFlutter', 'Remote')}>Remote</option>
              <option ${getSelected('atrialFlutter', 'Recent')}>Recent</option>
            </select>
          </td>
        </tr>
        
        <tr>
          <td class="sts-label">V. Tach / V. Fib:</td>
          <td class="sts-value">
            <select class="sts-select" style="${highlight('ventricularArrhythmia')}" disabled>
              <option ${getSelected('ventricularArrhythmia', null)}>Select</option>
              <option ${getSelected('ventricularArrhythmia', 'None')}>None</option>
              <option ${getSelected('ventricularArrhythmia', 'Remote')}>Remote</option>
              <option ${getSelected('ventricularArrhythmia', 'Recent')}>Recent</option>
            </select>
          </td>
        </tr>
        
        <tr><td colspan="2" class="sts-section" style="margin-top: 8px;">PREVIOUS CARDIAC INTERVENTIONS</td></tr>
        
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('previousCABG')} disabled /> Previous CABG</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('previousValve')} disabled /> Previous Valve Surgery</label></td></tr>
        <tr><td colspan="2"><label style="font-size: 9px;"><input type="checkbox" ${getChecked('previousPCI')} disabled /> Previous PCI</label></td></tr>
        
      </table>
      
    </td>
    
    </tr>
  </table>
  
  <div style="margin-top: 15px; padding: 8px; background: #e6f2ff; border-left: 4px solid #003366; font-size: 9px;">
    <strong>📊 Data Extraction Summary:</strong> ${Object.values(data).filter(v => v !== null && v !== undefined && v !== '').length} fields extracted. Yellow highlights = extracted values.
  </div>
  
</div>

</div>
  `;
}

router.post('/', async (req, res) => {
  const { mode, data } = req.body;

  if (!mode || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (mode !== 'notes') {
    return res.status(400).json({ error: 'Invalid mode' });
  }

  const patientNotes = data.patientNotes || data.history || '';
  
  if (!patientNotes) {
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
${patientNotes}

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

    console.log('🤖 Stage 2A: AI risk estimation...');
    
    const aiPrompt = `You are a cardiac surgery risk assessment specialist. Based on this comprehensive STS data, provide detailed risk analysis:

${JSON.stringify(structuredData, null, 2)}

Provide:
1. **PATIENT SUMMARY**: Brief clinical overview
2. **ESTIMATED RISK SCORES**: 
   - Mortality Risk (PROM): X%
   - Morbidity Risk (PROMM): X%
   - Risk Category: Low/Moderate/High
3. **KEY RISK FACTORS**: List major contributors
4. **CLINICAL RECOMMENDATIONS**: Perioperative considerations

Be specific with percentages based on STS guidelines.`;

    const aiEst = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: aiPrompt }],
      temperature: 0.3
    });

    const aiText = aiEst.choices[0].message.content;

    console.log('🔢 Stage 2B: Mathematical calculation...');
    
    const mathResult = calculateSTSRisk(structuredData);

    let mathTable = '';
    let logitSum = 0;
    let finalProbability = null;
    
    if (mathResult.detailedSteps && mathResult.detailedSteps.length > 0) {
      // Build calculation summary
      let calculationSteps = '';
      let stepNum = 1;
      
      mathTable = `### Step-by-Step Logistic Regression Calculation\n\n`;
      mathTable += `This calculation uses the published STS logistic regression model:\n`;
      mathTable += `**P(mortality) = 1 / (1 + e^(-logit))**\n\n`;
      mathTable += `Where **logit = intercept + Σ(coefficient × risk_factor)**\n\n`;
      mathTable += `---\n\n`;
      mathTable += `#### Step 1: Building the Logit Sum\n\n`;
      mathTable += `| Step | Risk Factor | Patient Value | Coefficient | Mathematical Calculation | Logit Contribution |\n|---|---|---|---|---|---|\n`;
      
      mathResult.detailedSteps.forEach(s => {
        // Skip the final transformation steps for now, we'll add them separately
        if (s.variable.includes('TOTAL LOGIT')) {
          logitSum = parseFloat(s.contribution);
          return;
        }
        if (s.variable.includes('LOGISTIC TRANSFORMATION') || s.variable.includes('FINAL MORTALITY')) {
          if (s.variable.includes('LOGISTIC TRANSFORMATION')) {
            finalProbability = parseFloat(s.contribution);
          }
          return;
        }
        
        // Format calculation field more explicitly
        let calcDisplay = s.calculation || '-';
        if (!s.calculation && s.coefficient !== '-' && s.variable !== 'Baseline Intercept') {
          // For binary risk factors, show coefficient × 1
          calcDisplay = `${s.coefficient} × 1 = ${s.contribution}`;
        } else if (s.variable === 'Baseline Intercept') {
          calcDisplay = `Intercept = ${s.contribution}`;
        }
        
        mathTable += `| ${stepNum} | **${s.variable}** | ${s.value || 'N/A'} | ${s.coefficient} | ${calcDisplay} | **${s.contribution}** |\n`;
        stepNum++;
      });
      
      // Add the logit sum step
      const totalLogitStep = mathResult.detailedSteps.find(s => s.variable.includes('TOTAL LOGIT'));
      if (totalLogitStep) {
        mathTable += `\n#### Step 2: Calculate Total Logit (Summation)\n\n`;
        mathTable += `Add all logit contributions together:\n\n`;
        
        // Build the addition string
        let additionParts = [];
        let isFirst = true;
        mathResult.detailedSteps.forEach(s => {
          if (!s.variable.includes('TOTAL LOGIT') && 
              !s.variable.includes('LOGISTIC TRANSFORMATION') && 
              !s.variable.includes('FINAL MORTALITY')) {
            const contrib = parseFloat(s.contribution);
            if (Math.abs(contrib) > 0.001) { // Ignore essentially zero values
              if (isFirst) {
                additionParts.push(contrib.toFixed(3));
                isFirst = false;
              } else {
                additionParts.push(contrib >= 0 ? `+ ${contrib.toFixed(3)}` : `${contrib.toFixed(3)}`);
              }
            }
          }
        });
        
        mathTable += `**Total Logit = ${additionParts.join(' ')} = ${totalLogitStep.contribution}**\n\n`;
        mathTable += `This is the sum of the baseline intercept plus all risk factor contributions shown in Step 1.\n\n`;
      }
      
      // Add the logistic transformation step
      const logisticStep = mathResult.detailedSteps.find(s => s.variable.includes('LOGISTIC TRANSFORMATION'));
      if (logisticStep) {
        mathTable += `#### Step 3: Logistic Transformation (Logit → Probability)\n\n`;
        mathTable += `Using the logistic function: **P = 1 / (1 + e^(-logit))**\n\n`;
        mathTable += `- **Logit value:** ${logitSum.toFixed(3)}\n`;
        mathTable += `- **Calculation:** ${logisticStep.calculation || logisticStep.value}\n`;
        mathTable += `- **Result:** P = ${finalProbability ? finalProbability.toFixed(6) : logisticStep.contribution}\n\n`;
      }
      
      // Add the final mortality step
      const finalStep = mathResult.detailedSteps.find(s => s.variable.includes('FINAL MORTALITY'));
      if (finalStep) {
        mathTable += `#### Step 4: Convert to Percentage\n\n`;
        mathTable += `**Mortality Risk = ${finalStep.contribution}**\n\n`;
        mathTable += `This is the final predicted risk of operative mortality (PROM) calculated from the mathematical model.\n\n`;
      }
    }
    
    const stsForm = generateSTSFormHTML(structuredData);
    
    const report = `
# STS RISK SCORE ANALYSIS
## Comprehensive Three-Method Assessment

---

## 📋 TAB 1: PATIENT DATA (Complete Official STS Form)

${stsForm}

---

## 🤖 TAB 2: AI ANALYSIS RESULTS

${aiText}

---

## 🔢 TAB 3: MANUAL MATHEMATICAL CALCULATIONS

**⚠️ NOTE:** This section uses **purely algorithmic calculations** based on published STS mathematical models. This is NOT AI-generated - it is deterministic mathematical computation using logistic regression coefficients.

**Model Type:** ${structuredData.procedureType || 'General'} Risk Model  
**Method:** Deterministic Logistic Regression with Published STS Coefficients  
**Calculation Type:** Algorithmic (non-AI)

---

${mathTable}

### Final Results

- **Mortality Risk (PROM):** ${mathResult.mortality}%
- **Morbidity Risk (PROMM):** ${mathResult.morbidity}%
- **Risk Category:** ${mathResult.riskCategory}
- **Calculation Confidence:** ${mathResult.confidence}

---

## 📊 CLINICAL INTERPRETATION

This analysis combines AI-based assessment with precise mathematical modeling to provide comprehensive risk stratification. Use alongside clinical judgment and patient preferences for shared decision-making.

**Medical Disclaimer:** These estimates are computational tools for clinical decision support and do not replace physician judgment.
`;

    res.json({ response: report });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed to generate STS risk score', details: err.message });
  }
});

module.exports = router;
