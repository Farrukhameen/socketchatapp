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

 var  checkwinner = function(move,name,value){
  var x = parseInt(move[1]);
  var y = parseInt(move[0]);
  var counter = [1,1,1,1];
  var xmax = games[name].size[0];
  var ymax = games[name].size[1];
  var play = games[name].playground;/*
    console.log('play ground '+games[name].playground);
  console.log("our move "+move);
  console.log('move value' + value);*/

  //0 degree traversing
  for(var i = x+1; i< xmax; i++){/*
    console.log(0+'degree loop');
    console.log(i);*/
    if(play[y][i] == value){
      counter[0]++;
      if(counter[0]== 3){
        return 'win';
      }/*
    console.log('latest counter value = '+counter[0]);*/
    }
    else{/*
    console.log('latest counter value = '+counter[0]);*/
      break;
    }
  }

  //270 degree
  for(var i = y+1; i < ymax; i++){/*
        console.log(270+'degree loop');
    console.log(i);*/
    if(play[i][x] == value){
      counter[1]++;
      if(counter[1] == 3){
        return 'win';
      }/*
    console.log('latest counter value = '+counter[1]);*/
    }
    else{/*
    console.log('latest counter value = '+counter[1]);*/
      break;
    }
  }

  //180 degree
  for(var i = x-1; i>=0; i--){/*
        console.log(180+'degree loop');
    console.log(i);*/
    if(play[y][i] == value){
      counter[0]++;
      if(counter[0] == 3){
        return 'win';
      }/*
    console.log('latest counter value = '+counter[0]);*/
    }
    else{/*
    console.log('latest counter value = '+counter[0]);*/
      break;
    }
  }

  //90 degree
  for(var i = y-1; i >=0; i--){/*
        console.log(90+'degree loop');
    console.log(i);*/
    if(play[i][x] == value){
      counter[1]++;
      if(counter[1] == 3){
        return 'win';
      }/*
    console.log('latest counter value = '+counter[1]);*/
    }
    else{/*
    console.log('latest counter value = '+counter[1]);*/
      break;
    }
  }

  //315 degree
  for(var i=x+1,j=y+1; i< xmax && j < ymax; i++,j++){/*
        console.log(315+'degree loop');
    console.log(i);*/
    if(play[j][i] == value){
      counter[2]++;
      if(counter[2]==3){
        return 'win';
      }/*
    console.log('latest counter value = '+counter[2]);*/
    }
    else{/*
    console.log('latest counter value = '+counter[2]);*/
      break;
    }
  }

  //225 degree
  for(var i=x-1, j=y+1; i>=0 && j< ymax; i--,j++ ){/*
        console.log(225+'degree loop');
    console.log(i);*/
    if(play[j][i] == value){
      counter[3]++;
      if(counter[3] == 3){
        return 'win';
      }/*
    console.log('latest counter value = '+counter[3]);*/
    }
    else{/*
    console.log('latest counter value = '+counter[3]);*/
      break;
    }
  }

  //135 degree
  for(var i=x-1,j=y-1; i>=0 && j>=0; i--,j--){/*
        console.log(135+'degree loop');
    console.log(i);*/
    if(play[j][i] == value){
      counter[2]++;
      if(counter[2] == 3){
        return 'win';
      }/*
    console.log('latest counter value = '+counter[2]);*/
    }
    else{/*
    console.log('latest counter value = '+counter[2]);*/
      break;
    }
  }


  //45 degree
  for(var i=x+1,j=y-1; i < xmax && j>=0; i++,j--){/*
    console.log(45+'degree loop');
    console.log(i);*/
    if(play[j][i] == value){
      counter[3]++;
      if(counter[3] == 3){
        return 'win';
      }/*
    console.log('latest counter value = '+counter[3]);*/
    }
    else{/*
    console.log('latest counter value = '+counter[3]);*/
      break;
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
    socket.emit('get users',usernames);
    socket.broadcast.emit('challenge decline',{challenger :'unknown',challenged: socket.username})
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
      playground : [['','','','','',''],['','','','','',''],['','','','','',''],['','','','','',''],['','','','','',''],['','','','','','']],
      size : [6,6]
    }
    games[data.challenger+data.challenged] = info;
  });

  //game move
  socket.on('game move',function(data){
    games[data.name].status++;
    var x = data.move[0];
    var y = data.move[1];
    games[data.name].playground[x][y]=data.value;
    socket.to(usernames[data.target].id).emit('game move',data);
    var check = checkwinner(data.move,data.name,data.value);
    
    if(check == 'win'){
      socket.emit('game win',{
        winner : data.current,
      });
      socket.to(usernames[data.target].id).emit('game lost');
      delete games[data.name];
    }
    
    else if(games[data.name].status == 36){
      socket.emit('draw');
      socket.to(usernames[data.target].id).emit('draw');
      delete games[data.name];
    }
  });
  //game left
  socket.on('game left',function(data){
  	delete games[data.name];
  	socket.to(usernames[data.target].id).emit('game left',data);
  });
});