import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Predictor from './pages/Predictor';
import Stations from './pages/Stations';
import Zones from './pages/Zones';
import Model from './pages/Model';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict" element={<Predictor />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/model" element={<Model />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
