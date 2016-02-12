(function () {
    angular.module('mxl', ['sociocortex'])
        .constant("mxlModes", {
            expression: "expression",
            type: "type",
            parameters: "parameters"
        });
})();
