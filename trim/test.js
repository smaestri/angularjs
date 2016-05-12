var myModule = angular.module('myModule', [])
    .component('myComponent',  {
        template: "<input ng-model='$ctrl.testSma' ng-trim='false'> test :{{$ctrl.testSma}}",

        controller: function(){
            console.log('aa' + this.testSma);
        }, 
        bindings: {
            testSma: '<'
        }
    })


    .controller('testCtrl', function($scope){
       console.log('testCtrl');
        $scope.maVar = "                      test2";
    });

