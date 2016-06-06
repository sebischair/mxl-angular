var ceapp = angular.module('ceapp', ['sociocortex', 'mxl']);

ceapp.controller('testController', function ($scope, scAuth, scData) {
    scAuth.login('sociocortex.sebis@tum.de', 'sebis');

    //$scope.expectedType = 'Number';
    //$scope.mxlParameters = 'list:Sequence<Customer>, map:Function<Customer,Number>';

    scData.Workspace.query(function (workspaces) {
        $scope.workspaces = workspaces;
    });
});
