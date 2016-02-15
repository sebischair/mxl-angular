var ceapp = angular.module('ceapp', ['sociocortex', 'mxl']);

ceapp.controller('testController', function ($scope, scAuth) {
    scAuth.login('sociocortex.sebis@tum.de', 'sebis');

    //$scope.expectedType = 'Number';
    //$scope.mxlParameters = 'list:Sequence<Customer>, map:Function<Customer,Number>';
    $scope.mxlValue = 'find Order.select(Customer.Turnover)';
    $scope.workspaceId = '107yhdgc7q9u6';
});
