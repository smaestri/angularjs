var myModule = angular.module('myModule', [])
    .controller('MyCtrl3', ['$scope', '$timeout', '$element', function ($scope, $timeout, $element) {

        // this.$timeout = $timeout;

        this.$onInit = function () {

            console.log('init');
            $scope.inputValue = 'Hello!';
            $scope.showInput = false;
        }

        console.log('entering ctrl2');


        $scope.saveEdit = function () {
            console.log('saveEdit');
            console.log($scope.inputValue);
        }

        $scope.editCell = function () {
            console.log('editCell');

        //    $timeout(() => {
                console.log('showInput');
                $scope.showInput = true;
         //   });

            //set focus

            /*
            $timeout(() => {
                console.log($element.find('input'));
                $element.find('input').focus();
            });
*/
        }

    }])
    .directive()
    
    ;