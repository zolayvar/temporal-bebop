import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
import { Mongo } from 'meteor/mongo';
import { Friends, Relations, Notes, LastReciprocated, UserData } from '../both/collections.js';

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
        Relations.remove({"senderId":senderId, "receiverId":receiverId, "type":type, "reciprocated":false})
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

    subscribeToDBs() {
        Meteor.subscribe("friends")
        Meteor.subscribe("relations")
        Meteor.subscribe("userData")
        Meteor.subscribe("meteorUserData")
        Meteor.subscribe("notes")
        Meteor.subscribe("lastReciprocated")
    }

	constructor($scope) {
		var that = this;
        this.subscribeToDBs()

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

		this.relationTypes = [
			{type: 'dig a hole', text: 'Dig a hole'},
			{type: 'cut down a tree', text: 'Cut down a tree'},
		];

		// this.relationTypes = [
		// 	{type: 'go on a date or something', text: 'Go on a date or something'},
		// 	{type: 'hang out soon', text: 'Hang out soon'},
		// ];

		var tryToGetFriends = function() {
			Meteor.call('getFriends', {}, function(err, resp) {
				if (!resp) {
					setTimeout(tryToGetFriends, 500);
				}
			});
		};
		tryToGetFriends();

		var tryToGetPicture = function() {
			if (!Meteor.user() || !Meteor.user().services) {
	    		setTimeout(tryToGetPicture, 500);
	    		return;
	    	}
			Meteor.call('getPicture', {}, function(err, resp) {
				if (!resp || !resp.data || !resp.data.url) {
					setTimeout(tryToGetPicture, 500);
					return;
				}
				that.userPicture = resp.data.url;
			});
		};
		tryToGetPicture();

		this.myNoteText = this.getNote();
	}

	getUserData() {
		return UserData.findOne({id:this.getUserId()});
	}

	getMyNote() {
		return this.getNote(this.getUserId());
	}

    getNote(id) {
    	var id = id || this.getUserId();
        var doc = Notes.findOne({id:id})
        if (!doc) {
            return '';
        }
        return doc.note
    }

    submitSelections() {
        Meteor.call("publishRelations", {}, function(err, resp) {

        });
    }

    getUserId() {
    	if (!Meteor.user() || !Meteor.user().services) {
    		return;
    	}
    	return Meteor.user().services.facebook.id;
    }

	getUserName() {
		if (!Meteor.user()) {
			return '';
		}
		return Meteor.user().profile.name;
	}

	getUserLink() {
		if (!Meteor.user() || !Meteor.user().services) {
			return '';
		}
		return Meteor.user().services.facebook.link;
	}

    existsRelation() {
        let relation = Relations.findOne({reciprocated:true});
        return relation === undefined
    }

	getFacebookId() {
		if (!Meteor.user() || !Meteor.user().services) {
			return '';
		}
		return Meteor.user().services.facebook.id;
	}

	toggleRelation(receiverId, type) {
		if (this.shouldBeChecked(receiverId, type)){
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

	shouldBeChecked(receiverId, type) {
		var relation = this.getRelation(receiverId, type);

		return relation && !relation.to_remove;
	}

	needsSaving(receiverId, type) {
		var relation = this.getRelation(receiverId, type);

		if ((relation && !relation.published && !relation.to_remove) ||
			(relation && relation.published && relation.to_remove)) {
			this.somethingNeedsSaving = true;
			return true;
		}
		return false;
	}

	doesSomethingNeedSaving() {
		var that = this;
		var result = false;
		this.friends.forEach(function(friend) {
			that.relationTypes.forEach(function(relationType) {
				if (that.needsSaving(friend.id, relationType.type)) {
					result = true;
				}
			});
		});
		return result;
	}

	lastReciprocated(receiverId, type) {
		if (!Meteor.user() || !Meteor.user().services) {
			return;
		}
		return LastReciprocated.find({
			receiverId: receiverId,
			senderId: Meteor.user().services.facebook.id,
			type: type
		}).fetch();
	}

	setNote(noteText) {
		Meteor.call('setNote', {note: this.myNoteText});
	}

	login() {
        var that = this;
		Meteor.loginWithFacebook({requestPermissions: ['user_friends', 'email']}, function(err, resp){
			if (err) {
				throw new Meteor.Error("Facebook login failed");
            } else {
                that.subscribeToDBs()
                Meteor.call("registerUser");
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

