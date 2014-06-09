<!doctype html>
<html>
  <head>
    <title>PureChat</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font: 13px Helvetica, Arial; }
      form { background: #000; padding: 3px; position: fixed; bottom: 0; width: 100%; }
      form input { border: 0; padding: 10px; width: 90%; margin-right: .5%; }
      form button { width: 9%; background: rgb(130, 224, 255); border: none; padding: 10px; }
      #chat-panel ul li:nth-child(odd) { background: #fff; }
      #chat-panel ul li{
height: 25px;
border: 1px solid rgb(230, 227, 227);
padding: 3px;
text-align: left;
}
      #chat-panel ul{
overflow: auto;
float: left;
height: 220px;
width: 245px;
      }
      #chat-panel input{
width: 100%;
height: 26px;
border: 1px solid rgb(42, 42, 219);
bottom: 0;
float: left;
}
      #chat-panel{
position: absolute;
bottom: 40px;
overflow-x: auto;
z-index: 5;
}
      .chat{
background: rgb(245, 245, 245);
width: 250px;
height: 285px;
float: right;
margin-right: 10px;
box-shadow: 0px 0px 12px gray;
margin-top: 5%;
border: 2px solid rgb(122, 121, 121);
position: relative;
      }
      .chat h3{
text-align: center;
font-size: 20px;
background: white;
height: 30px;
position: relative;
padding: 5px;
      }
      #connections li {
        text-align: center;
        font-size: 18px;
        padding: 5px;
        margin-bottom: 5px;
        background: rgb(169, 215, 255);
        cursor: pointer;
      }
      #connections li:hover{
        background: blue;
      }
      #connections{
width: 15%;
float: right;
list-style-type: none;
margin: 0;
padding: 0;
box-shadow: 0px 0px 8px gray;
height: 100%;
background: #efefef;
z-index: 9;
      }
      #messages { list-style-type: none; margin: 0; padding: 0; width: 85%; float: left; }
      #messages li { padding: 5px 10px; }
      #messages li:nth-child(odd) { background: #eee; }
      #m{width: 90.5%;}
      #n{width: 20%;}
      #typing{
        background: gray;
        width: 100%;
        height: 50px;
        position: absolute;
        bottom: 43px;
        text-align: center;
        color: white;
        font-size: 20px;
      }
      #login{position: absolute;width: 100%; height: 100%;z-index: 99;background: black;}
      #nick{
        font-size: 30px;
        border: 5px solid blue;
        width: 50%;
        height: 10%;
        margin-top: 15%;
        color: dimgray;
        font-family: cursive;
        text-align: center;
}
    .typing{}
    .cross{
position: absolute;
background: black;
width: 15px;
height: 15px;
top: 1px;
right: 1px;
}
    </style>
  </head>
  <body>
  <div id="login" align="center">
    <input type="text" id="nick" autofocus placeholder="Enter your nick">
  </div>
    <ul id="messages"></ul>
    <ul id="connections">
      <h4><?php echo "Members Online"; ?></h4>
    </ul>
    <br>
    <br>
    <br><br>
    <div id="type-status"></div>
    <form action="">
      <input id="m" autocomplete="off" placeholder="Your message!" /><button>Send</button>
    </form>
    <div id="chat-panel"></div>
<script src="/socket.io/socket.io.js"></script>
<script src="http://code.jquery.com/jquery-1.11.1.js"></script>
<script>
  var socket = io();
  var currentuser ;

  $('form').submit(function(){
    var nick = $('#nick').val();
    var msg = $('#m').val();
    $('#messages').prepend(
    $('<li>').append(
        $('<strong/>',{text:nick})
            )
    .append(
            $('<span/>', {text: ' : '+msg})
    )
);
    socket.emit('new message' , msg);
    $('#m').val('');
    return false;
  });

  //welcome message
  socket.on('welcome',function(data){
    $('#messages').append($('<li>').text('welcome ' + data.username));
  });

//text message recieved
  socket.on('new message', function(data){
    $('#messages').prepend(
      $('<li>').append(
          $('<strong/>',{text:data.nick})
              )
      .append(
              $('<span/>', {text: " : " + data.msg})
        )
    );
  });
//new member added
  socket.on('new',function(msg){
    $('#messages').prepend($('<li>').text(msg));
  });
//member signout
  socket.on('gone',function(msg){
    $('#messages').prepend($('<li>').text(msg));
  });

  //User logout message
  socket.on('user left',function(data){
    $('#messages').append(
      $('<li>').prepend(
          $('<strong/>',{text:data.username})
              )
      .append(
              $('<span/>', {text: ' : left '+data.numUsers + ' remaining'})
        )
    );
    $('.'+data.username).remove();  
  });

  //other users typing status
  socket.on('typing',function(data){
    $('#messages').prepend(
    $('<li>',{'class': 'typing' }).append(
        $('<strong/>',{text:data.username})
            )
    .append(
            $('<span/>', {text: ' : is typing'})
    )
  );
  });

  //if other users stops typing
  socket.on('stop typing',function(){
    $('.typing').remove();
  });
  socket.on('user joined',function(data){
    $('#messages').prepend(
    $('<li>').append(
        $('<strong/>',{text:data.username})
            )
    .append(
            $('<span/>', {text: ' : joined us. Total Online : ' + data.numUsers})
    )
  );
  });
  socket.on('new connection',function(data){
    $('#connections').append(
      $('<li>',{'class' : data.username}).append(
        $('<strong/>',{text:data.username})
            )
  );  
  });
  socket.on('get users',function(data){
    $('ul li:not(:first)').remove();
    for (var key in data) {
      $('#connections').append(
        $('<li>',{'class' : data[key].username}).append(
          $('<strong/>',{text:data[key].username})
        )
      );
    }
  });

  //receive private message
  socket.on('receive private',function(data){
    if($('#chat-panel .'+data.sender).length){
		$('#chat-panel .'+data.sender+' ul').prepend(
		    $('<li>').append(
		        $('<strong/>',{text:data.sender+" : "})
		            )
		    .append(
		            $('<span/>', {text: data.message})
		    )
		  );
    } else {
      $('#chat-panel').append("<div class = 'chat "+data.sender+"'><h3>"+data.sender+"</h3><ul></ul><div class='cross'></div><input class='"+data.sender+"' type='text' /></div>");
	$('#chat-panel .'+data.sender+' ul').prepend(
	    $('<li>').append(
	        $('<strong/>',{text:data.sender+" : "})
	            )
	    .append(
	            $('<span/>', {text: data.message})
	    )
	  );
    }
  });

  //get nick name and register whith server
$(document).ready(function(){
	//get private chat message
	$('#chat-panel').on('keypress','input',function(e){
		if(e.keyCode == 13){      //enter
			var msg = $(this).val();
			$(this).val('');
			$(this).siblings('ul').prepend(
			    $('<li>').append(
			        $('<strong/>',{text:'me : '})
			            )
			    .append(
			            $('<span/>', {text: msg})
			    )
			  );
			var target = $(this).attr('class');
			socket.emit('send private',{
				target : target,
				sender : currentuser,
				message : msg
			});
		} 
	});

	//exit private chat
  $('#chat-panel').on('click','.cross',function(e){
    $(this).parent().remove();
  });

  //start private chat
  $('#connections').on('click','li',function(e){
    var targetuser = $(this).attr('class');
    if($('#chat-panel .'+targetuser).length){
      $('.'+targetuser+' input').focus();
    } else {
      $('#chat-panel').append("<div class = 'chat "+targetuser+"'><h3>"+targetuser+"</h3><ul></ul><div class='cross'></div><input class='"+targetuser+"' type='text' /></div>");
      $('.'+targetuser+' input').focus();
      var data = [ targetuser , currentuser ];
      data.sort();
      socket.emit('create private',{room: data});
    }
  });

  socket.emit('get users');
  $('#nick').keyup(function(e){
    if (e.keyCode == 13) { //enter
      var username = $('#nick').val();
      currentuser = username;
      socket.emit('add user',username);
      $('#login').hide();
      $('#m').focus();
    }
  });
});

//basic function to get typing status
var laststatus = 'stop typing';
var messagearea = $('#m');
var typingStatus = $('#type-status');
var lastTypedTime = new Date(0); // it's 01/01/1970
var typingDelayMillis = 500; //delay if user stops typing

function refreshTypingStatus() {
    if (!messagearea.is(':focus') || messagearea.val() == '' || new Date().getTime() - lastTypedTime.getTime() > typingDelayMillis) {
        //user is not typing or field is empty
        statustoggle('stop typing');
    } else {
        //user is typing something
        statustoggle('typing');
    }
}

//call typing event only if it is changed
function statustoggle(status){
  if(laststatus != status){
    laststatus = status;
    socket.emit(status);
  }
}

function updateLastTypedTime() {
    lastTypedTime = new Date();
}

//call this asynchronous function for user typing status update
setInterval(refreshTypingStatus, 100);
messagearea.keypress(updateLastTypedTime);
messagearea.blur(refreshTypingStatus);
</script>
  </body>
</html>