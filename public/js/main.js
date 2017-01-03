$(function() {
   var socket = io();
  console.log("mainJS on");
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 1000; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for login username
  var $passwordInput = $('.passwordInput'); // Input for login password

  var $signUsernameInput = $('.signUsernameInput'); // Input for signup username
  var $signPasswordInput = $('.signPasswordInput'); // Input for signup password
  var $signRepPasswordInput = $('.signRepPasswordInput'); // Input for repeat password

  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box
  var $whispUser = $('#whispUser');
  var $aUser = $('.aUser');
  var $aGroup = $('.aGroup');



  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  var $users = $('#users');
  var $groups = $('#groups');

  var $pendAdd = $('.pendAdd');


  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput;






  function addParticipantsMessage (data) {
    var message = '';

    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);

    $('.messages').animate({ scrollTop: $('.messages').prop("scrollHeight")}, 1000);
    $('body').animate({ scrollTop: $('body').prop("scrollHeight")}, 1000);
  }

  // Sets the client's username


  function setUsername () {
    
    username = cleanInput($usernameInput.val().trim());
    password = cleanInput($passwordInput.val());

    // If the username is valid
      if (username) {
        // socket.emit('checkUsername', username, function(){

        // })
        // Tell the server your username
        socket.emit('login user', username, password, function(data){
          
          if(data){
            console.log("Logged in as: "+username);
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();
            document.getElementById("mySidebar").style.width = "80px";
            document.getElementById("mySidenav").style.width = "80px";
            document.getElementById("main").style.marginLeft = "80px";
            
          } else {
            console.log('name used [Client]');
            swal({
              title: "Sorry",
              text: "Wrong credentials.",
              type: "error",
              timer: 1500,
              showConfirmButton: false
            });
            username = null;
          }
          
          $usernameInput.val('');

        });
       
      } else {
        console.log('name used [Client]');
        swal({
          title: "Sorry",
          text: "Wrong credentials.",
          type: "error",
          timer: 1500,
          showConfirmButton: false
        });
        username = null;
      }
  }

  // SIGN UP

  function setSignUsername() {
    username = cleanInput($signUsernameInput.val().trim());
    password = cleanInput($signPasswordInput.val());
    repPassword = cleanInput($signRepPasswordInput.val());
    
    
    
    if(username.length > 3){
    // If the username is valid
      if(password == "") {
        swal({

          title: "Ah ah..",
          text: "You need a password!",
          type: "error",
          timer: 1500,
          showConfirmButton: false
        });
        username = null;

      } else if (password == repPassword) {
        if (username) {
          socket.emit('add user', username, password, function(data){

          
            if(data){
          // Tell the server your username
              console.log("nearly there");
                
                socket.emit('loggedinNow', function(){

                })


              
                $loginPage.fadeOut();
                $chatPage.show();
                $loginPage.off('click');
                $currentInput = $inputMessage.focus();
                document.getElementById("mySidebar").style.width = "80px";
                document.getElementById("mySidenav").style.width = "80px";
                document.getElementById("main").style.marginLeft = "80px";
                
            } else {
              console.log('name used [Client]');
              sweetAlert("Ah ah..", "Username already in taken!", "error");
              username = null;
            }
            
            $usernameInput.val('');

          });
         
        }
      } else {
        swal({
          title: "Ah ah..",
          text: "Passwords needs to match!",
          type: "error",
          timer: 1500,
          showConfirmButton: false
        });
        username = null;
      }

    
    } else {
      console.log('too short [Client]');
      swal({
        title: "Oops..",
        text: "Username needs to be longer than 3 characters",
        type: "error",
        timer: 1500,
        showConfirmButton: false
      });
      username = null;
    }
  }
  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    var desGroup = $("#whispUser").val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message, desGroup, function(data){
        // later
      });
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    // console.log("THIS DATA: "+data.username);
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }



    var $usernameDiv = $('<span class="username"/></br>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var message = data.message;


    if(message.substr(0,3) === '/w '){
      message = message.substr(3);
      var ind = message.indexOf(' ');
      var name = message.substring(0, ind);
      var message = message.substring(ind + 1);
      console.log("name: |"+name+"| message: |"+message+"|");

      // Whisper
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(message)
      .css('color', '#222222');

    }else if(message.substr(0,3) !== '/w '){
      
      // Public
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(message);

    } else {
      
      // Error
      var $messageBodyDiv = $('<span class="messageBody">')
      .text(message)
      .css('color', 'red');

    }

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li id="'+data.username+'" class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);


    
    
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement(el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;

    
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keyup(function (event) {
    // Auto-focus the current input when a key is typed
    
      if (!(event.ctrlKey || event.metaKey || event.altKey)) {
        if ($("#friendInput").is(":focus")) {
          var friendSet = false;
          var friendSetPend = false;

          $( ".searchUser" ).remove();
          searchInput = $("#friendInput").val();
          socket.emit('friend search', searchInput, function(data){});
          console.log("Search: "+searchInput)
          socket.on('friend search result', function(data){

          
            var html = '';

            for (var i = 0; i < data.length; i++) {
              if (data[i].username != username) {
                for (var x = 0; x < data[i].friends.length; x++) {

                      if (data[i].friends[x] == username) {
                        friendSet = true;
                      } 

                }
                for (var x = 0; x < data[i].pending.length; x++) {

                      if (data[i].pending[x] == username) {
                        friendSetPend = true;
                      } 

                }
                if (!friendSet && !friendSetPend) {
                  html += '<li class="searchUser"><div class="addFPendBtn pendAdd" id="'+data[i].username+'">Add</div><img class="userAvatar" src="'+data[i].avatar.path+'" alt="avatar_id_'+i+'"><strong>'+data[i].username+'</strong></li>';
                }
              }
            }
            $("#searchedUsers").html(html);

          });    
        }  
      }
    
    
    // When the client hits ENTER on their keyboard

    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        if($(".logSwipe").hasClass("active")){
          setUsername();
        } else {
          setSignUsername();
        }
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  // $loginPage.click(function () {
  //   $currentInput.focus();
  // });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = " - Welcome to the Chattin - ";
    log(message, {
      append: true
    });

    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });



  socket.on('load old messages', function(data){


      
      // 3 as in the 3 latest messages
      for(var i = 0; i < data[0].messages.length; i++){
        addChatMessage(data[0].messages[i]);
      }
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  socket.on('whisper', function(data){
    addChatMessage(data);
  });



      socket.on('load all users', function(docs){
        var html = '';
        var youHtml = '';
        var pends = '';
        var listOfPend = [];

        //Go through all users
        for (var i = 0; i < docs.length; i++) {
          //Check if user is you
          if(docs[i].username == username) {
            youHtml += '<li class="uUser"><img class="userAvatar" src="'+docs[i].avatar.path+'" alt="avatar_id_'+i+'"></br><strong>'+docs[i].username+'</strong></li>';
          } 
          //Go through users friendlist
          for (var x = 0; x < docs[i].friends.length; x++) {
            //Check if user has you as friend
            if(docs[i].friends[x] == username) {
              //Go through friends groups
              for (var g = 0; g < docs[i].groups.length; g++) {
                //Checks if friend is part of current group
                //If he/she is - add him on the 'group online list'
                if (docs[i].groups[g] == $('#whispUser').val()) {
                  //Check if friend is online
                  if(docs[i].online == true){
                    html += '<li class="aUser"><img class="userAvatar" src="'+docs[i].avatar.path+'" alt="avatar_id_'+i+'"><strong>'+docs[i].username+'</strong></li>';
                  } else {
                    html += '<li class="offlineU"><img class="userAvatar" src="'+docs[i].avatar.path+'" alt="avatar_id_'+i+'"><strong>'+docs[i].username+'</strong></li>';
                  }

                }
                
              }

            } 
          }
          
              for (var p = 0; p < docs[i].pending.length; p++) {
                if(docs[i].pending[p] == username){
                  console.log("setting "+docs[i].username+" on pending list "+i+" "+p);
                  pends += '<li class="pendUser"><div class="addFPendBtn WpendAdd" id="'+docs[i].username+'">Add</div><div class="addFPendBtn pendNo" id="'+docs[i].username+'">No</div><img class="userAvatar" src="'+docs[i].avatar.path+'" alt="avatar_id_'+i+'"><strong>'+docs[i].username+'</strong></li>'
                  
                }
                
              }


        }
        $users.html(html);
        $('#yourUsers').html(youHtml);
        $("#pendingUsers").html(pends);
      });


      
      


      socket.on('load all groups', function(user){

        var html = '';
        // console.log("user: "+user+" user[0]: "+user[0]);
        for (var i = 0; i < user.length; i++) {
          html += '<li class="aGroup" id="'+user[i].groups+'" onClick="focusWhisp(this.id)"><strong>'+user[i].groups+'</strong></li>';
        }


        $groups.html(html);

      });


 
    //Send friend request
    $(document).on('click', '.pendAdd', function (e) {
            var id = this.id;

            socket.emit('user to pend', id, function(data){

            console.log(username+" added to "+id+"s pending list");
            }); 
            socket.emit('loggedinNow', function(){});

            $( ".searchUser" ).remove();
            document.getElementById("friendWin").style.height = "0px";
            document.getElementById("friendWin").style.border = "0px solid black";
            $("#friendWin").fadeOut(500);
            e.preventDefault();
    });

    //Accept friend request
    $(document).on('click', '.WpendAdd', function (e) {
            var id = this.id;
            

            socket.emit('user add pend', id, function(data){
                  var fadeID = "#"+id;
                  $( fadeID).fadeOut(1000);

                  console.log(username+" added to "+id+"s pending list");
            }); 

            socket.emit('loggedinNow', function(){

                })
            e.preventDefault();
    });

    $(document).on('click', '.pendNo', function (e) {
            var id = this.id;
            

            socket.emit('deny pend', id, function(data){
                  var fadeID = "#"+id;
                  $( fadeID).fadeOut(1000);

                  console.log(username+" removed from "+id+"s pending list");
            }); 

            socket.emit('loggedinNow', function(){

                })
            e.preventDefault();
    });

    






      $("#signOutBtn").click(function(){
          
          swal({
            title: "Log out?",
            text: "Do you want to sign out?",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            confirmButtonText: "Yes, log out!",
            closeOnConfirm: false
          },
          function(){
            swal("Logged out!", "We wish you a good day", "success");

            socket.emit('loggedOutNow');

              $loginPage.show();
              $chatPage.fadeOut();
              $currentInput = $usernameInput.focus();
              $( ".aUser" ).remove();
              $( ".aGroup" ).remove();
              $( ".message" ).remove();    

              document.getElementById("mySidebar").style.width = "0px";
              document.getElementById("mySidenav").style.width = "0px";
              document.getElementById("main").style.marginLeft = "0px"; 

              connected = false;
              username = null;

              if($(".signSwipe").hasClass("active")){
                $(".signSwipe").removeClass("active");
                $(".logSwipe").addClass("active");
              }



          });

      });



      





});
  // Side Navigation menu events
function openNav() {

    document.getElementById("mySidenav").style.width = "300px";
    document.getElementById("main").style.marginLeft = "300px";
    document.getElementById("users").style.marginLeft = "100px";
    $("#mySidebar").addClass("navOpened");
}


function closeNav() {

    document.getElementById("mySidenav").style.width = "80px";
    document.getElementById("main").style.marginLeft = "80px";
    document.getElementById("users").style.marginLeft = "0px";
    $("#mySidebar").removeClass("navOpened");
   

    
}

var mouse_is_inside = false;
var friendNavOpen = false;

$('#friendWin').hover(function(){ 
  mouse_is_inside=true; 
}, function(){ 
  mouse_is_inside=false; 
});

$("body").mouseup(function(){ 
  if(mouse_is_inside == false) {
    $( ".searchUser" ).remove();
    document.getElementById("friendWin").style.height = "0px";
    document.getElementById("friendWin").style.border = "0px solid black";
    $("#friendWin").fadeOut(500);
  }
});

$("#addFriBtn .fa").click(function(){
    document.getElementById("friendWin").style.height = "100%";
    document.getElementById("friendWin").style.border = "1px solid black";
    $("#friendWin").fadeIn(500);
})

   
  


$("#mySidebar").click(function(){
  
  if($("#mySidebar").hasClass("navOpened"))
  {
    closeNav();
    
  } 
  else 
  {
    openNav();
    
  }

});

$(".logSwipe").click(function(){
  console.log("log");
  if($(".signSwipe").hasClass("active")){

    $(".signSwipe").removeClass("active");
    $(".logSwipe").addClass("active");

    $("#signUpPage").fadeOut();
    $("#loginPage").fadeIn();
    // $currentInput = $inputMessage.focus();
  } 
});

$(".signSwipe").click(function(){
  console.log("sign");
  if($(".logSwipe").hasClass("active")){

    $(".logSwipe").removeClass("active");
    $(".signSwipe").addClass("active");

    $("#loginPage").fadeOut();
    $("#signUpPage").fadeIn();
    // $currentInput = $signUsernameInput.focus();
  } 




});


// onClick="focusWhisp(this.val())"
    function focusWhisp(id)
    {
      $('#whispUser').val(id);
      // $(this).addClass("userFocus");
      $('.chatTitle').text(id);
    }

    
