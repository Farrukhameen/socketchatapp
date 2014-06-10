var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.get('/', function(req, res){
  res.sendfile('./public/index.html');
});

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var games = {};

io.on('connection', function (socket) {
 var  checkwinner = function(x,y,name){
  if(games[name].playground[0][y] == games[name].playground[1][y] && games[name].playground[1][y] == games[name].playground[2][y]){
    return 'win';
  }
  else if(games[name].playground[x][0] == games[name].playground[x][1] && games[name].playground[x][1] == games[name].playground[x][2]){
    return 'win';
  }
  if(x == y){  
    if(games[name].playground[0][0] == games[name].playground[1][1] && games[name].playground[1][1] == games[name].playground[2][2]){
      return 'win';
    }
  }
  if(x+y == 2){
    if(games[name].playground[0][2] == games[name].playground[1][1] && games[name].playground[1][1] == games[name].playground[2][0]){
      return 'win';
    }
  }
  return 'continue';
 }
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    socket.broadcast.emit('new message', {
      nick: socket.username,
      msg: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
  	    var info = {
    	username: username,
    	id : socket.id
    }
    usernames[username] = info;
    // we store the username in the socket session for this client
    socket.username = username;
    var socketid = usernames[username].id;

    // add the client's username to the global list
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

    //add user to connection list
    socket.broadcast.emit('new connection', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  //private msg handling
  socket.on('send private',function(data){
    socket.to(usernames[data.target].id).emit('receive private',data);
  });

  //create private room on request
  socket.on('create private',function(data){
    var roomname = data.room[0]+data.room[1];
    socket.join(roomname);
    socket.to(roomname).emit('welcome',{
      username: roomname,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });

  //game invite
  socket.on('game invite',function(data){
    socket.to(usernames[data.challenged].id).emit('send invite',data);
  });

  //get online users list for new connection
  socket.on('get users',function(){
  	socket.emit('get users',usernames);
  });

  //challenge declined
  socket.on('challenge declined',function(data){
    socket.broadcast.emit('new message',{
      nick : data.challenger,
      msg : 'challenged '+data.challenged+' but he chickened out'
    });
    socket.to(usernames[data.challenger].id).emit('challenge declinde',data);
  });

  //challenge accepted
  socket.on('challenge accepted',function(data){
    socket.broadcast.emit('new message',{
      nick : data.challenger,
      msg : 'challenged '+data.challenged+' and he accepted it'
    });
    socket.to(usernames[data.challenger].id).emit('challenge accepted',data);
    var info = {
      status : 0,
      playground : [['','',''],['','',''],['','','']]
    }
    games[data.challenger+data.challenged] = info;
  });

  //game move
  socket.on('game move',function(data){
    games[data.name].status += 1;
    var x = data.move[0];
    var y = data.move[1];
    games[data.name].playground[x][y]=data.value;
    socket.to(usernames[data.target].id).emit('game move',data);
    var check = checkwinner(x,y,data.name);
    if(check == 'win'){
      socket.emit('game win',{
        winner : data.current,
      });
      socket.to(usernames[data.target].id).emit('game lost');
    }
  });
});