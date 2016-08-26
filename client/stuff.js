import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
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

		// this.relationTypes = [
		// 	{type: 'date', text: 'Date'},
		// 	{type: 'hangout', text: 'Normal hanging out'},
		// 	{type: 'nonerotic', text: 'Definitely not romance'},
		// 	{type: 'fuck', text: 'Fuck'},
		// 	{type: 'fight', text: 'Fight'},
		// ];

		this.relationTypes = [
			{type: 'a', text: 'Play hotseat'},
			{type: 'b', text: 'Arm wrestle'},
			{type: 'c', text: 'Become nemesis'},
			{type: 'd', text: 'Marry'},
			{type: 'e', text: 'Fight'},
		];

		// Fetch my friends
		if (Meteor.user()) {
			Meteor.call('getFriends', {});
		}
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
			Meteor.call('addRelation', {receiverId: receiverId, type: type}, function(err) {
				// uhhhh
			});
		} else {
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

