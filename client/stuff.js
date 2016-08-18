import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
import fbgraph from 'fbgraph';

class NameHereListCtrl {
	constructor() {
		var that = this;
		this.friends = ['Paul Christiano', 'Katja Grace'];
		//fbgraph.setAppId('1737433616546480');
		//fbgraph.authorize({clientId: '1737433616546480', clientSecret: 'ed7070614f995ee9d8f522a66183f3fb'})
		//fbgraph.setAppSecret('ed7070614f995ee9d8f522a66183f3fb');
	}

    getUser() {
        return Meteor.user().services.facebook
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
		return this.getUser().name
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
