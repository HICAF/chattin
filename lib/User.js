<<<<<<< HEAD
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: {type:Boolean, default: false},
  online: {type:Boolean, default: true},
  friends: [String],
  pending: [String],
  groups: [String],
  avatar: { 
    path: String, 
    contentType: String },
  created_at: {type:Date,default:Date.now}
});
// userSchema.index({'$**': 'text'});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
=======
// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  admin: {type:Boolean, default: false},
  online: {type:Boolean, default: true},
  friends: [String],
  pending: [String],
  groups: [String],
  avatar: { 
    path: String, 
    contentType: String },
  created_at: {type:Date,default:Date.now}
});
// userSchema.index({'$**': 'text'});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;
>>>>>>> origin/master
