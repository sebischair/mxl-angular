(function () {
    angular.module('mxl').service('mxlUtil', function scAuthentication() {
        return {
            getElementsForModelViewByDependencies: getElementsForModelViewByDependencies
        };

        function getElementsForModelViewByDependencies(evaluationResult) {
            var modelElements = {
                entityTypes: [],
                attributeDefinitions: [],
                derivedAttributeDefinitions: []
            };

            var dependencies = evaluationResult.dependencies;

            if (!dependencies) {
                dependencies = [];
            }

            _.each(dependencies, function (dep) {
                if (dep.entityType) {
                    modelElements.entityTypes.push(dep.entityType);
                } else if (dep.attributeDefinition) {
                    modelElements.attributeDefinitions.push(dep.attributeDefinition);
                } else if (dep.derivedAttributeDefinition) {
                    modelElements.derivedAttributeDefinitions.push(dep.derivedAttributeDefinition);
                }
            });

            return modelElements;
        }
    });
})();
