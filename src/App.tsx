import { Routes, Route } from 'react-router';
import { useState } from 'react';
import Intro from './pages/Intro';
import Home from './pages/Home';

export type PageType = 'shop' | 'community' | 'profile' | 'admin';

function App() {
  const [entered, setEntered] = useState(false);

  return (
    <Routes>
      <Route path="*" element={
        entered ? (
          <Home />
        ) : (
          <Intro onEnter={() => setEntered(true)} />
        )
      } />
    </Routes>
  );
}

export default App;
