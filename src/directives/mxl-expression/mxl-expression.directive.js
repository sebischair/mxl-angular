(function () {
    angular.module('mxl').directive('mxlExpression', function ($timeout, $q, mxlModes, scMxl, mxlUtil) {
        return {
            require: ["^ngModel"],
            scope:
                {
                    expression: '=ngModel',
                    mxlModelElements: '=mxlModelElements',
                    readOnly: '@mxlReadonly',
                    debounce: '@mxlDebounce',
                    mode: '@mxlMode',
                    mxlExpectedType: '@mxlExpected',
                    mxlParameters: '@mxlParameters',
                    workspaceId: '@scWorkspace',
                    entityTypeId: '@scEntitytype',
                    entityId: '@scEntity'
                },
            link: function ($scope, $element, $attrs, ctrl) {
                var mxlContext = {};

                loadMxlContext();

                function loadMxlContext() {
                    if ($scope.workspaceId) {
                        mxlContext.workspace = { id: $scope.workspaceId };
                    }
                    if ($scope.entityTypeId) {
                        mxlContext.entityType = { id: $scope.entityTypeId };
                    }
                    if ($scope.entityId) {
                        mxlContext.entity = { id: $scope.entityId };
                    }

                    if (!mxlContext.workspace && !mxlContext.workspace && !mxlContext.workspace) {
                        delete mxlContext;
                    }
                }

                function newCodemirrorEditor($element, codemirrorOptions) {
                    var codemirror;
                    $element.html('');
                    codemirror = new window.CodeMirror(function (cm_el) {
                        $element.append(cm_el);
                        if ($attrs.class) {
                            cm_el.classList.add($attrs.class);
                        }

                        if ($attrs.style) {
                            cm_el.style.cssText = $attrs.style;
                        }
                    }, codemirrorOptions);
                    return codemirror;
                }

                function normalizeScopeValues() {
                    if ($scope.mode) {
                        if ($scope.mode.toLowerCase() == mxlModes.type) {
                            $scope.mode = mxlModes.type;
                        } else if ($scope.mode.toLowerCase() == mxlModes.parameteres) {
                            $scope.mode = mxlModes.parameteres;
                        } else {
                            $scope.mode = mxlModes.expression;
                        }
                    } else {
                        $scope.mode = mxlModes.expression;
                    }

                    $scope.readOnly = $scope.$eval($scope.readOnly);
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

                    var node = document.createElement("div");
                    node.className = "mxl-result-panel";

                    var close = node.appendChild(document.createElement("span"));
                    close.className = "mxl-result-panel-close";

                    var content = node.appendChild(document.createElement("span"));

                    if (result.status >= 400) {
                        content.innerHTML = "<b>" + (result.cause ? result.cause : "Error") + "</b><br/>"
                        content.innerHTML += result.message;
                        node.className += " alert alert-" + (result.cause === "MxLEvaluationException" ? "warning" : "danger");
                        updateLints(result);
                    } else {
                        node.className += " alert alert-success";
                        content.innerHTML = "<b>Test result:</b><br/>"
                        content.innerHTML += "" + JSON.stringify(result.value, null, 2);
                    }

                    if ($scope.testResultWidget) {
                        $scope.testResultWidget.clear();
                    }

                    $scope.testResultWidget = $scope.codemirror.addPanel(node, { position: 'bottom' });
                    CodeMirror.on(close, "click", function () {
                        removeCurrentTestPanel();
                    });
                }

                function loadModelViewByMxlContext() {
                    if ($attrs.mxlModelElements) {
                        if (mxlContext) {
                            mxlUtil.getElementsForModelViewByMxlContext(mxlContext).then(function (elements) {
                                $scope.mxlModelElements = elements;
                            });
                        } else {
                            delete $scope.mxlModelElements;
                        }
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
                        if (viewValue.trim() === "") {
                            loadModelViewByMxlContext();

                            return $q.when();
                        }

                        if (codemirror.options.validateMxl) {
                            return codemirror.options.validateMxl(modelValue, viewValue);
                        }
                        return $q.when();
                    };

                    codemirror.cancelDebouncedUpdate = function () {
                        if ($scope.debounceUpdate) {
                            $timeout.cancel($scope.debounceUpdate);
                            $scope.debounceUpdate = null;
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
                                        ctrl.$setViewValue(instance.getValue());
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

                normalizeScopeValues();

                var codemirrorOptions = {
                    lineWrapping: true,
                    matchBrackets: true,
                    autoCloseBrackets: true,
                    highlightSelectionMatches: { showToken: /\w/ },
                    viewportMargin: Infinity,
                    readOnly: $scope.readOnly,
                    mode: 'mxl',
                    gutters: ["CodeMirror-lint-markers"],
                    lint: true,
                    onlyLimitedHints: $scope.mode !== mxlModes.expression,
                    debounce: $scope.debounce ? $scope.debounce : 1000,
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
                            return CodeMirror.Pass;
                        }
                    }
                };


                codemirrorOptions.validateMxl = function (modelValue, viewValue) {

                    var def = $q.defer();

                    var value = {};

                    if ($scope.mode === mxlModes.type) {
                        value = { expectedType: viewValue };
                    } else if ($scope.mode === mxlModes.parameters) {
                        value = { parameterDefinitions: viewValue };
                    } else {
                        value = { expression: viewValue, expectedType: $scope.mxlExpectedType, parameterDefinitions: $scope.mxlParameters };
                    }

                    return scMxl.validate(mxlContext, value,
                        function (response) {
                            if ($attrs.mxlModelElements) {
                                if (response.dependencies.dependencies) {
                                    mxlUtil.getElementsForModelViewByDependencies(mxlContext, response.dependencies).then(function (elements) {
                                        $scope.mxlModelElements = elements;
                                    });
                                } else {
                                    mxlUtil.getElementsForModelViewByMxlContext(mxlContext).then(function (elements) {
                                        $scope.mxlModelElements = elements;
                                    });
                                }
                            }
                            updateLints(null);
                            def.resolve();
                        }, function (response) {
                            updateLints(response);
                            def.reject();
                        });
                    return def.promise;
                };


                if (!$scope.readOnly && $scope.mode === mxlModes.expression) {
                    codemirrorOptions.extraKeys["Ctrl-Enter"] = function (cm) {
                        removeCurrentTestPanel();

                        $scope.codemirror.forcedModelUpdate();

                        scMxl.query(mxlContext, { expression: cm.getValue(), expectedType: $scope.mxlExpectedType, parameterDefinitions: $scope.mxlParameters },
                            function (response) {
                                addTestResult(response);
                            }, function (response) {
                                addTestResult(response);
                            });
                    }
                }


                $scope.codemirror = newCodemirrorEditor($element, codemirrorOptions);

                configNgModelLink($scope.codemirror, ctrl[0], $scope);

                loadAutoCompletionHints();

                $scope.$watch('workspaceId', function () {
                    loadMxlContext();
                    loadAutoCompletionHints();
                    loadModelViewByMxlContext();
                });

                function loadAutoCompletionHints() {
                    scMxl.autoComplete(mxlContext, function (response) {
                        $scope.codemirror.additionalAutoCompletionHints = response;
                    });
                }

                CodeMirror.commands.autocomplete = function (cmeditor) {
                    var autoCompletionOptions = { completeSingle: false };
                    cmeditor.options.additionalAutoCompletionHints = cmeditor.additionalAutoCompletionHints;
                    CodeMirror.showHint(cmeditor, CodeMirror.hint.mxl, autoCompletionOptions);
                };
            }
        }
    });

})();
