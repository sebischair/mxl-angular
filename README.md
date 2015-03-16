# MxL Expression Directive #

This directive is based on the [CodeMirror (v5)](http://codemirror.net/) code editor control and allows you to easily add a MxL code editor into your web application. This MxL code editor already supports useful features like MxL-specific syntax highlighting, auto-completion support, and "try it out".

### Requirements ###
* AngularJS 1.3.x

### Usage ###

Load the following script files into your application:

```
#!html
<!-- AnguarJS -->
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.13/angular.min.js" type="text/javascript"></script>

<!-- SocioCortex scripts (if you want to bind the MxL to SocioCortex) -->
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

