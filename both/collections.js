export const Relations = new Mongo.Collection("relations");
export const LastReciprocated = new Mongo.Collection("lastReciprocated")
export const Friends = new Mongo.Collection("friends");
export const Emails = new Mongo.Collection("email");
export const Notes = new Mongo.Collection("notes")

//these definitions are just to make the variables available from the console
relationsDB = Relations;
friendsDB = Friends;
emailsDB = Emails;
notesDB = Notes;
last_reciprocatedDB = LastReciprocated;

if (Meteor.isServer) {
  Meteor.publish('friends', function publishFriends() {
    return Friends.find({
        senderMeteorId: this.userId
    })
  });
  Meteor.publish('notes', function publishNotes() {
      var friendDocs = Friends.find({senderMeteorId: this.userId});
      var friends = []
      friendDocs.forEach(function(doc) {
          friends.push(doc["id"])
      })
      return Notes.find({"id": {$in: friends}})
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
