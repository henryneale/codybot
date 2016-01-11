'use strict';

var mongoose = require('mongoose');
var Slack = require('slack-client');

var commands = require('./lib/commands.js');

var token = '' || process.env.SLACK_API_TOKEN;

var slack = new Slack(token, true, true);

mongoose.connect('mongodb://mongo1.sshbot.com/codybot');

var messageSchema = mongoose.Schema({
    type: String,
    channel: String,
    user: String,
    text: String,
    ts: String,
    team: String
});

var Message = mongoose.model('Message', messageSchema);

slack.on('open', function () {
  console.log("Connected to ", slack.team.name, "  as @", slack.self.name);
});

slack.on('message', function (message) {
  console.log('A new message: ', message.text);

  var msg = new Message({
    type: message.type,
    channel: message.channel,
    user: message.user,
    text: message.text,
    ts: message.ts,
    team: message.team
  });

  msg.save(function (err, msg) {
    if(err) {
      return console.log(err);
    }

    var channel = slack.getChannelGroupOrDMByID(message.channel);
    
    // Check to see if @codybot was tagged
    if(message.text.indexOf('<@U0J3GQGQ4>') === 0) {
      // codybot was tagged. 

      var msgArr = message.text.split(' ');
      var cmd = msgArr[1];
      console.log("cmd: ", cmd);
      if(typeof commands[cmd] === 'function') {
        msgArr.splice(0,2);
        commands[cmd](msgArr, message);
      } else {
        channel.send('codybot doesn\'t recognize the command you specified. Teach him by submitting a PR!');
      }
    }
  });
});

slack.on('error', function (err) {
  console.error(err);
});

slack.login();
