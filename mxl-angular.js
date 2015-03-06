angular.module('mxl', ['ui.codemirror'])
.directive('mxlExpression', function ($timeout, uiCodemirrorConfig) {
    return {
        restrict: 'E',
        require: ["^ngModel"],
        scope:
            {
                expression: '=ngModel',
                lineNumbers: '@mxlLinenumbers',
                additionalAutoCompletionHints: '=mxlAutocompletionhints',
                runTest: '&mxlRuntest',
                validate: '&mxlValidate'
            },
        controller: function ($scope) {    
            uiCodemirrorConfig.codemirror = {
                lineWrapping: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                highlightSelectionMatches: { showToken: /\w/ },
                viewportMargin: Infinity,
                lineNumbers: $scope.lineNumbers && $scope.lineNumbers === "true",
                mode: 'mxl',
                debounce: 2000,
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
                }, ($scope.runTest) ? {
                    "F9": function (cm) {
                        return $scope.runTest();
                    }
                } : {})
            };

            CodeMirror.commands.autocomplete = function (cmeditor) {
                var autoCompletionOptions = { completeSingle: false };

                if ($scope.additionalAutoCompletionHints) {
                    autoCompletionOptions.additionalHints = $scope.additionalAutoCompletionHints;
                }

                CodeMirror.showHint(cmeditor, CodeMirror.hint.mxl, autoCompletionOptions);
            };

        },
        templateUrl: 'mxl/mxl-template.html'
    }
});