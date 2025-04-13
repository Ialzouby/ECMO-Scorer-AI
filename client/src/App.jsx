import { Routes, Route } from 'react-router-dom';
import DropdownScoring from './pages/DropdownScoring';
import NotesScoring from './pages/NotesScoring';
import FancyNotesScoring from './pages/FancyNotesScoring';
import Navbar from './components/navbar';

function App() {
  return (
    <>
      <Navbar />
      <div style={{ marginTop: '4rem' }}>
        <Routes>
          <Route path="/" element={<div>🏠 ECMO Home</div>} />
          <Route path="/ecmo/dropdown" element={<DropdownScoring />} />
          <Route path="/ecmo/notes" element={<NotesScoring />} />
          <Route path="/ecmo/fancy-notes" element={<FancyNotesScoring />} />
          <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
      </div>
    </>
  );
}

export default App;
