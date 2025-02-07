import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Users from './pages/Users.jsx';
import ShogiTest from './pages/ShogiTest.jsx';
// ... 残りのコードは同じ 

const App = () => {
  return (
    <div>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users" element={<Users />} />
        <Route path="/shogi" element={<ShogiTest />} />
      </Routes>
    </div>
  );
};

export default App; 