var ceapp = angular.module('ceapp', ['sociocortex', 'mxl'])
    .value('scConnection', {
        baseUri: 'http://localhost:8083/intern/tricia',
        apiVersion: 'v1',
        authenticationMethod: 'jwt'
    });

ceapp.controller('testController', function ($scope, scAuth, scData) {

    scAuth.login('mustermann@test.sc', 'ottto').then(function () {        
        //$scope.expectedType = 'Number';
        //$scope.mxlParameters = 'list:Sequence<Customer>, map:Function<Customer,Number>';

        scData.Workspace.query(function (workspaces) {
            $scope.workspaces = workspaces;
        });

    });
});