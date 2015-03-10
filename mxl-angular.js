'use strict';

angular.module('mxl', [])
.directive('mxlExpression', function ($timeout, $q) {
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
                if (!$attrs.mxlValidate) {
                    $scope.validateMxl = null;
                }
                if (!$attrs.mxlRuntest || $scope.readOnly) {
                    $scope.runTest = null;
                }
            }

            function updateLints(currentError) {
                if ($scope.codemirror.options.updateMxLLints) {
                    $scope.codemirror.options.updateMxLLints($scope.codemirror, currentError);
                }
            }

            function removeCurrentTestPanel() {
                if ($scope.testResultWidget) {
                    $scope.testResultWidget.clear();
                }
                updateLints(null);
                $scope.codemirror.focus();
            }

            function addTestResult(result) {
                removeCurrentTestPanel();

                var node = document.createElement("div");
                node.className = "mxl-result-panel";

                var close = node.appendChild(document.createElement("span"));
                close.className = "mxl-result-panel-close";

                var content = node.appendChild(document.createElement("span"));

                if (result.status >= 400) {
                    content.innerHTML = "<b>Error:</b><br/>"
                    content.innerHTML += result.data.message;
                    node.className += " error";
                    updateLints(result.data);
                } else {
                    node.className += " success";
                    content.innerHTML = "<b>Test result:</b><br/>"
                    content.innerHTML += "" + result.data;
                }

                if ($scope.testResultWidget) {
                    $scope.testResultWidget.clear();
                }

                $scope.testResultWidget = $scope.codemirror.addPanel(node, { position: 'bottom' });
                CodeMirror.on(close, "click", function () {
                    removeCurrentTestPanel();
                });
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

                codemirror.cancelDebouncedUpdate = function () {
                    if ($scope.debounceUpdate) {
                        $timeout.cancel($scope.debounceUpdate);
                    }
                }

                codemirror.forcedModelUpdate = function () {
                    codemirror.cancelDebouncedUpdate();

                    var newValue = codemirror.getValue();
                    if (newValue !== ctrl.$viewValue) {
                        $scope.$evalAsync(function () {
                            ctrl.$setViewValue(newValue);
                        });
                    }
                }

                codemirror.on('change', function (instance) {
                    removeCurrentTestPanel();
                    var newValue = instance.getValue();
                    if (newValue !== ctrl.$viewValue) {
                        if (codemirror.options.debounce) {
                            codemirror.cancelDebouncedUpdate();

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
                    codemirror.forcedModelUpdate();
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
                    "F11": function (cm) {
                        cm.setOption("fullScreen", !cm.getOption("fullScreen"));
                    },
                    "'.'": function (cm) {
                        $timeout(function () { cm.execCommand("autocomplete"); }, 100, false);
                        return CodeMirror.Pass;
                    },
                    "Esc": function (cm) {
                        if (cm.getOption("fullScreen")) {
                            cm.setOption("fullScreen", false);
                        }
                        removeCurrentTestPanel();
                        updateLints(null);
                        return CodeMirror.Pass;
                    }
                }
            };

            if ($scope.validateMxl) {
                codemirrorOptions.validateMxl = function (modelValue, viewValue) {
                    return $q.when($scope.validateMxl({ modelValue: modelValue, viewValue: viewValue }))
                        .then(function (response) {
                            updateLints(null);
                        }, function (response) {
                            updateLints(response.data);
                        });
                };
            }

            if ($scope.runTest) {
                codemirrorOptions.extraKeys["Ctrl-Enter"] = function (cm) {
                    $scope.codemirror.forcedModelUpdate();
                    $q.when($scope.runTest({ value: cm.getValue() }))
                    .then(function (response) {
                        addTestResult(response);
                    }, function (response) {
                        addTestResult(response);
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