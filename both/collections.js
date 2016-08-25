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
}
