import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import SurveyCreate from './pages/SurveyCreate';
import SurveyFill from './pages/SurveyFill';
import SurveyStats from './pages/SurveyStats';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="container">
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
              <h1>📋 在线问卷系统</h1>
            </Link>
            <nav>
              <Link to="/">问卷列表</Link>
              <Link to="/create">创建问卷</Link>
            </nav>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<SurveyCreate />} />
            <Route path="/edit/:id" element={<SurveyCreate />} />
            <Route path="/survey/:id" element={<SurveyFill />} />
            <Route path="/stats/:id" element={<SurveyStats />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
