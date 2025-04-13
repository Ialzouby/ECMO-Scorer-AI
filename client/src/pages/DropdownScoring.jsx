import { useState } from "react";
import axios from "axios";

export default function DropdownScoring() {
  const [form, setForm] = useState({
    symptom: "",
    vascular: "",
    anatomic: "",
    hemodynamic: "",
    notes: ""
  });

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api/ecmo-score`, {
        mode: "dropdown",
        data: form,
      });
      setResult(res.data.response);
    } catch (err) {
      setResult("Error: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">ECMO Score (Dropdown Mode)</h2>

      <Dropdown label="Symptom Severity" name="symptom" value={form.symptom} onChange={handleChange} options={[
        "Head/neck/facial swelling only (1)",
        "Orthopnea, dysphagia, cough (2)",
        "Dyspnea at rest, stridor, voice changes (3)",
        "Altered mental status, visual changes (4)",
        "Laryngeal edema, stupor, coma (5)"
      ]} />

      <Dropdown label="Vascular Congestion" name="vascular" value={form.vascular} onChange={handleChange} options={[
        "Mild narrowing (<75%) with patent azygos (0)",
        "Severe stenosis (≥90%) with patent azygos, anterograde flow (1)",
        "SVC occlusion with retrograde azygos collateral flow (2)",
        "SVC occlusion with mammary/epigastric collaterals (3)",
        "SVC occlusion with no visible collaterals (4)"
      ]} />

      <Dropdown label="Anatomic Compression Risk" name="anatomic" value={form.anatomic} onChange={handleChange} options={[
        "Tumor compressing <50% of SVC (1)",
        "Tumor compressing ≥50% of SVC (2)",
        "Tracheal or bronchial compression (3)",
        "Left atrial or pulmonary artery compression (4)"
      ]} />

      <Dropdown label="Hemodynamic or Respiratory Instability" name="hemodynamic" value={form.hemodynamic} onChange={handleChange} options={[
        "Stable, no oxygen requirement (0)",
        "Mild hypoxia (SpO₂ 90–94%) or tachypnea (1)",
        "SpO₂ <90% or mild hypotension (2)",
        "Requires BiPAP, vasopressors, or desaturates when supine (3)"
      ]} />

      <textarea
        name="notes"
        placeholder="Additional notes (optional)"
        value={form.notes}
        onChange={handleChange}
        className="w-full p-2 border rounded mb-4"
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Evaluating..." : "Evaluate"}
      </button>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-100 whitespace-pre-wrap">
          <h3 className="font-semibold mb-2">GPT Recommendation:</h3>
          {result}
        </div>
      )}
    </div>
  );
}

function Dropdown({ label, name, value, onChange, options }) {
  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border rounded p-2"
      >
        <option value="">-- Select --</option>
        {options.map((opt, idx) => (
          <option key={idx} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
