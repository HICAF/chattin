var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var chatSchema = new Schema({
	groupName: String,
	groupAdmin:[String],
	messages:[{
		username: String,
		message: String,
		created: {type: Date, default: Date.now}
	}]
  
});

// the schema is useless so far
// we need to create a model using it
var Chat = mongoose.model('Group', chatSchema);

// make this available to our users in our Node applications
module.exports = Chat;