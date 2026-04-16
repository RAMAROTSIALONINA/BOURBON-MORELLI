import emailService from './emailService';

const authService = {
  // Inscription d'un nouvel utilisateur
  register: async (userData) => {
    try {
      console.log('=== REGISTER USER ===');
      console.log('User data:', JSON.stringify(userData, null, 2));
      
      // Simulation d'inscription (remplacer par vrai appel API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler une réponse réussie
      const mockResponse = {
        success: true,
        message: 'Compte créé avec succès',
        user: {
          id: Date.now(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          role: 'customer',
          createdAt: new Date().toISOString()
        },
        token: 'mock-token-' + Date.now()
      };
      
      console.log('=== REGISTER RESPONSE ===');
      console.log('Response:', JSON.stringify(mockResponse, null, 2));
      
      // Stocker les infos utilisateur
      localStorage.setItem('userToken', mockResponse.token);
      localStorage.setItem('userInfo', JSON.stringify(mockResponse.user));
      
      // Envoyer un email de bienvenue
      try {
        const emailResult = await emailService.sendWelcomeEmail(
          userData.email, 
          `${userData.firstName} ${userData.lastName}`
        );
        console.log('Welcome email result:', emailResult);
      } catch (emailError) {
        console.warn('Erreur envoi email de bienvenue:', emailError);
        // Ne pas bloquer l'inscription si l'email échoue
      }
      
      return mockResponse;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la création du compte',
        error: 'Registration failed'
      };
    }
  },

  // Connexion d'un utilisateur
  login: async (credentials) => {
    try {
      console.log('=== LOGIN USER ===');
      console.log('Credentials:', JSON.stringify(credentials, null, 2));
      
      // Simulation de connexion (remplacer par vrai appel API)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Vérifier les identifiants (simulation - accepter n'importe quel email avec un mot de passe valide)
      if (credentials.email && credentials.password && credentials.password.length >= 6) {
        // Récupérer les infos utilisateur depuis localStorage si elles existent
        const savedUserInfo = localStorage.getItem('userInfo');
        let userInfo = savedUserInfo ? JSON.parse(savedUserInfo) : null;
        
        // Si l'utilisateur s'est déjà inscrit, utiliser ses infos
        if (userInfo && userInfo.email === credentials.email) {
          const mockResponse = {
            success: true,
            message: 'Connexion réussie',
            user: userInfo,
            token: 'mock-token-' + Date.now()
          };
          
          console.log('=== LOGIN RESPONSE ===');
          console.log('Response:', JSON.stringify(mockResponse, null, 2));
          
          // Mettre à jour le token
          localStorage.setItem('userToken', mockResponse.token);
          localStorage.setItem('userInfo', JSON.stringify(mockResponse.user));
          
          return mockResponse;
        } else {
          // Nouvelle connexion avec infos par défaut
          const mockResponse = {
            success: true,
            message: 'Connexion réussie',
            user: {
              id: Date.now(),
              firstName: 'Utilisateur',
              lastName: 'Enregistré',
              email: credentials.email,
              phone: '',
              address: '',
              role: 'customer',
              createdAt: new Date().toISOString()
            },
            token: 'mock-token-' + Date.now()
          };
          
          console.log('=== LOGIN RESPONSE ===');
          console.log('Response:', JSON.stringify(mockResponse, null, 2));
          
          // Stocker les infos utilisateur
          localStorage.setItem('userToken', mockResponse.token);
          localStorage.setItem('userInfo', JSON.stringify(mockResponse.user));
          
          return mockResponse;
        }
      } else {
        // Simuler une erreur d'authentification
        const response = {
          ok: false,
          status: 401,
          data: {
            success: false,
            message: 'Email ou mot de passe incorrect',
            error: 'Invalid credentials'
          }
        };
        if (!response.ok) {
          throw new Error('Invalid credentials');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la connexion',
        error: 'Login failed'
      };
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      console.log('=== LOGOUT USER ===');
      
      // Appeler l'API de déconnexion si disponible
      // await axios.post(`${API_BASE_URL}/auth/logout`, {}, getAuthConfig());
      
      // Nettoyer le stockage local
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      
      console.log('=== LOGOUT SUCCESS ===');
      
      return { success: true, message: 'Déconnexion réussie' };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, nettoyer le stockage local
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la déconnexion',
        error: 'Logout failed'
      };
    }
  },

  // Obtenir les informations de l'utilisateur connecté
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Aucun token trouvé');
      }
      
      console.log('=== GET CURRENT USER ===');
      
      // Simulation de récupération des infos utilisateur
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        console.log('Current user:', user);
        return { success: true, user };
      } else {
        throw new Error('Informations utilisateur non trouvées');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des infos utilisateur:', error);
      // Nettoyer les données invalides
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      throw error.response?.data || { 
        success: false, 
        message: 'Utilisateur non trouvé',
        error: 'User not found'
      };
    }
  },

  // Mettre à jour le profil utilisateur
  updateProfile: async (userData) => {
    try {
      console.log('=== UPDATE PROFILE ===');
      console.log('User data:', JSON.stringify(userData, null, 2));
      
      // Simulation de mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour les infos dans localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const updatedUser = { ...userInfo, ...userData };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      
      console.log('=== UPDATE RESPONSE ===');
      console.log('Updated user:', updatedUser);
      
      return {
        success: true,
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la mise à jour',
        error: 'Update failed'
      };
    }
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    try {
      console.log('=== CHANGE PASSWORD ===');
      
      // Simulation de changement de mot de passe
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('=== PASSWORD CHANGED ===');
      
      return {
        success: true,
        message: 'Mot de passe changé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors du changement de mot de passe',
        error: 'Password change failed'
      };
    }
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    return !!(token && userInfo);
  },

  // Obtenir le token
  getToken: () => {
    return localStorage.getItem('userToken');
  },

  // Obtenir les infos utilisateur
  getUserInfo: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Récupération de mot de passe
  forgotPassword: async (email) => {
    try {
      console.log('=== FORGOT PASSWORD ===');
      console.log('Email:', email);
      
      // Simulation d'envoi d'email de réinitialisation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Vérifier si l'email existe (simulation)
      const savedUserInfo = localStorage.getItem('userInfo');
      let userInfo = savedUserInfo ? JSON.parse(savedUserInfo) : null;
      
      if (userInfo && userInfo.email === email) {
        // Simuler l'envoi d'un email de réinitialisation
        const resetToken = 'reset-token-' + Date.now();
        const resetData = {
          email: email,
          token: resetToken,
          expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 heure
        };
        
        // Stocker temporairement les données de réinitialisation
        localStorage.setItem('passwordReset', JSON.stringify(resetData));
        
        // Créer le lien de réinitialisation
        const resetLink = `${window.location.origin}/reset-password?token=${resetToken}`;
        
        // Envoyer l'email de réinitialisation
        const emailResult = await emailService.sendPasswordResetEmail(email, resetLink);
        
        console.log('=== RESET EMAIL SENT ===');
        console.log('Reset token:', resetToken);
        console.log('Email result:', emailResult);
        
        return {
          success: true,
          message: emailResult.success ? 
            'Un email de réinitialisation a été envoyé à votre adresse email.' :
            'Un lien de réinitialisation a été généré (mode démo).',
          resetToken: resetToken,
          resetLink: resetLink,
          emailSent: emailResult.success
        };
      } else {
        // Pour des raisons de sécurité, ne pas révéler si l'email existe ou non
        console.log('Email non trouvé, mais message de succès envoyé pour sécurité');
        
        return {
          success: true,
          message: 'Si cet email existe dans notre système, un lien de réinitialisation a été envoyé.'
        };
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du mot de passe:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de l\'envoi du lien de réinitialisation',
        error: 'Forgot password failed'
      };
    }
  },

  // Réinitialiser le mot de passe
  resetPassword: async (token, newPassword) => {
    try {
      console.log('=== RESET PASSWORD ===');
      console.log('Token:', token);
      
      // Simulation de réinitialisation de mot de passe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérifier le token de réinitialisation
      const resetData = localStorage.getItem('passwordReset');
      if (!resetData) {
        const error = new Error('Token de réinitialisation invalide ou expiré');
        throw error;
      }
      
      const resetInfo = JSON.parse(resetData);
      
      // Vérifier si le token est valide et non expiré
      if (resetInfo.token !== token || new Date(resetInfo.expiresAt) < new Date()) {
        localStorage.removeItem('passwordReset');
        const error = new Error('Token de réinitialisation invalide ou expiré');
        throw error;
      }
      
      // Mettre à jour le mot de passe de l'utilisateur
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (userInfo.email === resetInfo.email) {
        // Dans une vraie application, le mot de passe serait hashé et stocké en base de données
        console.log('Password updated for user:', resetInfo.email);
        
        // Nettoyer les données de réinitialisation
        localStorage.removeItem('passwordReset');
        
        console.log('=== PASSWORD RESET SUCCESS ===');
        
        return {
          success: true,
          message: 'Mot de passe réinitialisé avec succès'
        };
      } else {
        const error = new Error('Utilisateur non trouvé');
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la réinitialisation du mot de passe',
        error: 'Reset password failed'
      };
    }
  }
};

export default authService;
