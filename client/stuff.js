import angular from 'angular';
import angularMeteor from 'angular-meteor';
import template from './stuff.html';

class NameHereListCtrl {
	constructor() {
		this.tasks = [
			{text: 'This is task 1'},
			{text: 'This is task 2'},
			{text: 'This is task 3'}
		];
	}
}

export default angular.module('nameHereList', [
	angularMeteor
]).component('nameHereList', {
	templateUrl: '/client/stuff.html',
	controller: NameHereListCtrl
});