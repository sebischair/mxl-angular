'use strict';

angular.module('mxl', ['ui.codemirror'])
.constant("mxlModes", {
    expression: "expression",
    type: "type",
    parameteres: "parameters"
})
.directive('mxlExpression', function ($timeout, $q, $sce, $compile, mxlModes) {
    return {
        templateUrl: 'statics/mxl-template.html',
        require: ["^ngModel"],
        scope:
            {
                expression: '=ngModel',
                readOnly: '@mxlReadonly',
                debounce: '@mxlDebounce',
                additionalHints: '=mxlAutocompletionhints',
                runTest: '&mxlRuntest',
                mode: '@mxlMode',
                validateMxl: '&mxlValidate',
                // below are the attributes for the wizard
                entityName: '@',
                enableWizard: '=enableWizard',
                entities: '=mxlEntities',
                changingEntity: '@',
                selectedEntity: '@',
                wizard: '&mxlWizard',
                intermediateResults: "@",
                wizardMethodAutocompletion: "&mxlWizardMethod",
                wizardConfig: '=',
                addFunction: '@',
                id: '@'
            },
        controller: function($scope){
            return $scope;
        },
        link: function ($scope, $element, $attrs, ctrl) {
            /*
            * Below are the wizard related functions
            */
            // select the entity
            $scope.selectEntity = function($event){
                if($event === null || $event.keyCode === 13){
                    // get the selected entity
                    console.log($scope.entityName);
                    for(var i = 0; i < $scope.entities.length; i++){
                        if($scope.entities[i].name === $scope.entityName){
                            $scope.selectedEntity = $scope.entities[i];
                            $scope.changingEntity = false;
                            break;
                        }
                    }

                    // initialize the intermediate result array
                    if($scope.wizard){
                        $scope.wizardQuery = ["find " + $scope.selectedEntity.name];
                        $scope.wizard({expression: $scope.wizardQuery[0]}).then(function(result){
                            $scope.intermediateResults = [{type: result.type.fullname, preview: result.value, unknown: false}];
                            // initialize the first set of functions
                            if($scope.wizardMethodAutocompletion && $scope.intermediateResults != null){
                                $scope.wizardMethodAutocompletion({restrict: $scope.intermediateResults[0].type}).then(function(result){
                                    $scope.intermediateResults[0].functions = result.memberFunctions;
                                });
                            }
                            $scope.intermediateResults[0].config = {};
                        });
                    }
                    $scope.endOfWizard = false;
                    // set the codemirror content
                    $scope.codemirror.setValue( $scope.wizardQuery[0]);
                }
             };

            $scope.changeEntity = function(){
                $scope.changingEntity = true;
            };
            $scope.cancelChange = function(){
                $scope.changingEntity = false;
            };

            // add a new function
            $scope.addFunction = function(){
                var index = $scope.intermediateResults.length - 1;
                // initialized the corresponding methods
                if($scope.wizardMethodAutocompletion && $scope.intermediateResults != null){
                    $scope.wizardMethodAutocompletion({restrict: $scope.intermediateResults[index].type}).then(function(result){
                        $scope.intermediateResults[index].functions = result.memberFunctions;
                    });
                }
                $scope.intermediateResults[index].config = {};
            };

            // when a function is selected
            $scope.selectFunction = function($event, index){
                if($event.keyCode === 13) {
                    // get the function
                    //var input = document.querySelector("#method-"+index);
                    console.log($scope.intermediateResults[index].config.functionName);
                    if($scope.intermediateResults[index].config === null){
                        $scope.intermediateResults[index].config = {};
                    }
                    for(var i = 0;  i < $scope.intermediateResults[index].functions.length; i++){
                        if($scope.intermediateResults[index].functions[i].name ===
                            $scope.intermediateResults[index].config.functionName){
                            $scope.intermediateResults[index].config.selectedFunction = $scope.intermediateResults[index].functions[i];
                            break;
                        }
                    }
                    //$scope.bindFunctionDescriptionAsHtml = $compile($scope.intermediateResults[index].config.selectedFunction.description);
                    //console.log($scope.bindFunctionDescriptionAsHtml);

                    //$scope.bindFunctionDescriptionAsHtml = "<span title=" + $scope.bindFunctionDescriptionAsHtml + ">i</span>";
                    //console.log($scope.bindFunctionDescriptionAsHtml);
                    //
                    //$scope.bindFunctionDescriptionAsHtml = $sce.trustAsHtml($scope.bindFunctionDescriptionAsHtml);
                    $scope.bindFunctionDescriptionAsHtml = $sce.trustAsHtml("<span title='"+ $scope.intermediateResults[index].config.selectedFunction.description+"'> i </span>");
                    //$scope.$apply();


                    var mandatoryParameter = 0;
                    var length = 0;
                    if($scope.intermediateResults[index].config.selectedFunction.parameters){
                        length = $scope.intermediateResults[index].config.selectedFunction.parameters.length;
                        for (var i = 0; i < length; i++) {
                            if ($scope.intermediateResults[index].config.selectedFunction.parameters[i].isOptional == false) {
                                mandatoryParameter++;
                            }
                        }
                    }

                    $scope.intermediateResults[index].config.unfilledMandatoryParameters = mandatoryParameter;
                    $scope.intermediateResults[index].config.parameters = Array.apply(null, Array(length)).map(function () {});

                    if (mandatoryParameter === 0) {
                        var query = generateQuery(index, -1);
                        // set the codemirror content
                        $scope.codemirror.setValue(query);

                        if ($scope.wizard) {
                            $scope.wizard({expression: query}).then(function (result) {
                                setNewIntermediateResult(result, index);
                            }, function (result) {
                                setNewIntermediateResult(result, index);
                            });
                        }
                        $scope.intermediateResults[index + 1] = {};
                        $scope.intermediateResults[index + 1].waiting = true;

                    }
                }
            };

            // when a parameter is passed
            $scope.setParameter = function($event, resIndex, paraIndex, isOptional){
                if($event.keyCode === 10) {
                    if (isOptional == false) {
                        if ($scope.intermediateResults[resIndex].config.parameters[paraIndex] != "") {
                            if($scope.intermediateResults[resIndex].config.unfilledMandatoryParameters > 0) {
                                $scope.intermediateResults[resIndex].config.unfilledMandatoryParameters--;
                            }
                        }else{
                            $scope.intermediateResults[resIndex].config.unfilledMandatoryParameters++;
                        }
                    }
                    if ($scope.intermediateResults[resIndex].config.unfilledMandatoryParameters === 0) {
                        // first check if it is a new parameter or an update
                        if($scope.intermediateResults[resIndex + 1] != null){
                            // when it is an update for existing configurations
                            $scope.intermediateResults[resIndex + 1].waiting = true;
                            updateParameter(resIndex);
                        }else {
                            // when it is a new parameter
                            var query = generateQuery(resIndex, -1);

                            // set the codemirror content
                            $scope.codemirror.setValue(query);

                            $scope.wizard({expression: query}).then(function (result) {
                                setNewIntermediateResult(result, resIndex);
                            }, function (result) {
                                setNewIntermediateResult(result, resIndex);
                            });
                            $scope.intermediateResults[resIndex + 1] = {};
                            $scope.intermediateResults[resIndex + 1].waiting = true;
                        }
                    }
                }
            };

            // these are the codemirror options for the parameter codemirror editor
            $scope.paraCMOptions = {
                autofocus: true,
                placeholder: 'Ctrl+Enter to confirm',
                lineWrapping: true,
                matchBrackets: true,
                autoCloseBrackets: true,
                highlightSelectionMatches: { showToken: /\w/ },
                viewportMargin: Infinity,
                readOnly: false,
                mode: 'mxl',
                gutters: ["CodeMirror-lint-markers"],
                lint: true,
                theme: 'mxl',
                extraKeys: {
                    "Ctrl-Space": "autocomplete"
                }
            };

            // this function is used to insert a step
            $scope.insertStep = function(index){
                console.log("insert step after: " + index);
                var functions = $scope.intermediateResults[index].functions;
                var config = $scope.intermediateResults[index].config;
                $scope.intermediateResults[index].config = {};
                var newIntermediate = {type: 'Unknown', unknown: true, preview: null, functions: functions, config: config};
                $scope.intermediateResults.splice(index + 1, 0, newIntermediate);
                $scope.wizardQuery.splice(index + 1, 0, "");
            }

            // this function is used to remove one of the steps
            $scope.removeStep = function(index){
                console.log("Remove step: " + index);
                // re-assign all the configurations of intermediate results
                for(var i = index; i < $scope.intermediateResults.length - 1; i++){
                    if($scope.intermediateResults[i + 1]) {
                        $scope.intermediateResults[i].config = $scope.intermediateResults[i + 1].config;
                        if(i < $scope.intermediateResults.length - 2 && $scope.intermediateResults[i + 1].functions == null) {
                            $scope.intermediateResults[i].functions = null;
                        }
                    }
                }
                if($scope.intermediateResults.length === 1){
                    // when there is only one intermediate result
                    $scope.intermediateResults[i].config.selectedFunction = null;
                    $scope.intermediateResults[i].config.functionName = null;
                }else{
                    // remove the last intermediate result and last part of the query
                    $scope.intermediateResults.pop();
                    $scope.wizardQuery.pop();
                    // update the parameters and the queries
                    updateQuery();
                    var query = generateQuery(-1,-1);
                    $scope.codemirror.setValue(query);
                    updateParameter(index);
                }
                console.log($scope.intermediateResults);
            };

            // this function is used to update the whole query
            function updateQuery(){
                console.log("updating the query");
                $scope.wizardQuery = ["find " + $scope.selectedEntity.name];
                for(var i = 0; i < $scope.intermediateResults.length - 1; i++){
                    $scope.wizardQuery[i + 1] = "\n  ." + $scope.intermediateResults[i].config.selectedFunction.name + "(";

                    var length = $scope.intermediateResults[i].config.parameters.length;
                    for (var f = 0; f < length; f++) {
                        if ($scope.intermediateResults[i].config.parameters[f] != null) {
                            if (f === 0) {
                                $scope.wizardQuery[i + 1] += $scope.intermediateResults[i].config.parameters[f];
                            } else {
                                $scope.wizardQuery[i + 1] += "," + $scope.intermediateResults[i].config.parameters[f];
                            }
                        }
                    }
                    $scope.wizardQuery[i + 1] += ")";
                    console.log("query part" + i + ":" + $scope.wizardQuery[i + 1]);
                }
                console.log("Query update result: ");
                console.log($scope.wizardQuery);
            }

            // this function is used to generate a query
            // endIndex is used to generate only a part of the query
            function generateQuery(resIndex, endIndex){
                // if resIndex equals -1, no need to update the steps of the query
                if(resIndex !== -1) {
                    $scope.wizardQuery[resIndex + 1] = "\n  ." + $scope.intermediateResults[resIndex].config.selectedFunction.name + "(";

                    var length = $scope.intermediateResults[resIndex].config.parameters.length;
                    for (var i = 0; i < length; i++) {
                        if ($scope.intermediateResults[resIndex].config.parameters[i] != null) {
                            if (i === 0) {
                                $scope.wizardQuery[resIndex + 1] += $scope.intermediateResults[resIndex].config.parameters[i];
                            } else {
                                $scope.wizardQuery[resIndex + 1] += "," + $scope.intermediateResults[resIndex].config.parameters[i];
                            }
                        }
                    }
                    $scope.wizardQuery[resIndex + 1] += ")";
                    console.log("query part" + resIndex + ":" + $scope.wizardQuery[resIndex + 1]);
                }
                // generate the query
                var query = "";
                if(endIndex === -1){
                    // if endIndex equals -1, generate the whole query
                    for(var i = 0; i < $scope.wizardQuery.length; i++){
                        query +=  $scope.wizardQuery[i];
                    }
                }else{
                    // else only generate the query until the end index
                    if(endIndex <=  $scope.wizardQuery.length) {
                        for (var i = 0; i <= endIndex; i++) {
                            query += $scope.wizardQuery[i];
                        }
                    }else{
                        for(var i = 0; i < $scope.wizardQuery.length; i++){
                            query +=  $scope.wizardQuery[i];
                        }
                    }
                }
                console.log("query:" + query);
                return query;
            }

            // using for the loop in the updateParameter function
            function updateLoop(i, resIndex, error) {
                console.log("update intermediate result No." + (i + 1) + " of " + $scope.intermediateResults.length);
                if (i < $scope.intermediateResults.length - 1) {
                    if (error === true) {
                        $scope.intermediateResults[i + 1].type = "Unknown";
                        $scope.intermediateResults[i + 1].unknown = true;
                        updateLoop(i + 1, resIndex, error);
                    } else {
                        if ($scope.intermediateResults[i + 1].unknown == true) {
                            $scope.intermediateResults[i + 1].unknown = false;
                        }
                        var query = ""
                        if (i === resIndex) {
                            // update the parameters
                            query = generateQuery(i, i + 1);
                        } else if ($scope.intermediateResults[i].config != null &&
                            $scope.intermediateResults[i].config.selectedFunction != null) {
                            // re-generate the following intermediate results
                            // when they have a selected function
                            query = generateQuery(-1, i + 1);
                        }
                        $scope.wizard({expression: query}).then(function (result) {
                            error = updateIntermediateResult(result, i);
                            updateLoop(i + 1, resIndex, error);
                        }, function (result) {
                            error = updateIntermediateResult(result, i);
                            updateLoop(i + 1, resIndex, error);
                        });
                    }
                }else if(i === $scope.intermediateResults.length - 1){
                    $scope.intermediateResults[resIndex + 1].waiting = false;
                    if($scope.intermediateResults[i].type !== "Number" &&
                        $scope.intermediateResults[i].type !== 'String'){
                        $scope.endOfWizard = false;
                    }else{
                        $scope.endOfWizard = true;
                    }
                    if($scope.intermediateResults[i].functions == null &&
                        $scope.endOfWizard === false) {
                        // when it is the last one of the intermediate result and isn't the end of the query and doesn't have functions yet
                        // generate the functions for it
                        $scope.wizardMethodAutocompletion({restrict: $scope.intermediateResults[i].type}).then(function (result) {
                            $scope.intermediateResults[i].functions = result.memberFunctions;
                        });
                    }
                }
            }

            // this function is used to update when an existing parameter changes
            function updateParameter(resIndex){
                console.log("update parameter of intermediate result: " + resIndex);
                // update all the intermediate result afterwards
                var error = false;
                updateLoop(resIndex, resIndex, error);
                $scope.codemirror.setValue(generateQuery(-1,-1));
            }

            // this function is usd to update an intermediate result
            function updateIntermediateResult(result, resIndex){
                if(result.statusCode >= 400) {
                    $scope.intermediateResults[resIndex + 1].wizardError = result.message;
                    return true;
                }else {
                    if ($scope.intermediateResults[resIndex + 1] != null &&
                        $scope.intermediateResults[resIndex + 1].wizardError != null) {
                        $scope.intermediateResults[resIndex + 1].wizardError = null
                    }
                    if($scope.intermediateResults[resIndex + 1] != null){
                        $scope.intermediateResults[resIndex + 1].type = result.type.fullname;
                        $scope.intermediateResults[resIndex + 1].preview = result.value;
                        $scope.intermediateResults[resIndex + 1].unknown = false;
                    }
                    return false;
                }
            }

            // this function is used set a new intermediate result
            function setNewIntermediateResult(result, index){
                console.log("set new intermediate result: " + (index + 1));
                // when there is an error
                if(result.statusCode >= 400){
                    if($scope.intermediateResults[index + 1] != null){
                        $scope.intermediateResults.splice(-1, 1);
                    }
                    $scope.intermediateResults[index + 1] = {};
                    $scope.intermediateResults[index + 1].wizardError = result.message;
                }else { // no error
                    if($scope.intermediateResults[index + 1] != null &&
                        $scope.intermediateResults[index + 1].wizardError != null){
                        $scope.intermediateResults[index + 1].wizardError = null
                    }
                    $scope.intermediateResults[index + 1] = {
                        type: result.type.fullname,
                        preview: result.value,
                        unknown: false
                    };
                    if (result.type.fullname === "Number" || result.type.fullname === 'String') {
                        $scope.endOfWizard = true;
                    } else {
                        // generate the next function set
                        if($scope.wizardMethodAutocompletion && $scope.intermediateResults != null){
                            $scope.wizardMethodAutocompletion({restrict: $scope.intermediateResults[index + 1].type}).then(function(result){
                                $scope.intermediateResults[index + 1].functions = result.memberFunctions;
                            });
                        }
                        $scope.intermediateResults[index + 1].config = {};
                    }
                }
                if( $scope.intermediateResults[index + 1].waiting) {
                    $scope.intermediateResults[index + 1].waiting = false;
                }
            }
            /*
            * Above are the wizard related functions
            */
            function newCodemirrorEditor($element, codemirrorOptions) {
                var codemirror;
                if($scope.enableWizard == true){
                    var editor = $element.find('editor');
                }else{
                    $element.html('');
                }
                codemirror = new window.CodeMirror(function (cm_el) {
                    if($scope.enableWizard == true) {
                        editor.append(cm_el);
                    }else{
                        $element.append(cm_el);
                    }
                    if ($attrs.class) {
                        cm_el.classList.add($attrs.class);
                    }

                    if ($attrs.style) {
                        cm_el.style.cssText = $attrs.style;
                        console.log(cm_el.style.height);
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
                if (!$attrs.mxlValidate) {
                    $scope.validateMxl = null;
                }

                if (!$attrs.mxlRuntest || $scope.readOnly || $scope.mode != mxlModes.expression) {
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

                var node = document.createElement("div");
                node.className = "mxl-result-panel";

                var close = node.appendChild(document.createElement("span"));
                close.className = "mxl-result-panel-close";

                var content = node.appendChild(document.createElement("span"));

                if (result.statusCode >= 400) {
                    content.innerHTML = "<b>" + (result.cause ? result.cause : "Error") + "</b><br/>"
                    content.innerHTML += result.message;
                    node.className += " alert alert-" + (result.cause === "MxLEvaluationException" ? "warning" : "danger");
                    updateLints(result.value);
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
                        return CodeMirror.Pass;
                    }
                }
            };

            if ($scope.validateMxl) {
                codemirrorOptions.validateMxl = function (modelValue, viewValue) {
                    var def = $q.defer();
                    $q.when($scope.validateMxl({ modelValue: modelValue, viewValue: viewValue }))
                        .then(function (response) {
                            updateLints(null);
                            def.resolve();
                        }, function (response) {
                            updateLints(response.data);
                            def.reject();
                        });
                    return def.promise;
                };
            }

            if ($scope.runTest) {
                codemirrorOptions.extraKeys["Ctrl-Enter"] = function (cm) {
                    removeCurrentTestPanel();
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

                if ($scope.additionalHints) {
                    cmeditor.options.additionalAutoCompletionHints = $scope.additionalHints;
                }

                CodeMirror.showHint(cmeditor, CodeMirror.hint.mxl, autoCompletionOptions);
            };
        }
    }
})
.directive('mxlIntermediate', function(){
    // the directive for intermediate status, which is used in the mxlExpression directive's template
    return{
        templateUrl: 'statics/mxl-intermediate.html',
        require: "^mxlExpression",
        scope: false,
        link: function($scope, $element, $attr){}
    };
})
.directive('mxlWizardMethods', function(){
    //the directive which returns the methods which can be applied to a data type
    return{
        restrict: 'AE',
        templateUrl: 'statics/mxl-wizard-methods.html',
        require: "^mxlExpression",
        scope: false,
        link: function($scope, $element, $attrs){}
    }
})
.directive('tooltip', function () {
    return {
        restrict:'A',
        link: function(scope, element, attrs)
        {
            $(element)
                .attr('title',scope.$eval(attrs.tooltip))
                .tooltip({placement: "right"});
        }
    }
})
.directive('popOver', function ($compile) {
    var itemsTemplate = "<ul class='unstyled'><li ng-repeat='item in items'>{{item}}</li></ul>";
    var getTemplate = function (contentType) {
        var template = '';
        switch (contentType) {
            case 'items':
                template = itemsTemplate;
                break;
        }
        return template;
    }
    return {
        restrict: "A",
        transclude: true,
        template: "<span ng-transclude></span>",
        link: function (scope, element, attrs) {
            var popOverContent;


        var changeInput = function(newVal) {
            if (scope.describe) {
                var html = scope.describe;
                popOverContent = $compile(html)(scope);
            }
            var options = {
                content: function(){
                    var contentForThis = popOverContent;
                    return contentForThis;
                },
                placement: "right",
                html: true,
                title: "Description",
                trigger: "hover"
            };
            $(element).popover(options);


        }
           // changeInput();
            scope.$watch("describe", function (newVal) {
                changeInput(newVal);
            }, true);
        },
        scope:{
            describe: '='
        }
    };
});