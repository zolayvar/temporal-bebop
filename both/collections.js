export const Relations = new Mongo.Collection("relations");
export const Friends = new Mongo.Collection("friends");
export const Emails = new Mongo.Collection("email");

relations = Relations;
friends = Friends;
emails = Emails;

if (Meteor.isServer) {
  Meteor.publish('friends', function publishFriends() {
    return Friends.find({
        senderMeteorId: this.userId
    })
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

Relations.allow({
    insert: function (userId, doc) {
        console.log("inserting???")
        return Meteor.users().services.facebook.id === doc.senderId
    },
    remove: function (userId, doc) {
        console.log("removing???")
        return Meteor.users().services.facebook.id === doc.senderId
    },
    update: function (userId, doc) {
        return Meteor.users().services.facebook.id === doc.senderId
    }
})

