const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_ticket', (ticketId) => {
    socket.join(`ticket_${ticketId}`);
    console.log(`User ${socket.id} joined ticket_${ticketId}`);
  });

  socket.on('leave_ticket', (ticketId) => {
    socket.leave(`ticket_${ticketId}`);
    console.log(`User ${socket.id} left ticket_${ticketId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${socket.id} joined user_${userId}`);
  });

  socket.on('join_staff', () => {
    socket.join('staff');
    console.log(`User ${socket.id} joined staff room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.post('/notify/ticket', (req, res) => {
  const { ticket_id, type, message } = req.body;

  if (!ticket_id || !type || !message) {
    return res.status(400).json({
      success: false,
      error: 'ticket_id, type and message are required',
    });
  }

  io.to(`ticket_${ticket_id}`).emit('ticket_notification', {
    ticket_id,
    type,
    message,
  });

  return res.json({
    success: true,
  });
});

app.post('/notify/user', (req, res) => {
  const { user_id, type, message, ticket_id } = req.body;

  if (!user_id || !type || !message) {
    return res.status(400).json({
      success: false,
      error: 'user_id, type and message are required',
    });
  }

  io.to(`user_${user_id}`).emit('global_notification', {
    user_id,
    ticket_id,
    type,
    message,
  });

  return res.json({
    success: true,
  });
});

app.post('/notify/staff', (req, res) => {
  const { type, message, ticket_id } = req.body;

  if (!type || !message) {
    return res.status(400).json({
      success: false,
      error: 'type and message are required',
    });
  }

  io.to('staff').emit('global_notification', {
    ticket_id,
    type,
    message,
  });

  return res.json({
    success: true,
  });
});

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Realtime server running on http://localhost:${PORT}`);
});