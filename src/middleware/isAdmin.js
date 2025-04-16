const User = require('../models/User'); // Modelo do usuário

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id); // Pegar ID do usuário autenticado
        if (user && user.role === 'admin') {


            
            return next(); // Continuar se for admin
        } else {
            
            return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar essa ação.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro na verificação de permissões.' });
    }
};

module.exports = isAdmin;
