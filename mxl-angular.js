angular.module('mxl', ['ui.codemirror'])
.directive('mxlExpression', function ($timeout, uiCodemirrorConfig, scService) {
    return {
        restrict: 'E',
        require: ["^ngModel"],
        scope:
            {
                expression: '=ngModel',
                workspace: '@scWorkspace',
                lineNumbers: '@scLinenumbers',
                thisType: '@scTypeofthis',
                parameters: '@scParameters',
                enableTest: '@scEnabletest',
                mxlMode: '@scMxlmode'
            },
        controller: function ($scope) {
            $scope.testExpression = function () {
                alert($scope.expression);
            };
            
            uiCodemirrorConfig.codemirror = {
                lineWrapping: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                highlightSelectionMatches: { showToken: /\w/ },
                viewportMargin: Infinity,
                lineNumbers: $scope.lineNumbers && $scope.lineNumbers === "true",
                mode: 'mxl',
                debounce: 2000,
                mxlMode: $scope.mxlMode,
                theme: 'mxl',
                extraKeys: angular.extend({
                    "Ctrl-Space": "autocomplete",
                    "Tab": false,
                    "Shift-Tab": false,
                    "'.'": function (cm) {
                        $timeout(function () { cm.execCommand("autocomplete"); }, 100, false);
                        return CodeMirror.Pass;
                    },
                    "esc": function (cm) {
                        return CodeMirror.Pass;
                    }
                }, ($scope.enableTest && $scope.enableTest === 'true') ? { "F9": $scope.testExpression } : {})
            };
                        
            scService.getAutoCompletionHints($scope.workspace).then(function (autoCompletionHints) {
                CodeMirror.commands.autocomplete = function (cmeditor) {
                    CodeMirror.showHint(cmeditor, CodeMirror.hint.mxl, { completeSingle: false, additionalHints: autoCompletionHints });
                };
            });

            /*
            $scope.mxlCursorCol = 1;

            $scope.codeMirrorLoaded = function (cmeditor) {

                $timeout(function () {
                    cmeditor.on('cursorActivity', function () {
                        $scope.$apply(function () {
                            var pos = cmeditor.getCursor();
                            $scope.mxlCursorCol = pos.ch + 1;
                        });
                    });
                }, 0, false);
            }*/

        },
        templateUrl: 'sc/mxl/sc-mxl.html'
    }
});