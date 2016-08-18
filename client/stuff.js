import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
import fbgraph from 'fbgraph';

class NameHereListCtrl {
	constructor() {
		var that = this;
		this.friends = ['Paul Christiano', 'Katja Grace'];
	}

    getFriends() {
		Meteor.call(
			'getFriends', {},
			function(err, result) {
				console.log(result);
			});
    }

	getUserName() {
		if (!Meteor.user()) {
			return '';
		}
		return Meteor.user().name
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
