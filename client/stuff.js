import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';
import fbgraph from 'fbgraph'

class NameHereListCtrl {
	constructor() {
		this.friends = ['Paul Christiano', 'Katja Grace'];
	}

    getUser() {
        return Meteor.user().services.facebook
    }

    query(q) {
        var data = Meteor.async(function(done) {
            fbgraph.get(q, function(err, res) {
                           done(null, res);
                  });
        })
        return data.result
    }

	getUserName() {
		if (!Meteor.user()) {
			return '';
		}

		return this.getUser().name
	}

	login() {
        let that = this
		Meteor.loginWithFacebook({}, function(err){
			if (err) {
				throw new Meteor.Error("Facebook login failed");
            } else {
                fbgraph.setAccessToken(that.getUser().accessToken)
                fbgraph.get("me", function(err, res){
                    console.log(res)
                })
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
