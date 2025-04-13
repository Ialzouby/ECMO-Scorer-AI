import { Routes, Route } from 'react-router-dom';
import DropdownScoring from './pages/DropdownScoring';
import NotesScoring from './pages/NotesScoring';

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>🏠 ECMO Home</div>} />
      <Route path="/ecmo/dropdown" element={<DropdownScoring />} />
      <Route path="/ecmo/notes" element={<NotesScoring />} />
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
}

export default App;
