import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
import fbgraph from 'fbgraph';

class NameHereListCtrl {
	constructor() {
		let that = this;
        Meteor.subscribe('friends')
        Meteor.subscribe('relations')
		Meteor.call(
			'getFriends', {},
			function(err, result) {
				that.friends = result.data;
			});

		this.relationTypes = [
			{type: 'date', text: 'Date'},
			{type: 'hangout', text: 'Normal hanging out'},
			{type: 'nonerotic', text: 'Definitely not romance'},
			{type: 'fuck', text: 'Fuck'},
			{type: 'fight', text: 'Fight'},
		];

		this.getRelations();
	}

    getFriends() {
    	return this.friends;
    }

	getUserName() {
		if (!Meteor.user()) {
			return '';
		}
		return Meteor.user().profile.name;
	}

	toggleRelation(receiverId, type) {
		if (!this.relationExists(receiverId, type)) {
			this.relations.push({receiverId: receiverId, type: type});
			Meteor.call('addRelation', {receiverId: receiverId, type: type}, function(err) {
				// uhhhh
			});
		} else {
			var i = this.relations.findIndex(function(relation) {
				return relation.receiverId == receiverId && relation.type == type;
			});
			this.relations.splice(i, 1);
			Meteor.call('removeRelation', {receiverId: receiverId, type: type}, function(err) {
				// uhhhh
			});
		}
	}

	getRelations() {
		var that = this;
		Meteor.call('getRelations', {}, function(err, result) {
			that.relations = result;
		});
	}

	relationExists(receiverId, type) {
		if (!this.relations) {
			return false;
		}

		return this.relations.some(function(relation) {
			return relation.receiverId == receiverId && relation.type == type;
		});
	}

	login() {
		Meteor.loginWithFacebook({requestPermissions: ['user_friends', 'email']}, function(err){
			if (err) {
				throw new Meteor.Error("Facebook login failed");
            } else {
                Meteor.call("registerEmail")
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

export default angular.module('nameHereList', [
	angularMeteor
]).component('nameHereList', {
	templateUrl: '/client/stuff.html',
	controller: NameHereListCtrl
})
