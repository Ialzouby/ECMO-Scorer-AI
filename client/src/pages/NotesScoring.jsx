import { useState } from "react";
import axios from "axios";

export default function NotesScoring() {
  const [history, setHistory] = useState("");
  const [exam, setExam] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async () => {
    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/ecmo-score`, {
      mode: "notes",
      data: { history, exam }
    });
    setResult(res.data.response);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">ECMO Score (Note Analysis)</h2>

      <textarea
        placeholder="Paste History section"
        value={history}
        onChange={(e) => setHistory(e.target.value)}
        className="w-full p-2 border rounded mb-3"
        rows={6}
      />
      <textarea
        placeholder="Paste Physical Exam section"
        value={exam}
        onChange={(e) => setExam(e.target.value)}
        className="w-full p-2 border rounded mb-3"
        rows={6}
      />
      <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">Analyze</button>

      {result && <div className="mt-6 p-4 border rounded bg-gray-100 whitespace-pre-wrap">{result}</div>}
    </div>
  );
}
