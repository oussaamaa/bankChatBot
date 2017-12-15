'use strict';

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server
  const PAGE_ACCESS_TOKEN =  process.env.PAGE_ACCESS_TOKEN;
  const token ="EAAC3y4eL5oEBAFjDHuH6DvyggNnrBACCTEbL0aZB20uOO8IUsbvZCrHkHOlVRDJjfkYvRjpY720lDb9faVudN96AsuL1JaFTJFaCkzUnKaBoR8ZBtTdh4OGBWLjNGgblGkbIhtZCrokwt6IGgANpZCSgyLUzg4KZB6hF0BZBRT0YAZDZD";


var admin = require("firebase-admin");

var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://krazybits-cfc64.firebaseio.com"
});


var database = admin.database();
// Sets server port and logs message on success
app.listen(3777, () => console.log('webhooks is listening'));

//console.log("hekekekekke");;
// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {
  // Parse the request body from the POST
  let body = req.body;
  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

              var pageID = entry.id;
              var timeOfEvent = entry.time;
              // Iterate over each messaging event
              entry.messaging.forEach(function (event) {
                  if (event.message) {

                      receivedMessage(event);
                  } else if (event.postback) {
                      receivedPostback(event);
                  } else {
                      //console.log("Webhook received unknown event: ", event);
                  }
              });

    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    var quick_reply = message.quick_reply ;


    var messageId = message.mid;
    var messageText = message.text;
    var messageAttachments = message.attachments;
    sendReadReceipt(senderID);
    //sendReadReceipt(senderID, recipientID);
    if (messageText === "MMM NEVERMIND") {
      sendTextMessage(senderID, "OK.. Maybe Next Time");
    }
    else if (messageText) {
      return admin.database().ref('/data-tn/offres-tn/offres/').once('value').then(function(snapshot) {

        var   jobData = snapshot.val();
        //console.log(jobData);
        var messages = [];

        for (var elm in jobData) {
          console.log(jobData[elm].title);
          var message = {
                      title: jobData[elm].title,
                      subtitle: "21/12/2012",
                      item_url: "www.emploi.rn.tn/"+jobData[elm].url ,
                      image_url: jobData[elm].image,
                      buttons: [{
                          type: "postback",
                          title: "MMM NEVERMIND",
                          payload: "dislike"
                      }, {
                          type: "postback",
                          title: "SURE! I AGREE",
                          payload: "like"
                      }]
                  } ;
          messages.push(message);
        }
        sendTextMessage(senderID, "Patientez SVP..");
        sendGenericMessage(senderID, messages);
        console.log(messages);
     });
      }


     else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {

  var messageData = {
      recipient: {
          id: recipientId
      },
      message: {
          text: messageText
      }
  };

    callSendAPI(messageData);
}

function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });

}

function sendReadReceipt(recipientId) {
    console.log("Sending a read receipt to mark message as seen");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "mark_seen"
    };



    callSendAPI(messageData);
}

function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    if (payload === "dislike") {
        sendTextMessage("OK.. Maybe Next Time");
    }

    //console.log("postback for user %d and page %d with payload '%s' " +"at %d", senderID, recipientID, payload, timeOfPostback);

    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
    sendTextMessage(senderID, "Postback called", recipientID);
}

function sendGenericMessage(recipientId, messages) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: messages
                }
            }
        }
    };

    callSendAPI(messageData);
}
// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {


  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "hello123456";

  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
