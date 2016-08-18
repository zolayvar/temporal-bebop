import { Meteor } from 'meteor/meteor';
import fbgraph from 'fbgraph';

Meteor.startup(() => {
  // code to run on server at startup
});


Test = new Mongo.Collection("test")

Meteor.methods({
     testInsert : function({a, b}) {
         Test.insert({"a":a, "b":b})
     },
     testGet : function({a}) {
         return Test.findOne({"a":a})
     },
     id : function() {
         return this.userId
     },
     getFriends : function() {
     	fbgraph.setAccessToken(Meteor.user().services.facebook.accessToken);
     	var result = Meteor.wrapAsync(fbgraph.get)('me/friends');
     	console.log(result);
     	return result;
     }
})
