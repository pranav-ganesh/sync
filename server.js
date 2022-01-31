const express = require('express');
const app = express(); 
const server = require('http').Server(app);
const { ExpressPeerServer } = require('peer');
const peerBackend = ExpressPeerServer(server, {
  debug: true
});
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid');

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, nameOfUser) => {
        socket.join(roomId) 
        socket.to(roomId).emit('new-connection', userId)
        socket.on('message', (message, username) => {
            io.to(roomId).emit('createMessage', message, username)
        }); 
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId, nameOfUser)
        }) 
        socket.on("removeVid", (vid) => {
            socket.to(roomId).emit('stopShare', vid)
        }) 
        socket.on('new_participant', username => {
            socket.to(roomId).emit('add_new_participant', username)
        })
        socket.on('clarity_status', data => {
            socket.to(roomId).emit('confused_or_clear', data)
        })
        socket.on('confused_count', (d1, d2) => {
            socket.to(roomId).emit('incrementor', d1, d2)
        })
        socket.on('user_joined', data => {
            socket.to(roomId).emit('join', data)
        })
        socket.on('user_left', (data, data2) => {
            socket.to(roomId).emit('left', data, data2)
        })
        socket.on('hide_videos', data => {
            socket.to(roomId).emit('hide', data)
        })
        socket.on('show_videos', data => {
            socket.to(roomId).emit('show', data)
        })
    })
})

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs', peerBackend); 
app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})
app.get('/:outline', (req, res) => {
    res.render('outline', { roomId: req.params.room })
})

// process.env.PORT||3030
server.listen(process.env.PORT||3030);
