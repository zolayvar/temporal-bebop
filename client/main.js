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

export default angular.module('nameHere', [
	angularMeteor
])

nameHere.component('nameHereList', {
	templateUrl: 'stuff.html',
	controller: NameHereListCtrl
});