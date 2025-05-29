import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import axios from 'axios';

// Configura o Axios para incluir credenciais em todas as requisições
axios.defaults.withCredentials = true;

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupMessage, setSetupMessage] = useState('');
  const [systemStatus, setSystemStatus] = useState({
    checked: false,
    isConfigured: false
  });

  // Verificar status do sistema
  useEffect(() => {
    const checkSystem = async () => {
      try {
        // Verificar saúde do sistema
        await axios.get('/api/health');
        
        // Verificar se já existe admin configurado
        const setupStatus = await axios.get('/api/setup/status');
        setSystemStatus({
          checked: true,
          isConfigured: setupStatus.data.isConfigured
        });

        // Verificar se usuário está logado
        try {
          const userResponse = await axios.get('/api/auth/me');
          if (userResponse.data) {
            setUser(userResponse.data);
          }
        } catch (authErr) {
          // Ignora erro de autenticação pois é esperado quando não está logado
          if (authErr.response?.status !== 401) {
            console.error('Erro ao verificar autenticação:', authErr);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sistema:', err);
        setError('Erro ao conectar com o servidor');
      }
    };
    
    checkSystem();
  }, [setUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSettingUp) {
        // Configurar o admin inicial
        const response = await axios.post('/api/setup', { username, password });
        setSetupMessage(response.data.message);
        setIsSettingUp(false);
        // Atualizar status do sistema após configuração
        setSystemStatus(prev => ({ ...prev, isConfigured: true }));
      } else {
        // Login normal
        const response = await axios.post('/api/auth/login', { username, password });
        setUser(response.data);
      }
    } catch (err) {
      console.error('Erro:', err);
      if (err.response) {
        setError(err.response.data?.message || err.response.data?.error || 'Operação falhou');
      } else if (err.request) {
        setError('Servidor não respondeu. Verifique sua conexão.');
      } else {
        setError('Erro ao processar requisição');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSetup = () => {
    setIsSettingUp(!isSettingUp);
    setError('');
    setSetupMessage('');
  };

  return (
    <Container>
      <Card className="login-form">
        <Card.Body>
          <Card.Title className="text-center mb-4">
            <h2>Wiki de Problemas Técnicos</h2>
            <p className="text-muted">Assistência Eletrônica</p>
          </Card.Title>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {setupMessage && <Alert variant="success">{setupMessage}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>{isSettingUp ? 'Nome do Administrador' : 'Nome de Usuário'}</Form.Label>
              <Form.Control
                type="text"
                placeholder={isSettingUp ? "Digite o nome do administrador" : "Digite seu nome de usuário"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={isSettingUp ? 3 : undefined}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="password">
              <Form.Label>Senha</Form.Label>
              <Form.Control
                type="password"
                placeholder={isSettingUp ? "Digite a senha do administrador" : "Digite sua senha"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSettingUp ? 6 : undefined}
              />
              {isSettingUp && (
                <Form.Text className="text-muted">
                  A senha deve ter pelo menos 6 caracteres
                </Form.Text>
              )}
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Carregando...' : (isSettingUp ? 'Configurar Sistema' : 'Entrar')}
              </Button>
            </div>
          </Form>
          
          {systemStatus.checked && !systemStatus.isConfigured && !isSettingUp && (
            <div className="text-center mt-3">
              <Button variant="link" onClick={toggleSetup}>
                Configurar Sistema
              </Button>
            </div>
          )}
          
          {isSettingUp && (
            <div className="text-center mt-3">
              <Button variant="link" onClick={toggleSetup}>
                Voltar ao Login
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login; 