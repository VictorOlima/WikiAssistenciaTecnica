import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Home from './pages/Home';
import ProblemDetail from './pages/ProblemDetail';
import CreateProblem from './pages/CreateProblem';
import EditProblem from './pages/EditProblem';
import UserManagement from './pages/UserManagement';
import CategoryList from './pages/CategoryList';
import TagList from './pages/TagList';
import axios from 'axios';

// Configurar o Axios globalmente
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:5002'
  : 'http://localhost:5002';

// Adicionar interceptors para tratamento de erros
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.log('Erro na resposta:', {
        status: error.response.status,
        data: error.response.data
      });
      
      // Redirecionar para login em caso de erro de autenticação
      if (error.response.status === 401) {
        console.log('Sessão expirada ou usuário não autenticado');
      }
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Função para verificar se é um dispositivo móvel
  const isMobile = () => {
    return window.innerWidth <= 768;
  };

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
      } catch (err) {
        console.log('Usuário não autenticado, redirecionando para login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
    
    // Verificar se é um dispositivo móvel e recolher o sidebar automaticamente
    if (isMobile()) {
      setSidebarCollapsed(true);
    }
    
    // Adicionar evento de redimensionamento para ajustar o sidebar quando o tamanho da tela muda
    const handleResize = () => {
      // Se for móvel, recolhe o sidebar
      setSidebarCollapsed(isMobile());
    };
    
    window.addEventListener('resize', handleResize);
    
    // Limpeza do evento ao desmontar o componente
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Carregando...</div>;
  }

  // Verificar se o usuário não está autenticado
  if (!user) {
    return <Login setUser={setUser} />;
  }

  return (
    <Router>
      <div className="d-flex">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
          user={user} 
          onLogout={handleLogout}
        />
        <div className={`content ${sidebarCollapsed ? 'content-collapsed' : ''}`}>
          <Container fluid className="py-3">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/problem/:id" element={<ProblemDetail />} />
              <Route 
                path="/create-problem" 
                element={
                  ['admin', 'tecnico'].includes(user.role) 
                    ? <CreateProblem /> 
                    : <Navigate to="/" />
                } 
              />
              <Route 
                path="/edit-problem/:id" 
                element={
                  ['admin', 'tecnico'].includes(user.role) 
                    ? <EditProblem /> 
                    : <Navigate to="/" />
                } 
              />
              <Route 
                path="/users" 
                element={
                  user.role === 'admin' 
                    ? <UserManagement /> 
                    : <Navigate to="/" />
                } 
              />
              <Route path="/categories" element={<CategoryList />} />
              <Route path="/tags" element={<TagList />} />
            </Routes>
          </Container>
        </div>
      </div>
    </Router>
  );
}

export default App; 