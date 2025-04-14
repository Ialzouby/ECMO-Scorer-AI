import { useState } from "react";
import axios from "axios";
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
                cols={80}
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
                cols={80}
              />
            </label>
          </div>
          <div className="divider"></div>
          <button onClick={handleSubmit} className="green-button">
            Analyze
          </button>

          {result && <div className="mt-6 p-4 border rounded bg-gray-100 whitespace-pre-wrap">{result}</div>}
        </div>
      </CenteredContainer>
    </PageContainer>
  );
}
