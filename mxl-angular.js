'use strict';

angular.module('mxl', ['ngDialog'])
.directive('mxlExpression', function ($timeout, $q, ngDialog) {
    return {
        restrict: 'E',
        require: ["^ngModel"],
        scope:
            {
                expression: '=ngModel',
                lineNumbers: '@mxlLinenumbers',
                readOnly: '@mxlReadonly',
                debounce: '@mxlDebounce',
                additionalAutoCompletionHints: '=mxlAutocompletionhints',
                runTest: '&mxlRuntest',
                validateMxl: '&mxlValidate'
            },
        link: function ($scope, $element, $attrs, ctrl) {
           
            function newCodemirrorEditor($element, codemirrorOptions) {
                var codemirror;
                $element.html('');
                codemirror = new window.CodeMirror(function (cm_el) {
                    $element.append(cm_el);
                }, codemirrorOptions);
                return codemirror;
            }

            function normalizeScopeValue() {
                $scope.lineNumbers = $scope.$eval($scope.lineNumbers);
                $scope.readOnly = $scope.$eval($scope.readOnly);
                if(!$attrs.mxlValidate)
                {
                    $scope.validateMxl = null;
                }
                if (!$attrs.mxlRuntest || $scope.readOnly) {
                    $scope.runTest = null;
                }
            }

            function configNgModelLink(codemirror, ctrl, $scope) {

                ctrl.$formatters.push(function (value) {
                    if (angular.isUndefined(value) || value === null) {
                        return '';
                    }
                    return value;
                });

                ctrl.$render = function () {
                    codemirror.setValue(ctrl.$viewValue || '');
                };

                ctrl.$asyncValidators.typeChecking = function (modelValue, viewValue) {
                    if (codemirror.options.validateMxl) {
                        return codemirror.options.validateMxl(modelValue, viewValue);
                    }
                    return $q.when();
                };

                codemirror.on('change', function (instance) {
                    var newValue = instance.getValue();
                    if (newValue !== ctrl.$viewValue) {
                        if (codemirror.options.debounce) {
                            if ($scope.debounceUpdate) {
                                $timeout.cancel($scope.debounceUpdate);
                            }

                            $scope.$evalAsync(function () {
                                $scope.debounceUpdate = $timeout(function () {
                                    ctrl.$setViewValue(newValue);
                                }, codemirror.options.debounce);
                            });
                        }
                        else {

                            $scope.$evalAsync(function () {
                                ctrl.$setViewValue(newValue);
                            });
                        }
                    }
                });

                codemirror.on('blur', function (instance) {
                    var newValue = instance.getValue();
                    if (newValue !== ctrl.$viewValue) {
                        $scope.$evalAsync(function () {
                            ctrl.$setViewValue(newValue);
                        });
                    }
                });
            }

            normalizeScopeValue();

            var codemirrorOptions = {
                lineWrapping: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                highlightSelectionMatches: { showToken: /\w/ },
                viewportMargin: Infinity,
                lineNumbers: $scope.lineNumbers,
                readOnly: $scope.readOnly,
                mode: 'mxl',
                gutters: ["CodeMirror-lint-markers"],
                lint: true,
                debounce: $scope.debounce ? $scope.debounce : 2000,
                theme: 'mxl',
                extraKeys: {
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
                }
            };

            if ($scope.validateMxl) {
                codemirrorOptions.validateMxl = function (modelValue, viewValue) {
                    function updateLints(currentError) {
                        if ($scope.codemirror.options.updateMxLLints) {
                            $scope.codemirror.options.updateMxLLints($scope.codemirror, currentError);
                        }
                    }

                    return $q.when($scope.validateMxl({ modelValue: modelValue, viewValue: viewValue }))
                        .then(function (response) {
                            updateLints(null);
                        }
                            , function (response) {
                                updateLints(response.data);
                            });
                };
            }

            if ($scope.runTest) {
                codemirrorOptions.extraKeys["Ctrl-Enter"] = function (cm) {
                    $q.when($scope.runTest({ value: cm.getValue() }))
                        .then(function (response) {
                            console.log(response);
                            ngDialog.open({
                                template: '<h4>Test result</h4>\
                                            <p>' + response + '</p>\
                                            <div class="ngdialog-buttons">\
                                                <button type="button" class="ngdialog-button ngdialog-button-secondary" ng-click="closeThisDialog(0)">OK</button>\
                                            </div>',
                                plain: true,
                                showClose: true,
                                closeByDocument: true,
                                closeByEscape: true
                            });
                        });
                }
            }
            $scope.codemirror = newCodemirrorEditor($element, codemirrorOptions);

            configNgModelLink($scope.codemirror, ctrl[0], $scope);

            CodeMirror.commands.autocomplete = function (cmeditor) {
                var autoCompletionOptions = { completeSingle: false };

                if ($scope.additionalAutoCompletionHints) {
                    autoCompletionOptions.additionalHints = $scope.additionalAutoCompletionHints;
                }

                CodeMirror.showHint(cmeditor, CodeMirror.hint.mxl, autoCompletionOptions);
            };
        }
    }
});