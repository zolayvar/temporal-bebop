import { Meteor } from 'meteor/meteor';
import fbgraph from 'fbgraph';

Meteor.startup(() => {
  // code to run on server at startup
});

Relations = new Mongo.Collection("relations")

Meteor.methods({
    addRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        Relations.insert({"senderId":senderId, "receiverId":receiverId, "type":type});
    },
    removeRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        Relations.remove({"senderId":senderId, "receiverId":receiverId, "type":type});
    },
    getRelations : function() {
        var cursor = Relations.find({"senderId":Meteor.user().services.facebook.id});
        var result = [];
        cursor.forEach(function(item) {
            result.push({"receiverId":item.receiverId, "type":item.type});
        })
        return result;
    },
     getFriends : function() {
     	fbgraph.setAccessToken(Meteor.user().services.facebook.accessToken);
     	var result = Meteor.wrapAsync(fbgraph.get)('me/friends?fields=picture,name,link');
     	console.log(result);
     	return result;
     }
})
