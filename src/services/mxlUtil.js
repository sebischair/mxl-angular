(function () {
    angular.module('mxl').service('mxlUtil', function (scModel, scData, $q) {
        return {
            getElementsForModelViewByDependencies: getElementsForModelViewByDependencies,
            getElementsForModelViewByMxlContext: getElementsForModelViewByMxlContext
        };

        function getElementsForModelViewByDependencies(mxlContext, evaluationResult) {
            var def = $q.defer();

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
           
            if (mxlContext.entityType) {
                if (!containsElementWithId(modelElements.entityTypes, mxlContext.entityType.id)) { 
                    scModel.EntityType.get({ id: mxlContext.entityType.id }, function (entityType) {
                        modelElements.entityTypes.push(entityType);
                        def.resolve(modelElements);
                    }, function (error) {
                        def.reject(error);
                    });
                } else {
                    def.resolve(modelElements);
                }
            } else if (mxlContext.entity) {

                scData.Entity.get({ id: mxlContext.entity.id }, function (entity) {
                    if (!containsElementWithId(modelElements.entityTypes, entity.entityType.id)) {
                        scModel.EntityType.get({ id: entity.entityType.id }, function (entityType) {
                            modelElements.entityTypes.push(entityType);
                            def.resolve(modelElements);
                        }, function (error) {
                            def.reject(error);
                        });
                    } else {
                        def.resolve(modelElements);
                    }
                }, function (error) {
                    def.reject(error);
                });
            } else {
                def.resolve(modelElements);
            }

            return def.promise;
        }

        function containsElementWithId(list, id) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === id) {
                    return true;
                }
            }
            return false;
        }

        function getElementsForModelViewByMxlContext(mxlContext) {
            var def = $q.defer();

            if (mxlContext.entityType) {
                getElementsForModelViewByEntityType(mxlContext.entityType, def);
            } else if (mxlContext.entity) {
                getElementsForModelViewByEntity(mxlContext.entity, def);
            } else if (mxlContext.workspace) {
                getElementsForModelViewByWorkspace(mxlContext.workspace, def);
            } else {
                def.reject();
            }

            return def.promise;
        }


        function getElementsForModelViewByEntityType(entityType, def) {
            scModel.EntityType.get({ id: entityType.id }, function (entityType) {
                def.resolve({ entityTypes: [entityType], markElements: true });
            }, function (error) {
                def.reject(error);
            });
        }

        function getElementsForModelViewByEntity(entity, def) {
            scData.Entity.get(entity, function (entity) {
                getElementsForModelViewByEntityType(entity.entityType, def);
            }, function (error) {
                def.reject(error);
            });
        }

        function getElementsForModelViewByWorkspace(workspace, def) {
            scModel.EntityType.queryByWorkspace({ id: workspace.id, meta: 'associations' }, function (entityTypes) {
                _.each(entityTypes, function (et) {
                    et.attributeDefinitions = et.associations;
                });
                def.resolve({ entityTypes: entityTypes, markElements: false });
            }, function (error) {
                def.reject(error);
            });
        }
    });
})();
