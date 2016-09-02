import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
import { Mongo } from 'meteor/mongo';
import { Friends, Relations, Notes } from '../both/collections.js';

relations = Relations;

//XXX
//These should only need to be written once...
//I don't remember why this caused a problem before, probably some dumb reason
Meteor.methods({
    addRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        doc = {"senderId":senderId, "receiverId":receiverId, "type":type,
            "senderMeteorId":Meteor.userId()};
        Relations.insert(doc);
        if (!this.isSimulation){
            if (reciprocates(senderId, receiverId, type)) {
                processPair(senderId, receiverId, type);
            }
        }
    },
    removeRelation : function({receiverId, type}) {
        var senderId = Meteor.user().services.facebook.id;
        Relations.remove({"senderId":senderId, "receiverId":receiverId, "type":type})
        //permute(doc).forEach(function (x){
        //    Queue.remove(x)
        //})
    },
    setNote : function({note}) {
        var id = Meteor.user().services.facebook.id;
        var selector = {"id":id};
        var datum = {"id":id, "note":note};
        Notes.upsert(selector, datum)
    }
})
class ListCtrl {
	constructor($scope) {
        Meteor.subscribe('friends')
        Meteor.subscribe('relations')
        //XXX can probably remove getUserData?
        Meteor.subscribe("getUserData")
        Meteor.subscribe("notes")

		$scope.viewModel(this);

		this.helpers({
	      friends() {
	        return Friends.find();
	      }
	    });

		this.helpers({
	      relations() {
	        return Relations.find();
	      }
	    });

		// this.relationTypes = [
		// 	{type: 'date', text: 'Date'},
		// 	{type: 'hangout', text: 'Normal hanging out'},
		// 	{type: 'nonerotic', text: 'Definitely not romance'},
		// 	{type: 'fuck', text: 'Fuck'},
		// 	{type: 'fight', text: 'Fight'},
		// ];

		this.relationTypes = [
			{type: 'go on a date or something', text: 'Go on a date or something'},
			{type: 'hang out soon', text: 'Hang out soon'},
		];

		var tryToGetFriends = function() {
			Meteor.call('getFriends', {}, function(err, resp) {
				if (!resp) {
					setTimeout(tryToGetFriends, 500);
				}
			});
		};
		tryToGetFriends();
	}

    getNote(id) {
        var doc = Notes.findOne({id:id})
        if (!doc) {
            return '';
        }
        return doc.note

    }

    submitSelections() {
        Meteor.call("publishRelations")
    }

	getUserName() {
		if (!Meteor.user()) {
			return '';
		}
		return Meteor.user().profile.name;
	}

	getFacebookId() {
		if (!Meteor.user() || !Meteor.user().services) {
			return '';
		}
		return Meteor.user().services.facebook.id;
	}

	toggleRelation(receiverId, type) {
		if (this.relationExists(receiverId, type)) {
			Meteor.call('removeRelation', {receiverId: receiverId, type: type}, function(err) {
				// uhhhh
			});
		} else{
			Meteor.call('addRelation', {receiverId: receiverId, type: type}, function(err) {
				// uhhhh
			});
		}
	}

	getRelation(receiverId, type) {
		if (!this.relations) {
			return false;
		}

		return this.relations.find(function(relation) {
			return relation.receiverId == receiverId && relation.type == type;
		});
	}

	relationExists(receiverId, type) {
		if (this.getRelation(receiverId, type)) {
			return true;
		}
		return false;
	}

	login() {
		Meteor.loginWithFacebook({requestPermissions: ['user_friends', 'email']}, function(err){
			if (err) {
				throw new Meteor.Error("Facebook login failed");
            } else {
                Meteor.call("registerEmail");
				Meteor.call('getFriends', {});
            }
		});
	}

	logout() {
		Meteor.logout(function(err){
            if (err) {
                throw new Meteor.Error("Logout failed");
            }
        });
	}
}

export default List = angular.module('List', [
	angularMeteor
]).component('list', {
	templateUrl: '/client/stuff.html',
	controller: ['$scope', ListCtrl]
});

