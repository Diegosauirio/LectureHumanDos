const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const SECRET_KEY = 'your_secret_key';

app.use(bodyParser.json());
app.use(cors());

// Conexión a MongoDB
mongoose.connect('mongodb+srv://diegosaurio:flores11jk@lecturehuman.dyncgzp.mongodb.net/LectureHuman?retryWrites=true&w=majority&appName=LectureHuman')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Definición de Schemas y modelos de Mongoose
const FormSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  fullName: String,
  birthdate: Date,
  phone: String,
});
const Form = mongoose.model('Form', FormSchema);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  birthdate: { type: Date, required: true },
  phone: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// Endpoint para registrar un nuevo usuario
app.post('/register', async (req, res) => {
  const { username, email, password, fullName, birthdate, phone } = req.body;

  if (!username || !email || !password || !fullName || !birthdate || !phone) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario y correo ya existen' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, fullName, birthdate, phone });
    await user.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar usuario', error });
  }
});

// Endpoint para iniciar sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({ message: 'Inicio de sesión exitoso', token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

// Endpoint para consultar datos de usuario por email
app.get('/userdata/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error al consultar datos de usuario:', error);
    res.status(500).json({ message: 'Error al consultar datos de usuario', error });
  }
});

// Endpoint para eliminar usuario por email
app.delete('/deleteuser/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOneAndDelete({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
