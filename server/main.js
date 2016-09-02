import { Meteor } from 'meteor/meteor';
import fbgraph from 'fbgraph';
import { Relations, Friends, Emails, Notes } from '../both/collections.js'

Meteor.startup(() => {
  // code to run on server at startup
});

function reciprocates(senderId, receiverId, type) {
    var result = Relations.findOne({"senderId":receiverId, "receiverId":senderId, "type":type});
    var reciprocated = !(typeof result == 'undefined')
    return reciprocated
}
function get_email(id) {
    var doc = Emails.findOne({"id":id});
    return doc.email;
}
function processPair(id1, id2, type){
    email1 = get_email(id1)
    email2 = get_email(id2)
    Email.send({
        cc: [email1, email2],
        from:"matchmaker@marblespuzzle.com",
        subject:"Test email",
        text:email1 + " and " + email2 + " should " + type,
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
        Emails.insert(doc)
    },
    setNote : function({note}) {
        var id = Meteor.user().services.facebook.id;
        var selector = {"id":id};
        var datum = {"id":id, "note":note};
        Notes.upsert(selector, datum)
    },
    getNote : function({id}){
        var doc = Notes.findOne({"id":id});
        return doc["note"]
    },
    getMe : function({s}) {
    	fbgraph.setAccessToken(Meteor.user().services.facebook.accessToken);
    	var result = Meteor.wrapAsync(fbgraph.get)('me' + s)
    	return test()
    },
    addRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        doc = {"senderId":senderId, "receiverId":receiverId, "type":type,
            "senderMeteorId":Meteor.userId()};
        Relations.insert(doc);
        if (reciprocates(senderId, receiverId, type)) {
            processPair(senderId, receiverId, type);
        }
    },
    removeRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        Relations.remove({"senderId":senderId, "receiverId":receiverId, "type":type})
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
        if (!(Meteor.user() && Meteor.user().services)) {
            return false;
        }
        var user = Meteor.user().services.facebook
    	fbgraph.setAccessToken(user.accessToken);
        var goget = function(s) {
            fbgraph.get(s, Meteor.bindEnvironment(function(err, res) {
                if (res.paging && res.paging.next) {
                    goget(res.paging.next)
                }

                for (var i = 0; i < res["data"].length; i++) {
                    var datum = res["data"][i];

                    datum["senderId"]=user.id;
                    datum["senderMeteorId"] = Meteor.userId()

                    var selector = {};
                    selector["senderId"] = datum["senderId"];
                    selector["senderMeteorId"] = Meteor.userId()
                    selector["id"] = datum["id"];

                    Friends.upsert(selector, datum);
                }
            }));
        }
        goget('me/friends?fields=picture,name,link');
    	return true;
    }
})
