// const express = require('express');
// const bcrypt = require('bcrypt');
// const User = require('../models/User');
// const router = express.Router();

// // Rota para personalizar perfil após se unir ao Teem
// router.post('/customize-profile', async (req, res) => {
//     const { userId, username, password } = req.body;

//     if (!userId || !username || !password) {
//         return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
//     }

//     try {
//         // Verificar se o username é único
//         const existingUsername = await User.findOne({ username });
//         if (existingUsername) {
//             return res.status(400).json({ message: 'Este nome de usuário já está em uso.' });
//         }

//         // Hash da nova senha
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Atualizar o usuário com os dados personalizados
//         const updatedUser = await User.findByIdAndUpdate(
//             userId,
//             { username, password: hashedPassword },
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ message: 'Usuário não encontrado.' });
//         }

//         res.status(200).json({
//             message: 'Perfil personalizado com sucesso.',
//             user: {
//                 id: updatedUser._id,
//                 username: updatedUser.username,
//                 email: updatedUser.email
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Erro ao personalizar perfil.', error });
//     }
// });

// module.exports = router;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Rota de login para entrar no Teem
// router.post('/login', async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
//     }

//     try {
//         // Verificar se o usuário existe
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'Usuário não encontrado.' });
//         }

//         // Verificar senha
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: 'Senha incorreta.' });
//         }

//         res.status(200).json({
//             message: 'Login bem-sucedido!',
//             user: {
//                 id: user._id,
//                 username: user.username,
//                 teemId: user.teemId
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ message: 'Erro ao realizar login.', error });
//     }
// });

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// frontend/src/App.js
// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import Home from './pages/Home';
// import CreateTeem from './pages/CreateTeem';
// import JoinTeem from './pages/JoinTeem';
// import CustomizeProfile from './pages/CustomizeProfile';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/create-teem" element={<CreateTeem />} />
//         <Route path="/join-teem" element={<JoinTeem />} />
//         <Route path="/customize-profile" element={<CustomizeProfile />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// frontend/src/pages/CreateTeem.js
// import React, { useState } from 'react';
// import axios from 'axios';

// function CreateTeem() {
//   const [teemName, setTeemName] = useState('');
//   const [email, setEmail] = useState('');
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('http://localhost:5000/api/teems/create', {
//         name: teemName,
//         email,
//         username,
//         password
//       });
//       console.log('Teem criado:', response.data);
//     } catch (error) {
//       console.error('Erro ao criar teem:', error);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input type="text" placeholder="Nome do Teem" value={teemName} onChange={(e) => setTeemName(e.target.value)} required />
//       <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
//       <input type="text" placeholder="Nome de Usuário" value={username} onChange={(e) => setUsername(e.target.value)} required />
//       <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
//       <button type="submit">Criar Teem</button>
//     </form>
//   );
// }

// export default CreateTeem;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// frontend/src/pages/JoinTeem.js
// import React, { useState } from 'react';
// import axios from 'axios';

// function JoinTeem() {
//   const [teemId, setTeemId] = useState('');
//   const [email, setEmail] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('http://localhost:5000/api/teems/join', {
//         teemId,
//         email
//       });
//       console.log('Unido ao Teem:', response.data);
//     } catch (error) {
//       console.error('Erro ao se unir ao teem:', error);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input type="text" placeholder="ID do Teem" value={teemId} onChange={(e) => setTeemId(e.target.value)} required />
//       <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
//       <button type="submit">Unir-se ao Teem</button>
//     </form>
//   );
// }

// export default JoinTeem;
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// frontend/src/pages/CustomizeProfile.js
// import React, { useState } from 'react';
// import axios from 'axios';

// function CustomizeProfile() {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.put('http://localhost:5000/api/users/customize-profile', {
//         username,
//         password
//       });
//       console.log('Perfil atualizado:', response.data);
//     } catch (error) {
//       console.error('Erro ao atualizar perfil:', error);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input type="text" placeholder="Novo Nome de Usuário" value={username} onChange={(e) => setUsername(e.target.value)} required />
//       <input type="password" placeholder="Nova Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
//       <button type="submit">Salvar Alterações</button>
//     </form>
//   );
// }

// export default CustomizeProfile;

//~~~~~~~~~~~~~~~~~~~~~~~~//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// // Rota para registro de usuário
// router.post('/register', async (req, res) => {
//     const { username, email, password } = req.body;

//     if (!username || !email || !password) {
//         return res.status(400).json({ error: 'Preencha todos os campos' });
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//         return res.status(400).json({ error: 'Email inválido' });
//     }

//     try {
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: 'Usuário já existe' });
//         }
        
//         const user = new User({ username, email, password});
//         await user.save();

//         res.status(201).json({ message: 'Usuário criado com sucesso' });
//     } catch (error) {
//         res.status(500).json({ message: 'Erro ao criar usuário' });
//     }
// });