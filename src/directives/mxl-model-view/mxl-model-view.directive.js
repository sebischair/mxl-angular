(function () {
    angular.module('mxl').directive('mxlModelView', function () {
        return {
            require: ["^ngModel"],
            scope:
                {
                    mxlModelElements: '=ngModel',
                    width: '@width',
                    height: '@height',
                    orientation: '@orientation',
                    nodeSep: '@nodeSep',
                    edgeSep: '@edgeSep',
                    rankSep: '@rankSep'
                },
            link: function ($scope, $element, $attrs, ctrl) {

                $scope.$watch('mxlModelElements', function () {
                    if ($scope.mxlModelElements) {

                        var graphData = {
                            nodes: {},
                            edges: {}
                        };

                        initiateGraphData($scope.mxlModelElements, graphData);

                        if (!$scope.graph) {
                            $scope.graph = new joint.dia.Graph();

                            $scope.paper = new joint.dia.Paper({
                                el: $element,
                                width: $scope.width,
                                height: $scope.height,
                                gridSize: 1,
                                model: $scope.graph,
                                interactive: false
                            });
                        }

                        buildGraph(graphData, $scope.graph,
                            {
                                rankDir: $scope.orientation ? $scope.orientation : 'LR',
                                nodeSep: $scope.nodeSep ? $scope.nodeSep : 100,
                                edgeSep: $scope.edgeSep ? $scope.edgeSep : 200,
                                rankSep: $scope.rankSep ? $scope.rankSep : 50,
                            });

                        var dims = $scope.graph.getBBox($scope.graph.getElements());

                        if(dims && dims.width > $scope.width){
                            $scope.paper.scale(($scope.width/dims.width));
                        }

                    } else {
                        if ($scope.graph) {
                            $scope.graph.clear();
                        }
                    }
                }, true);
            }
        }
    });

    function initiateGraphData(modelElements, graphData) {
        _.each(modelElements.entityTypes, function (et) {
            generateEntityType(graphData, et, true, modelElements.markElements);
        });

        _.each(modelElements.attributeDefinitions, function (at) {
            generateAttributeDefinition(graphData, at, modelElements.markElements);
        });

        _.each(modelElements.derivedAttributeDefinitions, function (dat) {
            generateDerivedAttributeDefinition(graphData, dat, modelElements.markElements);
        });
    }

    function generateEntityType(graphData, entityType, addAttributes, markAsExplicit) {
        var classNode = graphData.nodes[entityType.id];
        if (!classNode) {
            classNode = { id: entityType.id, data: entityType, attributes: {}, derivedAttributes: {}, markAsExplicit: false };
            graphData.nodes[entityType.id] = classNode;
        }

        _.each(entityType.attributeDefinitions, function (ad) {
            var attribute = generateAttributeDefinition(graphData, ad);
            if (!attribute.source) {
                classNode.attributes[ad.id] = attribute;
            }
        });

        _.each(entityType.derivedAttributeDefinitions, function (dad) {
            classNode.derivedAttributes[dad.id] = generateDerivedAttributeDefinition(graphData, dad);
        });

        _.each(entityType.incomingAssociations, function (ia) {
            generateIncomingAssociation(graphData, ia);
        });

        graphData.nodes[entityType.id] = classNode;

        classNode.markAsExplicit = classNode.markAsExplicit || markAsExplicit;

        return classNode;
    }

    function generateAttributeDefinition(graphData, attributeDefinition, markAsExplicit) {
        if (attributeDefinition.attributeType === "Link" && attributeDefinition.options && attributeDefinition.options.entityType) {
            var edge = graphData.edges[attributeDefinition.id];
            var targetType = attributeDefinition.options.entityType;

            if (!edge) {
                graphData.edges[attributeDefinition.id] = { data: attributeDefinition, source: attributeDefinition.entityType.id, target: targetType.id, markAsExplicit: false };
                edge = graphData.edges[attributeDefinition.id];
            }

            generateEntityType(graphData, targetType, false, markAsExplicit);

            edge.markAsExplicit = edge.markAsExplicit || markAsExplicit;
            return edge;

        } else {
            var classNode = generateEntityType(graphData, attributeDefinition.entityType, false, markAsExplicit);

            if (!classNode.attributes) {
                classNode.attributes = {};
            }

            var attributeNode = classNode.attributes[attributeDefinition.id];
            if (!attributeNode) {
                classNode.attributes[attributeDefinition.id] = { data: attributeDefinition, markAsExplicit: false };
                attributeNode = classNode.attributes[attributeDefinition.id];
            }

            attributeNode.markAsExplicit = attributeNode.markAsExplicit || markAsExplicit;

            return attributeNode;
        }
    }

    function generateDerivedAttributeDefinition(graphData, derivedAttributeDefinition, markAsExplicit) {
        var classNode = generateEntityType(graphData, derivedAttributeDefinition.entityType, false, markAsExplicit);

        if (!classNode.derivedAttributes) {
            classNode.derivedAttributes = {};
        }

        var derivedAttributeNode = classNode.derivedAttributes[derivedAttributeDefinition.id];
        if (!derivedAttributeNode) {
            classNode.derivedAttributes[derivedAttributeDefinition.id] = { data: derivedAttributeDefinition, markAsExplicit: false };
            derivedAttributeNode = classNode.derivedAttributes[derivedAttributeDefinition.id];
        }

        derivedAttributeNode.markAsExplicit = derivedAttributeNode.markAsExplicit || markAsExplicit;

        return derivedAttributeNode;
    }

    function generateIncomingAssociation(graphData, attributeDefinition) {
        var edge = graphData.edges[attributeDefinition.id];

        var sourceType = attributeDefinition.entityType;
        var targetType = attributeDefinition.options.entityType;

        if (!edge) {
            graphData.edges[attributeDefinition.id] = { data: attributeDefinition, source: sourceType.id, target: targetType.id, markAsExplicit: false };
            edge = graphData.edges[attributeDefinition.id];
        }

        generateEntityType(graphData, sourceType);

        return edge;

    }

    function buildGraph(graphData, graph, graphOptions) {

        var uml = joint.shapes.uml;

        var classes = {};
        graph.clear();

        var attributesToBeMarked = [];
        var associationsToBeMarked = [];

        var classIndex = 0;

        _.each(graphData.nodes, function (node) {
            var attributeIndex = 0;

            var classData = {
                size: { width: 200, height: 30 },
                name: node.data.name,
                attributes: [],
                attrs:
                    {
                        '.uml-class-name-rect': { 'fill': node.markAsExplicit ? '#88C0E8' : '#ccc' }
                    }
            };

            _.each(node.attributes, function (a) {
                classData.attributes.push(a.data.name + ' : ' + a.data.attributeType + getMultiplicityString(a.data.multiplicity));
                classData.size.height += 14;

                if (a.markAsExplicit) {
                    attributesToBeMarked.push({ c: classIndex, a: attributeIndex });
                }

                attributeIndex++;
            });

            _.each(node.derivedAttributes, function (a) {
                classData.attributes.push('/ ' + a.data.name + ' : ' + a.data.inferredAttributeType);
                classData.size.height += 14;

                if (a.markAsExplicit) {
                    attributesToBeMarked.push({ c: classIndex, a: attributeIndex });
                }

                attributeIndex++;
            });

            if (classData.attributes.length === 0) {
                classData.attrs['.uml-class-attrs-rect'] = { 'display': 'none' };
            } else {
                classData.attrs['.uml-class-attrs-rect'] = { 'display': 'inherit' };
            }

            var c = new uml.Class(classData);
            classes[node.id] = c;
            graph.addCell(c);

            classIndex++;
        });

        var associationIndex = 0;
        _.each(graphData.edges, function (edge) {
            var associationData = {
                source: { id: classes[edge.source].id },
                target: { id: classes[edge.target].id },
                labels: [{ position: 0.5, attrs: { text: { text: edge.data.name + getMultiplicityString(edge.data.multiplicity) } } }],
                attrs: {
                    '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 L 0 5 L 10 5 L 0 5 z' }
                }
            };

            if (edge.markAsExplicit) {
                associationsToBeMarked.push(associationIndex);
            }

            graph.addCell(new uml.Association(associationData));

            associationIndex++;
        });


        _.each(attributesToBeMarked, function (e) {
            $('.uml-class-attrs-text:eq(' + e.c + ') tspan:eq(' + e.a + ')').each(function () {
                $(this).css('font-weight', 'bold');
            });
        });

        _.each(associationsToBeMarked, function (ai) {
            $('.uml.Association.link > g.labels > g.label > text > tspan:eq(' + ai + ')').each(function () {
                $(this).css('font-weight', 'bolder');
            });
        });

        graphOptions.setLinkVertices = true;
        graphOptions.setVertices = function (link, vertices) {
            vertices = vertices.splice(1, vertices.length - 2);
            link.set('vertices', vertices);
        };
        joint.layout.DirectedGraph.layout(graph, graphOptions);
    }

    function getMultiplicityString(mult) {
        if (mult === 'atLeastOne') {
            return ' [1..*]';
        } else if (mult === 'maximalOne') {
            //return '';
            return ' [0..1]';
        } else if (mult === 'exactlyOne') {
            //return '';
            return ' [1..1]';
        } else {
            return ' [0..*]';
        }
    }
})();
