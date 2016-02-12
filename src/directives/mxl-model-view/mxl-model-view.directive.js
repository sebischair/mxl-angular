(function () {
    angular.module('mxl').directive('mxlModelView', function () {
        return {
            require: ["^ngModel"],
            scope:
                {
                    mxlSemantics: '=mxlSemantics',
                    width: '@width',
                    height: '@height'
                },
            link: function ($scope, $element, $attrs, ctrl) {

                $scope.$watch('mxlSemantics', function () {
                    if ($scope.mxlSemantics) {

                        var graphData = {
                            nodes: {},
                            edges: {}
                        };



                        initiateGraphData($scope.mxlSemantics.dependencies, graphData);


                        if(!$scope.graph){                        
                            $scope.graph = new joint.dia.Graph();

                            var paper = new joint.dia.Paper({
                                el: $element,
                                width: $scope.width,
                                height: $scope.height,
                                gridSize: 1,
                                model: $scope.graph,
                                interactive: false
                            });
                        }

                        buildGraph(graphData, $scope.graph);
                    }
                }, true);




            }
        }
    });

    function initiateGraphData(dependencies, graphData) {
        if (!dependencies) {
            dependencies = [];
        }

        _.each(dependencies, function (dep) {
            if (dep.entityType) {
                generateEntityType(graphData, dep.entityType);
            } else if (dep.attributeDefinition) {
                generateAttributeDefinition(graphData, dep.attributeDefinition);
            } else if (dep.derivedAttributeDefinition) {
                generateDerivedAttributeDefinition(graphData, dep.derivedAttributeDefinition);
            }
        });
    }

    function generateEntityType(graphData, entityType) {
        var classNode = graphData.nodes[entityType.id];
        if (!classNode) {
            graphData.nodes[entityType.id] = { id:entityType.id, data: entityType, attributes: {}, derivedAttributes: {} };
            return graphData.nodes[entityType.id];
        } else {
            return classNode;
        }
    }

    function generateAttributeDefinition(graphData, attributeDefinition) {
        if (attributeDefinition.attributeType === "Link" && attributeDefinition.options && attributeDefinition.options.entityType) {
            var edge = graphData.edges[attributeDefinition.id];

            if (!edge) {
                var targetType = attributeDefinition.options.entityType;
                generateEntityType(graphData, targetType);

                graphData.edges[attributeDefinition.id] = { data: attributeDefinition, source: attributeDefinition.entityType.id, target: targetType.id };
                return graphData.edges[attributeDefinition.id];
            } else {
                return edge;
            }

        } else {
            var classNode = generateEntityType(graphData, attributeDefinition.entityType);

            var attributeNode = classNode.attributes[attributeDefinition.id];
            if (!attributeNode) {
                classNode.attributes[attributeDefinition.id] = { data: attributeDefinition };
                return classNode.attributes[attributeDefinition.id];
            } else {
                return attributeNode;
            }
        }
    }

    function generateDerivedAttributeDefinition(graphData, derivedAttributeDefinition) {
        var classNode = generateEntityType(graphData, derivedAttributeDefinition.entityType);

        var derivedAttributeNode = classNode.derivedAttributes[derivedAttributeDefinition.id];
        if (!derivedAttributeNode) {
            classNode.derivedAttributes[derivedAttributeDefinition.id] = { data: derivedAttributeDefinition };
            return classNode.derivedAttributes[derivedAttributeDefinition.id];
        } else {
            return derivedAttributeNode;
        }
    }

    function buildGraph(graphData, graph) {
       
        var uml = joint.shapes.uml;

        var classes = {};

        graph.clear();

        _.each(graphData.nodes, function (node) {
            var c = new uml.Class({
                size: { width: 220, height: 100 },
                name: node.data.name
            });

            classes[node.id] = c;
            graph.addCell(c);
            
        });

        console.log(classes);

        _.each(graphData.edges, function (edge) {
            graph.addCell(new uml.Association({ source: { id: classes[edge.source].id }, target: { id: classes[edge.target].id } }));
        });

        joint.layout.DirectedGraph.layout(graph, { setLinkVertices: false });


    }
})();
