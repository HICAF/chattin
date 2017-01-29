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
mongoose.Promise = require('bluebird');
var bcrypt = require('bcryptjs');


var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var MongoClient = require('mongodb').MongoClient;
var mongopw = "Polo2424";
var uri = "mongodb://hicaf:"+mongopw+"@chattindb-shard-00-00-jfsq4.mongodb.net:27017,chattindb-shard-00-01-jfsq4.mongodb.net:27017,chattindb-shard-00-02-jfsq4.mongodb.net:27017/admin?ssl=true&replicaSet=chattindb-shard-0&authSource=admin";


server.listen(port, function () {
  console.log('Server listening at port %d', port);
});



// MongoClient.connect(uri, function(err, db) {
//   db.close();
// });

var mongoose = require('mongoose');
mongoose.connect(uri);

var Cat = mongoose.model('Cat', { name: String });

var kitty = new Cat({ name: 'Zildjian' });
kitty.save(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('meow');
  }
});



// MongoClient.connect(uri, function(err, db) {
//   if(err){
//     console.log(err)
//   }else{
//     console.log("Connected to MongoDB");
//   }

//   db.close();
// })



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
          bcrypt.compare(password, user[0].passwor, function(err, isMatch) {
            console.log("password: "+password );
            console.log("hash: "+hash);
            console.log(err);
            console.log(isMatch);

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
          });
          
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

    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) {
          // Store hash in your password DB. 
    
        var newUser = new User({
          username: username,
          password: hash,
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

          

          
        }); // END save user
     }); // END bcrypt.hash
    }); // END bcrypt.genSalt
      

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
    

    if (addedUser) {
      --numUsers;

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
          updateUsernames();
          socket.username = '';
        }
        



      });

      
    }
  });

  socket.on('Make new group', function(groupInv){

      var newGroup = new Chat({
            groupName: groupInv,
            messages:[{
              username: "Chat-Admin",
              message: "Welcome to "+groupInv
            }]
      });

      newGroup.save(function(err2) {
      if (err2) throw err2;
        
        console.log(groupInv+' created!');
      });

  })

  socket.on('Invite to group', function(groupInvNames, groupInv){

    for (var i = 0; i < groupInvNames.length; i++) {

      User.findOneAndUpdate(
        { username: groupInvNames[i] }, 
        { $push: { groups: groupInv } }, 
        function(err) {
        if (err) throw err;

      });

      User.find({ username: groupInvNames[i] }, function(err, user) {
        socket.broadcast.emit('load all groups', user);
      })
    }

    User.findOneAndUpdate(
        { username: socket.username }, 
        { $push: { groups: groupInv } }, 
        function(err) {
        if (err) throw err;

    });

    User.find({ username: socket.username }, function(err, user) {
      if (err) throw err;

      // object of the user
      socket.emit('load all groups', user);
      updateUsernames();
      console.log(user);
    });

  })

  socket.on('Chat change', function(groupName){

            var query = Chat.find({groupName: groupName}) 
            query.sort('-created').limit(50).exec(function(err2, docs){
              if(err2) throw err2;
                  // console.log(docs);

              socket.emit('load old messages', docs);
            })

  })

  




  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;


      User.findOneAndUpdate(
        { username: socket.username }, 
        { online: false }, 
        function(err, user) {
        if (err) throw err;

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

      socket.emit('load all users', docs);
      socket.broadcast.emit('load all users', docs);
    })
  }
});