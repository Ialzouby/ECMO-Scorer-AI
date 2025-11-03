# STS Risk Calculator - Implementation Guide

## Overview

This implementation provides **dual-method STS risk assessment**:
- **Option A (AI-Based)**: GPT-4o estimates risk using published STS guidelines
- **Option B (Mathematical)**: Logistic regression models approximating published STS algorithms

## Architecture

### Three-Stage Process

```
Patient Notes → Stage 1: Data Extraction → Stage 2A: AI Estimation
                                        → Stage 2B: Mathematical Calc
                                        → Combined Report
```

### Stage 1: AI-Powered Data Extraction
**Purpose**: Convert free-text notes into structured data

**Extracted Fields**:
- Demographics: age, gender, BMI
- Procedure: type, priority (elective/urgent/emergency)
- Cardiac: ejection fraction, NYHA class, MI timing
- Comorbidities: diabetes, COPD, renal function, PVD
- History: prior cardiac surgery, endocarditis
- Acute status: cardiogenic shock, mechanical support

**Method**: GPT-4o with low temperature (0.1) for consistency

### Stage 2A: AI Risk Estimation (Option A)
**Purpose**: Provide contextual risk assessment using clinical judgment

**Advantages**:
- ✅ Handles incomplete data gracefully
- ✅ Considers clinical context
- ✅ Provides detailed explanations
- ✅ Identifies missing data impact

**Accuracy**: Based on published STS guidelines and risk factors

### Stage 2B: Mathematical Calculation (Option B)
**Purpose**: Precise calculation using regression models

**Method**: Logistic regression with procedure-specific coefficients

**Supported Procedures**:
- CABG (Coronary Artery Bypass Grafting)
- AVR (Aortic Valve Replacement)
- MVR (Mitral Valve Replacement)
- MV Repair (Mitral Valve Repair)

**Risk Factors & Approximate Coefficients**:

| Risk Factor | CABG | AVR | MVR | Impact |
|------------|------|-----|-----|--------|
| Age (per year >60) | 0.05 | 0.06 | 0.055 | Moderate |
| Female gender | 0.3 | 0.25 | 0.2 | Low-Mod |
| EF <30% | 0.8 | 0.9 | 1.0 | High |
| Dialysis | 1.2 | 1.3 | 1.4 | Very High |
| Emergency | 1.0 | 1.2 | 1.3 | High |
| Reoperation | 0.6 | 0.7 | 0.8 | Moderate |
| Cardiogenic Shock | 1.5 | 1.6 | 1.6 | Very High |
| COPD (severe) | 0.5 | - | - | Moderate |
| Recent MI | 0.5 | - | - | Moderate |
| Endocarditis | - | 0.8 | 0.9 | High |

**Formula**: 
```
Mortality Risk = 1 / (1 + e^(-logit))
where logit = baseline + Σ(coefficient × risk_factor)
```

**Risk Categories**:
- Low: <1% mortality
- Moderate: 1-5% mortality
- High: >5% mortality

## Model Limitations

### Important Disclaimers

1. **Simplified Coefficients**: The mathematical models use *approximate* coefficients based on published literature, not the exact proprietary STS formulas

2. **Missing Variables**: Full STS models use 40-50+ variables; this implementation uses key risk factors only

3. **Population Differences**: Models trained on US data may not generalize to all populations

4. **Not for Exclusion**: Never use high risk scores alone to exclude patients from surgery

5. **Requires Validation**: These estimates should be validated against institutional outcomes

## Accuracy Expectations

### When Both Methods Agree (within 1-2%)
✅ **High Confidence** - Data is complete and consistent
- Use combined estimate for counseling
- Both methods validating each other

### When Methods Disagree (>2% difference)
⚠️ **Review Required**
- Check extracted data for errors
- Consider missing critical variables
- Unusual clinical scenario may favor AI interpretation
- Verify procedure type classification

### Confidence Levels

| Confidence | Criteria | Action |
|-----------|----------|--------|
| High | <2% difference, complete data | Use for clinical decisions |
| Medium | 2-4% difference or some missing data | Use with caution, note limitations |
| Low | >4% difference or critical data missing | Supplement with clinical judgment |

## Clinical Use

### Best Practices

1. **Verify Extracted Data**: Always check Stage 1 JSON output for accuracy
2. **Compare Both Methods**: Look for agreement between AI and mathematical
3. **Consider Context**: AI method better handles unusual scenarios
4. **Document Limitations**: Note missing data in clinical documentation
5. **Multi-source Decision**: Use alongside surgeon judgment and patient preferences

### Example Interpretation

```
AI Estimation: 3.2% mortality
Mathematical: 3.4% mortality
→ High confidence, Moderate risk category
→ Suitable for clinical use

AI Estimation: 5.8% mortality  
Mathematical: 2.1% mortality
→ Large discrepancy, review extracted data
→ May indicate missing critical variable
```

## Future Improvements

### Planned Enhancements

1. **Full STS Implementation**: Obtain exact coefficients through STS collaboration
2. **More Procedures**: Add combined procedures (AVR+CABG, etc.)
3. **Confidence Scoring**: Algorithmic confidence based on data completeness
4. **Outcome Tracking**: Compare predictions vs actual outcomes
5. **Calibration**: Adjust models based on institutional data

### Research Validation Needed

- Compare against actual STS calculator on test cases
- Validate on institutional patient cohorts
- Measure calibration and discrimination (C-statistic)
- Test inter-rater reliability of data extraction

## References

1. O'Brien SM, et al. "The Society of Thoracic Surgeons 2018 Adult Cardiac Surgery Risk Models" Ann Thorac Surg. 2018
2. Shahian DM, et al. "The Society of Thoracic Surgeons 2008 Cardiac Surgery Risk Models" Ann Thorac Surg. 2009
3. STS Adult Cardiac Surgery Database - https://www.sts.org/registries/sts-adult-cardiac-surgery-database

## License & Disclaimer

This tool is for **research and educational purposes**. 

⚠️ **Medical Disclaimer**: This calculator provides risk estimates that should be used as ONE factor in clinical decision-making. It does not replace physician judgment, institutional protocols, or patient preferences. Always verify extracted data accuracy and use multiple sources of information for surgical decision-making.

**Not for patient exclusion**: Never exclude patients from potentially life-saving surgery based solely on calculated risk scores.

