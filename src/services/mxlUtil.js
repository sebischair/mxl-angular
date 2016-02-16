(function () {
    angular.module('mxl').service('mxlUtil', function (scModel, $q) {
        return {
            getElementsForModelViewByDependencies: getElementsForModelViewByDependencies,
            getElementsForModelViewByWorkspaceId: getElementsForModelViewByWorkspaceId
        };

        function getElementsForModelViewByDependencies(evaluationResult) {
            var modelElements = {
                entityTypes: [],
                attributeDefinitions: [],
                derivedAttributeDefinitions: [],
                markElements: true
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

        function getElementsForModelViewByWorkspaceId(workspaceId) {
            var def = $q.defer();

            scModel.EntityType.queryByWorkspace({ id: workspaceId, meta: 'associations' }, function (entityTypes) {
                _.each(entityTypes, function (et) {
                    et.attributeDefinitions = et.associations;
                });
                def.resolve({ entityTypes: entityTypes, markElements: false });
            }, function (error) {
                def.reject(error);
            });

            return def.promise;
        }
    });
})();
