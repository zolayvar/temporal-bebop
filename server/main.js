import { Meteor } from 'meteor/meteor';
import fbgraph from 'fbgraph';

Meteor.startup(() => {
  // code to run on server at startup
});

Relations = new Mongo.Collection("relations");
Emails = new Mongo.Collection("email");
//Queue = new Mongo.Collection("queue")

function reciprocates(senderId, receiverId, type) {
    var result = Relations.findOne({"senderId":receiverId, "receiverId":senderId, "type":type});
    console.log(result);
    var reciprocated = !(typeof result == 'undefined')
    console.log(reciprocated)
    console.log(typeof result)
    return reciprocated
}
function get_email(id) {
    var doc = Emails.findOne({"id":id});
    return doc.email;
}
function processPair(id1, id2, type){
    Email.send({
        cc: [get_email(id1), get_email(id2)],
        from:"matchmaker@marblespuzzle.com",
        subject:"Test email",
        text:"This is a test!"
    })
}
//function permute(doc) {
//    newDoc = doc
//    newDoc.senderId = doc.receiverId
//    newDoc.receiverId = doc.senderId
//    return [doc, newDoc]
//}

Meteor.methods({
    registerEmail : function() {
        userdata = Meteor.user().services.facebook
    	fbgraph.setAccessToken(userdata.accessToken)
    	var result = Meteor.wrapAsync(fbgraph.get)('me?fields=email')
        var doc = {"id":userdata.id, "email":result.email}
        console.log(doc)
        Emails.insert(doc)
    },
    getMe : function({s}) {
    	fbgraph.setAccessToken(Meteor.user().services.facebook.accessToken);
    	var result = Meteor.wrapAsync(fbgraph.get)('me' + s)
    	return test()
    },
    addRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        doc = {"senderId":senderId, "receiverId":receiverId, "type":type};
        Relations.insert(doc);
        if (reciprocates(senderId, receiverId, type)) {
            processPair(senderId, receiverId, type);
        }
    },
    removeRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        Relations.remove({"senderId":senderId, "receiverId":receiverId, "type":type});
        //permute(doc).forEach(function (x){
        //    Queue.remove(x)
        //})
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
    	return result;
    }
})
