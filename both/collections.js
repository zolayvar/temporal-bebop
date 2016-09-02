export const Relations = new Mongo.Collection("relations");
export const Friends = new Mongo.Collection("friends");
export const Emails = new Mongo.Collection("email");
export const Notes = new Mongo.Collection("notes")

//these definitions are just to make the variables available from the console
relations_db = Relations;
friends_db = Friends;
emails_db = Emails;
notes_db = Notes;

if (Meteor.isServer) {
  Meteor.publish('friends', function publishFriends() {
    return Friends.find({
        senderMeteorId: this.userId
    })
  });
  Meteor.publish('notes', function publishNotes() {
      var friend_docs = Friends.find({senderMeteorId: this.userId});
      var friends = []
      friend_docs.forEach(function(doc) {
          friends.push(doc["id"])
      })
      return Notes.find({"id": 1087045104666577})//{$in: friends}})
  });
  Meteor.publish('relations', function publishRelations() {
    return Relations.find({
        senderMeteorId: this.userId
    })
  });
  Meteor.publish("getUserData", function () {
    return Meteor.users.find({_id: this.userId});
  });
}
