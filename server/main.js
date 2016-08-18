import { Meteor } from 'meteor/meteor';
import fbgraph from 'fbgraph';

Meteor.startup(() => {
  // code to run on server at startup
});

Meteor.methods({
     getFriends : function() {
     	fbgraph.setAccessToken(Meteor.user().services.facebook.accessToken);
     	var result = Meteor.wrapAsync(fbgraph.get)('me/friends?fields=picture,name,link');
     	console.log(result);
     	return result;
     }
})
