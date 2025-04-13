import { useState } from "react";
import axios from "axios";

export default function NotesScoring() {
  const [history, setHistory] = useState("Patient presents with shortness of breath and swelling in face.");
  const [exam, setExam] = useState("Tracheal deviation noted. Oxygen saturation at 88%.");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await axios.post("http://localhost:5000/api/ecmo-score", {
        mode: "notes",
        data: { history, exam }
      });
      setResult(res.data.response);
    } catch (err) {
      console.error("❌ API error:", err);
      setError("Failed to fetch GPT response. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">ECMO Score (Note Analysis)</h2>

      <textarea
        placeholder="Paste History of Present Illness From Cardiothoracic Surgery Admission Note"
        value={history}
        onChange={(e) => setHistory(e.target.value)}
        className="w-full p-2 border rounded mb-3"
        rows={5}
      />
      <textarea
        placeholder="Paste Physical Exam From Cardiothoracic Surgery Admission Note"
        value={exam}
        onChange={(e) => setExam(e.target.value)}
        className="w-full p-2 border rounded mb-3"
        rows={5}
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error && <div className="mt-4 text-red-600">{error}</div>}

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-100 whitespace-pre-wrap">
          <h3 className="font-semibold mb-2">GPT Output:</h3>
          {result}
        </div>
      )}
    </div>
  );
}
