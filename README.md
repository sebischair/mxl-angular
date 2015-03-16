# MxL Expression Directive #

This directive is based on the [CodeMirror (v5)](http://codemirror.net/) code editor control and the [ui-codemirror](github.com/angular-ui/ui-codemirror) directive. 

It allows you to easily add a [MxL](http://131.159.30.153/pages/nnpd6s1j1hsm/MxL-Documentation) code editor into your web application. This MxL code editor already supports useful features like MxL-specific syntax highlighting, auto-completion support, and a "try it out" feature.

### Requirements ###
* AngularJS 1.3.x

### Usage ###

Clone the repository into your web application directory and load the following script files into your application:

```
#!html
<!-- AnguarJS -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.13/angular.min.js" type="text/javascript"></script>

<!-- SocioCortex scripts (if you want to bind the MxL to SocioCortex as shown in the examples below) -->
<script src="sc/sc-angular.js" type="text/javascript"></script>

<!-- CodeMirror scripts -->
<script src="mxl/CodeMirror/codemirror.js">   </script>
<script src="mxl/CodeMirror/addon/display/fullscreen.js"></script>
<script src="mxl/CodeMirror/addon/display/panel.js"></script>
<script src="mxl/CodeMirror/addon/edit/matchbrackets.js"></script>
<script src="mxl/CodeMirror/addon/edit/closebrackets.js"></script>
<script src="mxl/CodeMirror/addon/hint/show-hint.js"></script>
<script src="mxl/CodeMirror/addon/lint/lint.js"></script>
<script src="mxl/CodeMirror/addon/search/searchcursor.js"></script>
<script src="mxl/CodeMirror/addon/search/match-highlighter.js"></script>
<script src="mxl/CodeMirror/addon/runmode/runmode.js"></script>

<link rel="stylesheet" href="mxl/CodeMirror/codemirror.css" />
<link rel="stylesheet" href="mxl/CodeMirror/addon/hint/show-hint.css" />
<link rel="stylesheet" href="mxl/CodeMirror/addon/display/fullscreen.css" />
<link rel="stylesheet" href="mxl/CodeMirror/addon/lint/lint.css" />

<!-- MxL scripts -->
<script src="mxl/mxl-angular.js" type="text/javascript"></script>
<script src="mxl/mxl-parse.js"></script>
<script src="mxl/mxl-hint.js"></script>
<script src="mxl/mxl-lint.js"></script>
<link rel="stylesheet" href="mxl/mxl.css" />
```
Add the mxl module as a dependency to your application module:

```
#!javascript
var myApp = angular.module('ceapp', ['mxl', 'sociocortex']);
```
Add the mxl-expression directive as element to your html:
```
#!html
<mxl-expression ></mxl-expression>
```
### Working with ng-model ###
The mxl-expression directive supports AngularJS' two-way binding by using the ng-model attribute:

```
#!html
<mxl-expression ng-model="expr"></mxl-expression>
```
The mxl-expression directive only supports standard javascript strings as model value, e.g.:
```
#!javascript
myApp.controller('myController', function ($scope) {
   $scope.expr = "[1, 2, 3].sum()";
}
```
### Additional Auto Completion Hints ###
By default, the MxL code editor already proposes the MxL keywords (e.g., **find**, **this**, etc.) as hints for the auto completion feature.
Additional hints can be provided through the **mxl-autocompletionhints** attribute:

```
#!html

<mxl-expression ng-model="expectedType" mxl-autocompletionhints="autoCompletionHints"></mxl-expression>
```
Thereby, you can set the additional hints in the controller of your app, e.g., by loading them from SocioCortex:

```
#!javascript
scService.mxlAutoComplete($scope.workspaceId).then(function (response) {
        $scope.autoCompletionHints = response.data;
    });
```
By the way: Providing the id of a specific workspace ensures the inclusion of workspace-specific identifiers into the list of additional hints, e.g., types and their attributes.