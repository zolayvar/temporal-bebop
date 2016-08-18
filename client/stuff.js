import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';

class NameHereListCtrl {
	constructor() {}

	getUserName() {
		if (!Meteor.user()) {
			return '';
		}

		return Meteor.user().services.facebook.name;
	}

	login() {
		Meteor.loginWithFacebook({}, function(err){
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