import angular from 'angular';
import angularMeteor from 'angular-meteor';
import nameHereList from './stuff';

angular.module('nameHere', [
	angularMeteor,
	nameHereList.name,
]);