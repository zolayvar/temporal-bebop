import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
import fbgraph from 'fbgraph';

class NameHereListCtrl {
	constructor() {
		this.getFriends();
	}

    getFriends() {
    	let that = this;
		Meteor.call(
			'getFriends', {},
			function(err, result) {
				that.friends = result.data;
			});
    }

	getUserName() {
		if (!Meteor.user()) {
			return '';
		}
		return Meteor.user().profile.name;
	}

	login() {
		Meteor.loginWithFacebook({requestPermissions: ['user_friends']}, function(err){
			if (err) {
				throw new Meteor.Error("Facebook login failed");
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
});
