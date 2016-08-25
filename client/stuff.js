import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
import fbgraph from 'fbgraph';
import { Mongo } from 'meteor/mongo';
import { Friends, Relations } from '../both/collections.js';
import { Session } from 'meteor/session';

class ListCtrl {
	constructor($scope) {
        Meteor.subscribe('friends')
        Meteor.subscribe('relations')
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
			{type: 'date', text: 'Date'},
			{type: 'hangout', text: 'Normal hanging out'},
			{type: 'nonerotic', text: 'Definitely not romance'},
			{type: 'fuck', text: 'Fuck'},
			{type: 'fight', text: 'Fight'},
		];

		// Fetch my friends
		Meteor.call('getFriends', {});
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

export default List = angular.module('List', [
	angularMeteor
]).component('list', {
	templateUrl: '/client/stuff.html',
	controller: ['$scope', ListCtrl]
});

