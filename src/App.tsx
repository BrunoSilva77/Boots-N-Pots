import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Splash from './pages/Splash';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Home from './pages/Home';
import Search from './pages/Search';
import Camera from './pages/Camera';
import Collection from './pages/Collection';
import Profile from './pages/Profile';
import PlantDetail from './pages/PlantDetail';
import './AnimatedLayout.css';

const menuOrder = ['/', '/welcome', '/login', '/home', '/search', '/camera', '/collection', '/profile', '/plant-detail'];

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');
  const [slideDirection, setSlideDirection] = useState('none');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      const prevIndex = menuOrder.indexOf(prevPath.current);
      const currIndex = menuOrder.indexOf(location.pathname);
      
      let direction = 'none';
      if (prevIndex !== -1 && currIndex !== -1) {
        if (prevIndex < currIndex) {
          direction = 'left';
        } else if (prevIndex > currIndex) {
          direction = 'right';
        }
      }

      setSlideDirection(direction);
      setTransitionStage('exit');

      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('enter');
        prevPath.current = location.pathname;
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <div className={`animated-container slide-${slideDirection} ${transitionStage}`}>
      <Routes location={displayLocation}>
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/plant-detail" element={<PlantDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AnimatedRoutes />
    </HashRouter>
  );
}

export default App;
