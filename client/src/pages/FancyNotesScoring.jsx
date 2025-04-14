import { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown"; // Import react-markdown
import PageContainer from "../components/PageContainer";
import CenteredContainer from "../components/CenteredContainer";
import Title from "../components/Title";
import "./FancyNotesScoring.css";

export default function FancyNotesScoring() {
  const [history, setHistory] = useState("");
  const [exam, setExam] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async () => {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/ecmo-score`, {
      mode: "notes",
      data: { history, exam },
    });
    setResult(res.data.response);
  };

  const handleSampleSubmit = async () => {
    
  }

  const sampleHistory = "patient presents with shortness of breath and swelling in the face."
  const sampleExam = "Tracheal deviation noted. Oxygen saturation at 88%."
  const sampleResult = "To assess ECMO timing using the ECMO-SVC scoring system, I'll need specific clinical data from the admission note relevant to the four scoring domains. Since I don't have detailed information, I'll guide you on what to look for:\n\n### ECMO-SVC Scoring Domains\n\n1. **Severity of Illness**: Assess based on parameters such as blood gas analysis, presence of multi-organ failure, and severity of ARDS.\n2. **Ventilatory Status**: Evaluate based on ventilatory support requirements, compliance, and oxygenation levels.\n3. **Circulatory Status**: Determine based on cardiovascular stability, presence of shock, or requirement for inotropes/vasopressors.\n4. **Cause of Respiratory Failure**: Identify whether the underlying cause is reversible or if there's chronicity involved.\n\n### Steps for Assessment\n\n1. **Extract Findings**: Identify clinical details or lab results under each of the four domains.\n   \n2. **Score Each Domain**: Assign scores based on the ECMO-SVC criteria for the specific findings. Each domain is typically scored, with higher scores indicating increased need or urgency for ECMO.\n\n3. **Compute ECMO-SVC Score**: Sum the scores from all four domains for a total score.\n\n4. **Recommend Timing**: \n   - **None**: Typically when the score is low, indicating no current need for ECMO.\n   - **Standby**: A situation where ECMO might be needed if the condition slightly worsens.\n   - **Elective**: Indicates a need for planned ECMO initiation based on current clinical status.\n   - **Rescue**: Immediate ECMO initiation due to critical illness or rapid deterioration.\n\n### Explanation of Recommendation\n\n- **Detailed Observations**: Based on your extracted findings, explain the assigned scores.\n- **Interpretation of Individual Scores**: Justify why those scores align with clinical observations.\n- **Overall ECMO-SVC Score**: State the sum and what it indicates regarding ECMO timing.\n- **Clinical Judgment**: Use clinical reasoning to recommend none, standby, elective, or rescue ECMO.\n\nIf you provide specific clinical details or lab results, I can help you assign the scores to each domain and recommend ECMO timing based on the ECMO-SVC scoring system."

  return (
    <PageContainer>
      <CenteredContainer>
        <div>
          <Title text="ECMO Score (Note Analysis)" />

          <div className="textarea-container">
            <label className="block mb-2 font-bold text-gray-700">
              Patient History
              <textarea
                placeholder="what is the patient's history like?"
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                className="w-full p-2 border rounded mb-3"
                rows={6}
                cols={100}
              />
            </label>
            <div className="divider"></div>
            <label className="block mb-2 font-bold text-gray-700">
              Physical Exam
              <textarea
                placeholder="Patient's Physical Exam results "
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                className="w-full p-2 border rounded mb-3"
                rows={6}
                cols={100}
              />
            </label>
          </div>
          <div className="divider"></div>
          <div className="button-container">
            <button onClick={handleSubmit} className="green-button">
              Analyze
            </button>
            <button
              onClick={() => {
                setHistory(sampleHistory);
                setExam(sampleExam);
                setResult(sampleResult);
              }}
              className="blue-button ml-2"
            >
              Sample Response
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 border rounded bg-gray-100 whitespace-pre-wrap">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          )}
        </div>
      </CenteredContainer>
    </PageContainer>
  );
}
