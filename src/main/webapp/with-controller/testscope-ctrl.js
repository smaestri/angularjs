angular.module('scopeExample', [])
.controller('MyController', ['$scope', function($scope) {
    this.username = 'World';

    this.sayHello = function() {
        $scope.greeting = 'Hello ' + this.username + '!';
    };
}]);

