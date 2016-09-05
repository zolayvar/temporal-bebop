export const Relations = new Mongo.Collection("relations");
export const LastReciprocated = new Mongo.Collection("lastReciprocated")
export const Friends = new Mongo.Collection("friends");
export const UserData = new Mongo.Collection("userdata");
export const Notes = new Mongo.Collection("notes")

//these definitions are just to make the variables available from the console
relationsDB = Relations;
friendsDB = Friends;
userDataDB = UserData;
notesDB = Notes;
lastReciprocatedDB = LastReciprocated;

if (Meteor.isServer) {
  Meteor.publish('friends', function publishFriends() {
    return Friends.find({
        senderMeteorId: this.userId
    })
  });
  Meteor.publish('lastReciprocated', function publishLastReciprocated() {
      let userdata = UserData.findOne({"meteorId":this.userId});
      if (!userdata) {
          return this.ready()
      }
      senderId = userdata.id;
      return LastReciprocated.find({
          senderId: senderId
      })
  })
  Meteor.publish('notes', function publishNotes() {
      var friendDocs = Friends.find({senderMeteorId: this.userId});
      var friends = []
      friendDocs.forEach(function(doc) {
          friends.push(doc["id"])
      })
      var id = UserData.findOne({"meteorId":this.userId}).id
      friends.push(id)
      return Notes.find({"id": {$in: friends}});
  });
  Meteor.publish('relations', function publishRelations() {
    return Relations.find({
        senderMeteorId: this.userId
    })
  });
  Meteor.publish("userData", function () {
    return UserData.find({meteorId: this.userId});
  });
  Meteor.publish("meteorUserData", function() {
      return Meteor.users.find({_id: this.userId})
  })
}
