import angular from 'angular';
import angularMeteor from 'angular-meteor';
import list from './stuff';
import ngMaterial from 'angular-material';


angular.module('temporalBebop', [
	angularMeteor,
	list.name,
	ngMaterial,
]);