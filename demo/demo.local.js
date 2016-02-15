var ceapp = angular.module('ceapp', ['sociocortex', 'mxl'])
    .value('scConnection', {
        baseUri: 'http://localhost:8083/intern/tricia',
        apiVersion: 'v1'
    });

ceapp.controller('testController', function ($scope, scAuth) {
    scAuth.login('mustermann@test.sc', 'ottto');

    //$scope.expectedType = 'Number';
    //$scope.mxlParameters = 'list:Sequence<Customer>, map:Function<Customer,Number>';
    $scope.mxlValue = 'find Order.select(Customer.Turnover)';
    $scope.workspaceId = 'northwind';
});
