import React from 'react';
import { Link } from 'react-router-dom';
import './navbar.css';

function Navbar() {
    return (
        <nav>
        <Link to="/">ECMO Scorer</Link>
        <Link to="/ecmo/dropdown">Dropdown Scoring</Link>
        <Link to="/ecmo/notes">Notes Scoring</Link>
        <Link to="/ecmo/fancy-notes">Fancy Notes Scoring</Link>
      </nav>
    );
  }

export default Navbar;

// return (
//     <nav style={{ display: 'flex', padding: '1rem', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
//       <Link to="/" style={{ marginRight: '1rem', fontWeight: 'bold', textDecoration: 'none', color: '#007bff' }}>
//         ECMO Scorer
//       </Link>
//       <Link to="/ecmo/dropdown" style={{ marginRight: '1rem', textDecoration: 'none', color: '#007bff' }}>
//         Dropdown Scoring
//       </Link>
//       <Link to="/ecmo/notes" style={{ marginRight: '1rem', textDecoration: 'none', color: '#007bff' }}>
//         Notes Scoring
//       </Link>
//       <Link to="/ecmo/fancy-notes" style={{ textDecoration: 'none', color: '#007bff' }}>
//         Fancy Notes Scoring
//       </Link>
//     </nav>
//   );