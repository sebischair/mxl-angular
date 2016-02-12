(function () {
    var Pos = CodeMirror.Pos;

    function scriptHint(editor, keywords, getToken, options) {
        // Find the token at the cursor
        var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
        token.state = CodeMirror.innerMode(editor.getMode(), token.state).state;

        // If it's not a 'word-style' token, ignore the token.
        if (!/^[\w$_]*$/.test(token.string)) {
            token = tprop = {
                start: cur.ch,
                end: cur.ch,
                string: "",
                state: token.state,
                type: token.string == "." ? "property" : null
            };
        }
        // If it is a property, find out what it is a property of.
        while (tprop.type == "property") {
            tprop = getToken(editor, Pos(cur.line, tprop.start));
            if (tprop.string != ".")
                return;
            tprop = getToken(editor, Pos(cur.line, tprop.start));
            if (tprop.string == ')') {
                var level = 1;
                do {
                    tprop = getToken(editor, Pos(cur.line, tprop.start));
                    switch (tprop.string) {
                        case ')':
                            level++;
                            break;
                        case '(':
                            level--;
                            break;
                        default:
                            break;
                    }
                } while (level > 0);
                tprop = getToken(editor, Pos(cur.line, tprop.start));
                if (tprop.type.indexOf("variable") === 0)
                    tprop.type = "function";
                else
                    tprop.type = "functionapplication";
            }
            if (!context)
                var context = [];
            context.push(tprop);
        }
        return {
            list: getCompletions(token, context, keywords, options, editor),
            from: Pos(cur.line, token.start),
            to: Pos(cur.line, token.end)
        };
    }

    function mxlHint(editor, options) {
        return scriptHint(editor, nonContextualKeywords, function (e, cur) {
            return e.getTokenAt(cur);
        }, options);
    };
    CodeMirror.registerHelper("hint", "mxl", mxlHint);

    function getPreviousTokens(editor, cur) {
        var previousTokens = [];
        CodeMirror.runMode(editor.getValue(), "mxl", function (text, type) {
            if ((type === "variable" || type === "property") && text !== cur) {
                previousTokens.push({
                    name: text,
                    description: 'Previously used.',
                    type: 'previous'
                });
            }
        });
        return previousTokens;
    }

    var nonContextualKeywords = [{
        name: 'if',
        description: 'The conditional evaluates either the if-branch (if the condition evaluates to true) or the else-branch (if the condition evaluates to false).<br/>The result of the conditional construct is the result of the evaluated branch.',
        type: 'keyword',
        helpHeader: '<i>if</i> &lt;condition&gt; then &lt;if-branch&gt; else &lt;else-branch&gt;'
    }, {
        name: 'then',
        description: 'The conditional evaluates either the if-branch (if the condition evaluates to true) or the else-branch (if the condition evaluates to false).<br/>The result of the conditional construct is the result of the evaluated branch.',
        type: 'keyword',
        helpHeader: 'if &lt;condition&gt; <i>then</i> &lt;if-branch&gt; else &lt;else-branch&gt;'
    }, {
        name: 'else',
        description: 'The conditional evaluates either the if-branch (if the condition evaluates to true) or the else-branch (if the condition evaluates to false).<br/>The result of the conditional construct is the result of the evaluated branch.',
        type: 'keyword',
        helpHeader: 'if &lt;condition&gt; then &lt;if-branch&gt; <i>else</i> &lt;else-branch&gt;'
    }, {
        name: 'is',
        description: 'Checks, if the object on the left is of the type on the right',
        type: 'keyword',
        helpHeader: 'Type checking'
    }, {
        name: 'as',
        description: 'Casts the object on the left to an object of the type on the right',
        type: 'keyword',
        helpHeader: 'Type casting'
    }, {
        name: 'null',
        description: 'Represents an empty value or nothing',
        type: 'keyword'
    }, {
        name: 'true',
        description: 'Represents the boolean value <i>true</i>',
        type: 'keyword'
    }, {
        name: 'false',
        description: 'Represents the boolean value <i>false</i>',
        type: 'keyword'
    }, {
        name: 'this',
        description: 'Refers to the current object in the current context, e.g., if implementing a derived attribute, <i>this</i> refers to the instance evaluating the derived attribute.',
        type: 'keyword'
    }, {
        helpHeader: '<i>let</i> &lt;name&gt; = &lt;value&gt; in &lt;scope&gt;',
        name: 'let',
        description: 'Bindes a value to the given identifier',
        type: 'keyword'
    }, {
        name: 'in',
        helpHeader: 'let &lt;name&gt; = &lt;value&gt; <i>in</i> &lt;scope&gt;',
        description: 'Determines the scope, in which the bound value has to be accessible.',
        type: 'keyword'
    }, {
        name: 'find',
        description: 'Retrieves all instances of a specified type.<br/>Basic types (e.g., Number, String, Boolean) are not allowed.',
        type: 'keyword',
        addOpeningBracket: true
    }, {
        name: 'not',
        type: 'keyword',
        helpHeader: 'Logical inversion'
    }, {
        name: 'and',
        helpHeader: 'Logical conjunction',
        type: 'keyword',
        description: 'If the left operand is <i>false</i>, the conjunction returns also <i>false</i>, otherwise the result of the right operand is returned.'
    }, {
        name: 'or',
        description: 'Logical disjunction',
        type: 'keyword',
        description: 'If the left operand is <i>true</i>, the disjunction returns also <i>true</i>, otherwise the result of the right operand is returned.'
    }, {
        name: 'whereis',
        description: 'Reverse navigation through the data model, i.e., returns all instances of the given type referring to the current object via the given relation.',
        type: 'keyword',
        helpHeader: 'get &lt;type&gt; <i>whereis</i> &lt;reverse-relation&gt;'
    }, {
        name: 'ifnull',
        description: 'Returns the left object if it is not null, otherwise returns the right one.',
        type: 'keyword'
    }];

    var contextualKeywords = [{
        name: 'get',
        description: 'Reverse navigation through the data model, i.e., returns all instances of the given type referring to the current object via the given relation.',
        type: 'keyword',
        helpHeader: '<i>get</i> &lt;type&gt; whereis &lt;reverse-relation&gt;'
    }];

    function dateParts() {
        var today = new Date();
        var todayStr = today.toLocaleDateString();
        return [{
            name: 'day',
            description: 'Retrieves the day of month of the date, e.g., ' + today.getDate() + ' when applied on today (' + todayStr + ')',
            type: 'property'
        }, {
            name: 'month',
            description: 'Retrieves the (1-based) month component of the date, e.g., ' + (1 + today.getMonth()) + ' when applied on today (' + todayStr + ')',
            type: 'property'
        }, {
            name: 'year',
            description: 'Retrieves the year component of the date, e.g., ' + today.getFullYear() + ' when applied on today (' + todayStr + ')',
            type: 'property'
        }];
    }

    function getCompletions(token, context, keywords, options, editor) {
        var found = [], start = token.string;

        function notYetFound(h, compareByName) {
            for (var i = 0; i < found.length; i++) {

                if (compareByName && found[i].name === h.name) {
                    return false;
                }
                else if (found[i] === h) {
                    return false;
                }
            }
            return true;
        }


        function addIfFits(hints, alwaysAdd, compareByName) {
            if (hints && (!editor.options.onlyLimitedHints || alwaysAdd)) {
                for (var i = 0; i < hints.length; i++) {
                    var h = hints[i];

                    if (h.name.toLowerCase().indexOf(start.toLowerCase()) == 0 && notYetFound(h, compareByName)) {
                        found.push(h);
                    }
                }
            }
        }

        function compareNames(a, b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();
            if (nameA < nameB) {
                return -1
            }
            if (nameA > nameB) {
                return 1
            }
            return 0;
        }

        var additionalHints = editor.options.additionalAutoCompletionHints;

        if (context) {

            addIfFits(contextualKeywords);
            addIfFits(dateParts());

            if (additionalHints) {
                addIfFits(additionalHints.customTypes, true);
                addIfFits(additionalHints.memberFunctions);
                addIfFits(additionalHints.attributes);
                addIfFits(additionalHints.builtinAttributes);
            }

            addIfFits(getPreviousTokens(editor, start), false, true);

        } else {

            addIfFits(contextualKeywords);
            addIfFits(nonContextualKeywords);
            addIfFits(dateParts());

            if (additionalHints) {
                addIfFits(additionalHints.memberFunctions);
                addIfFits(additionalHints.attributes);
                addIfFits(additionalHints.builtinAttributes);

                addIfFits(additionalHints.staticFunctions);
                addIfFits(additionalHints.basicTypes, true);
                addIfFits(additionalHints.customTypes, true);
                addIfFits(additionalHints.workspaces, true);
                addIfFits(additionalHints.globalIdentifiers);
            }

            addIfFits(getPreviousTokens(editor, start), false, true);
        }

        found.sort(compareNames);

        return found;
    }

})();
