<<<<<<< HEAD
// var express = require('express');
// var app = express();
// var server = require('http').createServer(app).listen(8080);;
// var io = require('socket.io').listen(server);


// Setup basic express server
var express = require('express');
var fs = require('fs');
var mysql = require('mysql');
var app = express();
var mongoose = require('mongoose');


var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;



server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


mongoose.connect('mongodb://localhost/chattin', function(err){
  if(err){
    console.log(err)
  }else{
    console.log("Connected to MongoDB");
  }
})



// Get Mongoose Schemas
var Chat = require('./lib/Chat');
var User = require('./lib/User');

// Routing
app.use(express.static(__dirname + '/public'));


console.log("Server running..");

// Chatroom

var numUsers = 0;
var users = {};
var generalGroup = '';

io.on('connection', function (socket) {
  var addedUser = false;

  Chat.find({ groupName: 'general-chat' }, function(err, group) {
    if (err) {
      console.log("Couldn't find the general-chat");
      
    }

  

   
    if (group[0] !== undefined) {
      

    } else {
      console.log("trying to create one more");
      var newGroup = new Chat({
            groupName: "general-chat",
            messages:[{
              username: "Chat-Admin",
              message: "Welcome to Chattin"
            }]
      });

      newGroup.save(function(err2) {
      if (err2) throw err2;
        
        console.log('general-chat created!');
      });

    }
 
  });
  

  User.find({ username: 'Chat-Admin' }, function(err, user) {
    if (user == null || user == undefined) {
      console.log("trying to create Admin");

      var defAvaN= Math.floor((Math.random() * 6) + 1);
      var imgPath = '/img/standin/Avatar_0'+defAvaN+'.png';
      
      var newUser = new User({
        username: "Chat-Admin",
        password: "qwejqwEQWKEQWIEDOwqdioqwd21312o3esw!#JDDI!JDSSISF",
        groups: "general-chat",
        avatar: {
          path: imgPath,
          contentType: 'image/png'
        }
      });

      newUser.save(function(err2) {
      if (err2) throw err2;
        
        console.log('Chat-Admin created!');
      });
      
    } else {
      console.log("ITS NOT CREATING");
    }
 
  });


  

  

  


  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data, desGroup, callback) {
    // we tell the client to execute 'new message'
    var message = data.trim();
    if(message.substr(0,3) === '/w '){
      message = message.substr(3);
      var ind = message.indexOf(' ');
      if(ind !== -1){
        
        var name = message.substring(0, ind);
        var message = message.substring(ind + 1);
        if(name in users){
          callback(true);
          users[name].emit('whisper', {
            username: socket.username,
            message: message
          });
          console.log("whisper");
        }else {
          callback('Error! Enter a valid user.');
        }
        
      } else {
        callback('Error! Please enter a message for your whisper.');
      }
      
    } else {
      callback(false);
      console.log("normal message");
      // var newMsg = new Chat({username: socket.username, message: message});
      // newMsg.save(function(err){
      //   if(err) throw err;
          
      // });
      var newMsg = { username: socket.username, message: message };
      Chat.findOneAndUpdate(
        { groupName: desGroup }, 
        { $push: { messages: newMsg } }, 
        function(err, msg) {
        if (err) throw err;

        socket.broadcast.emit('new message', {
          username: socket.username,
          message: message
          });

        // we have the updated user returned to us
        console.log(msg);
      });

      

    }

    
  });




  socket.on('find sign user', function(data){
    User.find({ username: data }, function(err, user) {
      if (err) throw err;

      // object of the user
      socket.emit('find sign user', user);
      socket.emit('load all groups', user);
      updateUsernames();
      console.log(user);
    });
  });

  
  socket.on('login user', function(username, password, callback){

    User.find({ username: username }, function(err, user) {
      if (err){
        console.log('Bad login');
        callback(false);
      }
        if(user.length > 0){


          
          console.log(user[0].username);
          // object of the user
          if (user[0].password == password) {
            if (addedUser) return;
            socket.emit('load all groups', user);
  
            console.log("trying to find messages");
            var query = Chat.find({groupName: 'general-chat'}) 
            query.sort('-created').limit(50).exec(function(err2, docs){
              if(err2) throw err2;
                  // console.log(docs);

              socket.emit('load old messages', docs);
            })

            // we store the username in the socket session for this client
            socket.username = user[0].username;

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

            users[socket.username] = socket;
            // users.push(socket.username);
            console.log("socket.username: "+ socket.username+" "+callback);
            
            callback(true);
            console.log('User: '+socket.username+' logged in!');

            user[0].online = true;

            user[0].save(function(err) {
              if (err) throw err;

              console.log(user[0].username+" is online: "+user[0].online);
              updateUsernames();
            });

          } else {
            callback(false);
            console.log("bad password "+password+" | user.password "+user[0].password);
          }
          
        } else {
          callback(false);
            console.log("bad username "+username+" | user.username "+user.username);
        }
    
     
    });
    // User.find({ username: username }, function(err, user) {
    //   if (err){
    //     console.log('Bad login');
    //     callback(false);
    //   } 
    //   if(!err){
    //     updateUsernames();
    //   }
    // });
      

  });


  socket.on('user to pend', function(penduser){
    User.findOneAndUpdate(
        { username: socket.username }, 
        { $push: { pending: penduser } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(penduser+" added to pending for: "+socket.username);

      });
  });


  socket.on('deny pend', function(penduser){
    User.findOneAndUpdate(
        { username: penduser }, 
        { $pull: { pending: socket.username } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(penduser+" removed from pending for: "+socket.username);
      });
  });


  socket.on('user add pend', function(penduser){
    User.findOneAndUpdate(
        { username: penduser }, 
        { $pull: { pending: socket.username } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(penduser+" removed from pending for: "+socket.username);
      });

      User.findOneAndUpdate(
        { username: socket.username }, 
        { $push: { friends: penduser } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(penduser+" added to friends for: "+socket.username);
      });

      User.findOneAndUpdate(
        { username: penduser }, 
        { $push: { friends: socket.username } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(socket.username+" added to friends for: "+penduser);
      });
  });



  socket.on('add user', function (username, password, callback) {
    
    var defAvaN= Math.floor((Math.random() * 6) + 1);
    var imgPath = '/img/standin/Avatar_0'+defAvaN+'.png';
    
    var newUser = new User({
      username: username,
      password: password,
      friends: "Chat-Admin",
      groups: "general-chat",
      avatar: {
        path: imgPath,
        contentType: 'image/png'
      }
    });
    newUser.save(function(err) {
      if(err){
        console.log('used name');
        callback(false);
      } 

      if (!err) {
        if (addedUser) return;

          console.log("trying to find messages");
          var query = Chat.find({groupName: 'general-chat'}) 
          query.sort('-created').limit(50).exec(function(err2, docs){
            if(err2) throw err2;

            socket.emit('load old messages', docs);
            console.log("DOCS: "+docs);
          })

          // we store the username in the socket session for this client
          socket.username = username;

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

          users[socket.username] = socket;
          // users.push(socket.username);
          console.log("socket.username: "+ socket.username+" "+callback);
          
          var adminFriend = socket.username;
          User.findOneAndUpdate(
            { username: "Chat-Admin" }, 
            { $push: { friends: adminFriend } }, 
            function(err, msg) {
            if (err) throw err;

        // we have the updated user returned to us
              console.log(msg+"adding to admin friendlist");
            });


          callback(true);
          console.log('User created!');
        }

      

      
    });
      

  });




  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  }); 

  socket.on('loggedinNow', function(){
    updateUsernames();
  })



  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });


  // socket.on('log out', function () {
  //   if (addedUser) {
  //     --numUsers;


  //     User.findOneAndUpdate({ username: socket.username }, { online: false }, function(err, user) {
  //       if (err) throw err;

  //       // we have the updated user returned to us
  //       console.log(user+" Trying to log out!");
  //       // echo globally that this client has left
  //       socket.broadcast.emit('user left', {
  //         username: socket.username,
  //         numUsers: numUsers
  //       });
  //       updateUsernames();
  //     });

      
      
  //   }


  

  socket.on('loggedOutNow', function () {
    
console.log("HELLO1");
    if (addedUser) {
      --numUsers;
console.log("HELLO2");

      User.findOneAndUpdate({ username: socket.username }, { online: false }, function(err, user) {
        if (!err) {
          console.log("HELLO3");
          addedUser = false;
          // we have the updated user returned to us
          console.log("LOGGING THIS USER OUT "+user);

          socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
          });
          console.log("HELLO4"+socket.username);
          updateUsernames();
          console.log("HELLO");
          socket.username = '';
        }
        



      });

      
    }
  });






  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;


      User.findOneAndUpdate(
        { username: socket.username }, 
        { online: false }, 
        function(err, user) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log("Is "+socket.username+" online?");
        // echo globally that this client has left
        socket.broadcast.emit('user left', {
          username: socket.username,
          numUsers: numUsers
        });
        updateUsernames();
      });

      
      
    }
  });


  socket.on('friend search', function(searchInput){
    query = User.find({ username: searchInput})
    query.exec(function(err, docs){
      if (err) throw err;

      socket.emit('friend search result', docs);
    })
  });

  function updateUsernames(){
    query = User.find({})
    query.exec(function(err, docs){
      if (err) throw err;

      console.log("is this it?");

      socket.emit('load all users', docs);
      socket.broadcast.emit('load all users', docs);
    })
  }
});
=======
// var express = require('express');
// var app = express();
// var server = require('http').createServer(app).listen(8080);;
// var io = require('socket.io').listen(server);


// Setup basic express server
var express = require('express');
var fs = require('fs');
var mysql = require('mysql');
var app = express();
var mongoose = require('mongoose');


var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;



server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


mongoose.connect('mongodb://localhost/chattin', function(err){
  if(err){
    console.log(err)
  }else{
    console.log("Connected to MongoDB");
  }
})



// Get Mongoose Schemas
var Chat = require('./lib/Chat');
var User = require('./lib/User');

// Routing
app.use(express.static(__dirname + '/public'));


console.log("Server running..");

// Chatroom

var numUsers = 0;
var users = {};
var generalGroup = '';

io.on('connection', function (socket) {
  var addedUser = false;

  Chat.find({ groupName: 'general-chat' }, function(err, group) {
    if (err) {
      console.log("Couldn't find the general-chat");
      
    }

  

   
    if (group[0] !== undefined) {
      

    } else {
      console.log("trying to create one more");
      var newGroup = new Chat({
            groupName: "general-chat",
            messages:[{
              username: "Chat-Admin",
              message: "Welcome to Chattin"
            }]
      });

      newGroup.save(function(err2) {
      if (err2) throw err2;
        
        console.log('general-chat created!');
      });

    }
 
  });
  

  User.find({ username: 'Chat-Admin' }, function(err, user) {
    if (user == null || user == undefined) {
      console.log("trying to create Admin");

      var defAvaN= Math.floor((Math.random() * 6) + 1);
      var imgPath = '/img/standin/Avatar_0'+defAvaN+'.png';
      
      var newUser = new User({
        username: "Chat-Admin",
        password: "qwejqwEQWKEQWIEDOwqdioqwd21312o3esw!#JDDI!JDSSISF",
        groups: "general-chat",
        avatar: {
          path: imgPath,
          contentType: 'image/png'
        }
      });

      newUser.save(function(err2) {
      if (err2) throw err2;
        
        console.log('Chat-Admin created!');
      });
      
    } else {
      console.log("ITS NOT CREATING");
    }
 
  });


  

  

  


  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data, desGroup, callback) {
    // we tell the client to execute 'new message'
    var message = data.trim();
    if(message.substr(0,3) === '/w '){
      message = message.substr(3);
      var ind = message.indexOf(' ');
      if(ind !== -1){
        
        var name = message.substring(0, ind);
        var message = message.substring(ind + 1);
        if(name in users){
          callback(true);
          users[name].emit('whisper', {
            username: socket.username,
            message: message
          });
          console.log("whisper");
        }else {
          callback('Error! Enter a valid user.');
        }
        
      } else {
        callback('Error! Please enter a message for your whisper.');
      }
      
    } else {
      callback(false);
      console.log("normal message");
      // var newMsg = new Chat({username: socket.username, message: message});
      // newMsg.save(function(err){
      //   if(err) throw err;
          
      // });
      var newMsg = { username: socket.username, message: message };
      Chat.findOneAndUpdate(
        { groupName: desGroup }, 
        { $push: { messages: newMsg } }, 
        function(err, msg) {
        if (err) throw err;

        socket.broadcast.emit('new message', {
          username: socket.username,
          message: message
          });

        // we have the updated user returned to us
        console.log(msg);
      });

      

    }

    
  });




  socket.on('find sign user', function(data){
    User.find({ username: data }, function(err, user) {
      if (err) throw err;

      // object of the user
      socket.emit('find sign user', user);
      socket.emit('load all groups', user);
      updateUsernames();
      console.log(user);
    });
  });

  
  socket.on('login user', function(username, password, callback){

    User.find({ username: username }, function(err, user) {
      if (err){
        console.log('Bad login');
        callback(false);
      }
        if(user.length > 0){


          
          console.log(user[0].username);
          // object of the user
          if (user[0].password == password) {
            if (addedUser) return;
            socket.emit('load all groups', user);
  
            console.log("trying to find messages");
            var query = Chat.find({groupName: 'general-chat'}) 
            query.sort('-created').limit(50).exec(function(err2, docs){
              if(err2) throw err2;
                  // console.log(docs);

              socket.emit('load old messages', docs);
            })

            // we store the username in the socket session for this client
            socket.username = user[0].username;

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

            users[socket.username] = socket;
            // users.push(socket.username);
            console.log("socket.username: "+ socket.username+" "+callback);
            
            callback(true);
            console.log('User: '+socket.username+' logged in!');

            user[0].online = true;

            user[0].save(function(err) {
              if (err) throw err;

              console.log(user[0].username+" is online: "+user[0].online);
              updateUsernames();
            });

          } else {
            callback(false);
            console.log("bad password "+password+" | user.password "+user[0].password);
          }
          
        } else {
          callback(false);
            console.log("bad username "+username+" | user.username "+user.username);
        }
    
     
    });
    // User.find({ username: username }, function(err, user) {
    //   if (err){
    //     console.log('Bad login');
    //     callback(false);
    //   } 
    //   if(!err){
    //     updateUsernames();
    //   }
    // });
      

  });


  socket.on('user to pend', function(penduser){
    User.findOneAndUpdate(
        { username: socket.username }, 
        { $push: { pending: penduser } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(penduser+" added to pending for: "+socket.username);

      });
  });


  socket.on('deny pend', function(penduser){
    User.findOneAndUpdate(
        { username: penduser }, 
        { $pull: { pending: socket.username } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(penduser+" removed from pending for: "+socket.username);
      });
  });


  socket.on('user add pend', function(penduser){
    User.findOneAndUpdate(
        { username: penduser }, 
        { $pull: { pending: socket.username } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(penduser+" removed from pending for: "+socket.username);
      });

      User.findOneAndUpdate(
        { username: socket.username }, 
        { $push: { friends: penduser } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(penduser+" added to friends for: "+socket.username);
      });

      User.findOneAndUpdate(
        { username: penduser }, 
        { $push: { friends: socket.username } }, 
        function(err) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log(socket.username+" added to friends for: "+penduser);
      });
  });



  socket.on('add user', function (username, password, callback) {
    
    var defAvaN= Math.floor((Math.random() * 6) + 1);
    var imgPath = '/img/standin/Avatar_0'+defAvaN+'.png';
    
    var newUser = new User({
      username: username,
      password: password,
      friends: "Chat-Admin",
      groups: "general-chat",
      avatar: {
        path: imgPath,
        contentType: 'image/png'
      }
    });
    newUser.save(function(err) {
      if(err){
        console.log('used name');
        callback(false);
      } 

      if (!err) {
        if (addedUser) return;

          console.log("trying to find messages");
          var query = Chat.find({groupName: 'general-chat'}) 
          query.sort('-created').limit(50).exec(function(err2, docs){
            if(err2) throw err2;

            socket.emit('load old messages', docs);
            console.log("DOCS: "+docs);
          })

          // we store the username in the socket session for this client
          socket.username = username;

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

          users[socket.username] = socket;
          // users.push(socket.username);
          console.log("socket.username: "+ socket.username+" "+callback);
          
          var adminFriend = socket.username;
          User.findOneAndUpdate(
            { username: "Chat-Admin" }, 
            { $push: { friends: adminFriend } }, 
            function(err, msg) {
            if (err) throw err;

        // we have the updated user returned to us
              console.log(msg+"adding to admin friendlist");
            });


          callback(true);
          console.log('User created!');
        }

      

      
    });
      

  });




  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  }); 

  socket.on('loggedinNow', function(){
    updateUsernames();
  })



  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });


  // socket.on('log out', function () {
  //   if (addedUser) {
  //     --numUsers;


  //     User.findOneAndUpdate({ username: socket.username }, { online: false }, function(err, user) {
  //       if (err) throw err;

  //       // we have the updated user returned to us
  //       console.log(user+" Trying to log out!");
  //       // echo globally that this client has left
  //       socket.broadcast.emit('user left', {
  //         username: socket.username,
  //         numUsers: numUsers
  //       });
  //       updateUsernames();
  //     });

      
      
  //   }


  

  socket.on('loggedOutNow', function () {
    
console.log("HELLO1");
    if (addedUser) {
      --numUsers;
console.log("HELLO2");

      User.findOneAndUpdate({ username: socket.username }, { online: false }, function(err, user) {
        if (!err) {
          console.log("HELLO3");
          addedUser = false;
          // we have the updated user returned to us
          console.log("LOGGING THIS USER OUT "+user);

          socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
          });
          console.log("HELLO4"+socket.username);
          updateUsernames();
          console.log("HELLO");
          socket.username = '';
        }
        



      });

      
    }
  });






  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;


      User.findOneAndUpdate(
        { username: socket.username }, 
        { online: false }, 
        function(err, user) {
        if (err) throw err;

        // we have the updated user returned to us
        console.log("Is "+socket.username+" online?");
        // echo globally that this client has left
        socket.broadcast.emit('user left', {
          username: socket.username,
          numUsers: numUsers
        });
        updateUsernames();
      });

      
      
    }
  });


  socket.on('friend search', function(searchInput){
    query = User.find({ username: searchInput})
    query.exec(function(err, docs){
      if (err) throw err;

      socket.emit('friend search result', docs);
    })
  });

  function updateUsernames(){
    query = User.find({})
    query.exec(function(err, docs){
      if (err) throw err;

      console.log("is this it?");

      socket.emit('load all users', docs);
      socket.broadcast.emit('load all users', docs);
    })
  }
});
>>>>>>> origin/master
