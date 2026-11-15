import React from 'react';
import FakeGoogleSlide from './components/FakeGoogleSlide';

// Interactive demo: a Google search with the Wärme-Pakt ad, clicking it opens the EnergiePlus landing page
// (address check, cost comparison, Nachbarschaft, Genossenschaft, member portal). Fills the whole window.
export default function App() {
  return (
    <div className="app-shell">
      <FakeGoogleSlide />
    </div>
  );
}
