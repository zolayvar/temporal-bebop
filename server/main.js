import { Meteor } from 'meteor/meteor';
import fbgraph from 'fbgraph';
import { Relations, Friends, Emails, Notes, LastReciprocated } from '../both/collections.js'

Meteor.startup(() => {
  // code to run on server at startup
});

function updateOnReciprocation(senderId, receiverId, type){
    let selector = {"senderId":senderId, "receiverId":receiverId, "type":type};
    Relations.remove(selector);
    let doc = {"senderId":senderId, "receiverId":receiverId, "type":type, "datetime":Date()}
    LastReciprocated.upsert(selector, doc)
}

function checkAndProcessReciprocity(senderId, receiverId, type){
    if (reciprocates(senderId, receiverId, type)) {
        email1 = getEmail(id1);
        email2 = getEmail(id2);
        Email.send({
            cc: [email1, email2],
            from:"matchmaker@reciprocity.io",
            subject:"Test email",
            text:email1 + " and " + email2 + " should " + type,
        })
        updateOnReciprocation(senderId, receiverId, type)
        updateOnReciprocation(receiverId, senderId, type)
    }
}

function reciprocates(senderId, receiverId, type) {
    var result = Relations.findOne({"senderId":receiverId, "receiverId":senderId, "type":type});
    var reciprocated = !(typeof result == 'undefined') && (result.published === true)
    return reciprocated
}
function getEmail(id) {
    var doc = Emails.findOne({"id":id});
    return doc.email;
}
function processPair(id1, id2, type){
    email1 = getEmail(id1)
    email2 = getEmail(id2)
    Email.send({
        cc: [email1, email2],
        from:"matchmaker@reciprocity.io",
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
        selector = {"senderId":senderId, "receiverId":receiverId, "type":type}
        doc = {"senderId":senderId, "receiverId":receiverId, "type":type,
            "senderMeteorId":Meteor.userId(), "published":false, "to_remove":false};
        Relations.upsert(selector, doc);
    },
    publishRelations : function() {
        let senderId = Meteor.user().services.facebook.id;
        Relations.remove(
            {"senderMeteorId":Meteor.userId(), "to_remove":true}
        );
        let updated_relations = Relations.find(
            {"senderMeteorId":Meteor.userId(), "published":false}
        );
        Relations.update(
            {"senderMeteorId":Meteor.userId(), "published":false},
            {$set: {"published":true}},
            {multi:true}
        );
        updated_relations.forEach(function (doc){
            checkAndProcessReciprocity(senderId, doc.receiverId, doc.type)
        })
    },
    removeRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        Relations.update(
            {"senderMeteorId":Meteor.userId(), "receiverId":receiverId, "type":type},
            {$set: {"to_remove":true}}
        )
        Relations.remove({"senderId":senderId, "receiverId":receiverId, "type":type})
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
