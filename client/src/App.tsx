import './App.css';
import Register from './Register';
import Login from './Login';
import { Routes, Route, Navigate } from 'react-router-dom';
import Todos from './Todos';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>

    </div>
  );
}

export default App;
