import { Meteor } from 'meteor/meteor';
import fbgraph from 'fbgraph';
import { Relations, Friends, UserData, Notes, LastReciprocated } from '../both/collections.js'
import { appId, appSecret } from './social-config.js'

Migrations.add({
    version: 1,
    name: "store notes in friend database",
    up: function() {
        Notes.find({}).forEach(function(item){
            Friends.update({id:item.id}, {$set: {note:item.note}}, {multi:true});
            UserData.update({id:item.id}, {$set:{note:item.note}})
        })
    },
    down: function() {
        UserData.find({}).forEach(function(item){
            if (item.note){
                Notes.upsert({meteorId:item.meteorId}, {$set: {
                    note: item.note,
                    meteorId:item.meteorId,
                    id: item.id,
                }})
            }
        })
    }
})

Meteor.startup(() => {
  Friends._ensureIndex({ "senderId": 1});
  Friends._ensureIndex({ "senderMeteorId": 1});
  Friends._ensureIndex({ "id": 1});
  UserData._ensureIndex({ "id": 1});
  Relations._ensureIndex({ "senderId": 1});
  Relations._ensureIndex({ "senderMeteorId": 1});
  Relations._ensureIndex({ "id": 1});
  Notes._ensureIndex({"id":1})
  Notes._ensureIndex({"meteorId":1})
  Migrations.migrateTo('latest')
});

function updateOnReciprocation(senderId, receiverId, type){
    let selector = {"senderId":senderId, "receiverId":receiverId, "type":type};
    Relations.update(selector, {$set: {"reciprocated":true}})
    let doc = {"senderId":senderId, "receiverId":receiverId, "type":type, "datetime":Date()}
    LastReciprocated.upsert(selector, {$set:doc})
}
function checkAndProcessReciprocity(id1, id2, type){
    if (reciprocates(id1, id2, type)) {
        email1 = getEmail(id1);
        email2 = getEmail(id2);
        name1 = getName(id1);
        name2 = getName(id2);
        emailForReciprocity(email1, email2, name1, name2, type);
        notifyForReciprocity(id1, name2, type)
        notifyForReciprocity(id2, name1, type)
        updateOnReciprocation(id1, id2, type);
        updateOnReciprocation(id2, id1, type);
        markFriendsAsReciprocating(id1, id2);
        return true;
    }
    return false;
}

function markFriendsAsReciprocating(id1, id2) {
    Friends.update({senderId: id1, id: id2}, {$inc: {reciprocations: 1}});
    Friends.update({senderId: id2, id: id1}, {$inc: {reciprocations: 1}});
}

function reciprocates(senderId, receiverId, type) {
    var result = Relations.findOne({"senderId":receiverId, "receiverId":senderId, "type":type});
    var reciprocated = !(typeof result == 'undefined') && (result.presentOnServer === true)
    return reciprocated
}
function getEmail(id) {
    var doc = UserData.findOne({"id":id});
    return doc.email
}
function getFirstName(id) {
    return getName(id).split(" ")[0]
}
function getName(id) {
    var doc = UserData.findOne({"id":id});
    return doc.name
}
function getId(meteorId) {
    var doc = UserData.findOne({"meteorId":meteorId});
    return doc.id
}
function getDescription(type) {
    let descriptions = {
        "hang out soon": "hang out soon",
        "date or something": "go on a date or something",
    }
    return descriptions[type];
}
function emailForReciprocity(email1, email2, name1, name2, type){
    firstname1 = name1.split(" ")[0];
    firstname2 = name2.split(" ")[0];
    let description = getDescription(type);
    Email.send({
        cc: [email1, email2],
        from:"meddler@reciprocity.io",
        subject:firstname1 + " and " + firstname2 + " want to " + description,
        replyTo:"meddler@mg2.reciprocity.io",
        html:"Dear " + name1 + " and " + name2 +",<br><br>Good news! You both want to " + description + ". You can use this thread to organize if you want.<br><br>Love,<br>Paul, Katja, and Steph",
    });
}
function notifyForReciprocity(id1, name2, type) {
    notify(id1, "Something has happened!")
}
function notify(id, message) {
    let query = "/oauth/access_token?client_id="+appId+"&client_secret="+appSecret+"&grant_type=client_credentials";
    let result = Meteor.wrapAsync(fbgraph.get)(query);
    fbgraph.post(id + "/notifications?template="+message+"&access_token="+result.access_token, (err, resp) => console.log(err, resp))
}

function registerUser(userToRegister) {
    if (!(userToRegister && userToRegister.services)) {
        return false;
    }

    let user = userToRegister.services.facebook;
    let myInfo = Meteor.wrapAsync(fbgraph.get)('me?fields=email,name,picture,link&access_token='+user.accessToken);
    let myUserData = UserData.findOne({"id":user.id})
    let startTime = Date.now();
    let registerFriend = function(selector, datum, startTime) {
        let toSet = {};
        Object.assign(toSet, selector);
        Object.assign(toSet, datum);
        //this causes the entries to be inserted in reverse order, preventing jostling
        let adjustedTime = startTime - (Date.now() - startTime);
        Friends.upsert(selector, {
            $set: toSet,
            $setOnInsert: {date_met: adjustedTime, reciprocations:0},
        })
    }
    let allFriends = []

    let myDatum = {}
    myDatum.picture = myInfo .picture;
    myDatum.link = myInfo.link;
    myDatum.name = myInfo.name;
    myDatum.id = myInfo.id;
    myDatum.note = myUserData.note;
    
    let getFriends = function(s, shouldCullNonFriends) {
        fbgraph.get(s +"&access_token="+user.accessToken, Meteor.bindEnvironment(function(err, res) {
            //if (res.paging && res.paging.next) {
            //    getFriends(res.paging.next, false)
            //}

            for (var i = 0; i < res["data"].length; i++) {
                let friendInfo = res["data"][i]
                let friendUserData = UserData.findOne({"id":friendInfo.id});
                if (friendUserData) {

                    let friendDatum = {};
                    friendDatum.picture = friendInfo.picture;
                    friendDatum.link = friendInfo.link;
                    friendDatum.name = friendInfo.name;
                    friendDatum.id = friendInfo.id;
                    friendDatum.note = friendUserData.note;

                    allFriends.push(friendInfo.id)

                    var selector = {};
                    selector["senderId"] = user.id;
                    selector["senderMeteorId"] = userToRegister._id;
                    selector["id"] = friendInfo.id;

                    if (user.id == friendInfo.id){
                        console.log("user:", user, "friendInfo:", friendInfo);
                    }
                    registerFriend(selector, friendDatum, startTime)

                    let reciprocalSelector = {}
                    reciprocalSelector["senderId"] = friendInfo.id;
                    reciprocalSelector["senderMeteorId"] = friendUserData.meteorId;
                    reciprocalSelector["id"] = myInfo.id;

                    if (reciprocalSelector.id == friendInfo.id){
                        console.log("myInfo:", myInfo, "friendInfo:", friendInfo);

                    }
                    registerFriend(reciprocalSelector, myDatum, startTime)
                }
            }
            if (shouldCullNonFriends ) {
                Friends.remove({senderId:user.id, id:{$nin:allFriends}})
                Friends.remove({id:user.id, senderId:{$nin:allFriends}})
            }
        }));
    }
    getFriends('me/friends?limit=5000&fields=picture,name,link', true);
    let selector = {"id":user.id}
    let doc = {
        "id":user.id,
        "email":myInfo.email,
        "name":myInfo.name,
        "meteorId":userToRegister._id,
        "picture":myInfo.picture,
    }
    UserData.upsert(selector, {$set: doc, $setOnInsert: {"joined":Date.now()}});
    return true;

}

Accounts.onLogin(function(logon){
    registerUser(logon.user)
})



Meteor.methods({
    registerUser : function() {
        registerUser(Meteor.user())
    },
    notify : function({receiverId, type}) {
        let senderId = Meteor.user().services.facebook.id;
        let selector = {"senderId":senderId, "receiverId":receiverId,
            "type":type, "reciprocated":true};
        let updated = Relations.update(selector, {$set: {"alerted":true}});
        return (updated > 0)
    },
    setNote : function({note}) {
        var truncatedNote = note.substring(0, 141);
        var id = Meteor.user().services.facebook.id;
        var meteorId = Meteor.userId()

        Notes.upsert({"id":id}, {$set: {"id":id, "meteorId":meteorId, "note":truncatedNote}});
        Friends.update({"id":id}, {$set:{"note":truncatedNote}}, {multi:true});
        UserData.update({"id":id}, {$set:{"note":truncatedNote}});
    },
    getNote : function({id}){
        var doc = Notes.findOne({"id":id});
        return doc["note"]
    },

    getPicture : function() {
    	return Meteor.wrapAsync(fbgraph.get)('me?fields=picture&access_token='+user.accessToken).picture
    },
    getMe : function({s}) {
    	var result = Meteor.wrapAsync(fbgraph.get)('me' + s + "&access_token=" + user.accessToken)
    	return result
    },
    addRelation : function({receiverId, type}) {
        let senderId = Meteor.user().services.facebook.id;
        let selector = {"senderId":senderId, "receiverId":receiverId, "type":type};
        let doc = {"presentLocally":true, "senderMeteorId":Meteor.userId(), "reciprocated":false}
        Object.assign(doc, selector);
        Relations.upsert(selector, {$set: doc})
    },
    removeRelation : function({receiverId, type}) {
        let senderId = Meteor.user().services.facebook.id;
        let selector = {"senderId":senderId, "receiverId":receiverId, "type":type, "reciprocated":false};
        let doc = {"presentLocally":false}
        Relations.update(selector, {$set: doc})
    },
    publishRelations : function() {
        let senderId = Meteor.user().services.facebook.id;
        Relations.remove(
            {"senderId":senderId, "presentLocally":false}
        );
        let updated_relations = Relations.find({$and:[
            {"senderId":senderId},
            {$or:[ {"presentOnServer":{$exists: false}}, {"presentOnServer":false} ]},
            {"presentLocally":true},
        ]}).fetch();
        Relations.update(
            {"senderId":senderId, "presentLocally":true},
            {$set: {"presentOnServer":true}},
            {multi:true}
        );
        return updated_relations.filter(function (doc){
            return checkAndProcessReciprocity(senderId, doc.receiverId, doc.type);
        })
    },
    getRelations : function() {
        var cursor = Relations.find({"senderId":Meteor.user().services.facebook.id});
        var result = [];
        cursor.forEach(function(item) {
            result.push({"receiverId":item.receiverId, "type":item.type});
        })
        return result;
    },
})
