import angular from 'angular';
import angularMeteor from 'angular-meteor';
import nameHereList from './stuff';
import ngMaterial from 'angular-material';


angular.module('nameHere', [
	angularMeteor,
	nameHereList.name,
	ngMaterial,
]);