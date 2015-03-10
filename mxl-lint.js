(function (mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
        mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
        define(["../../lib/codemirror"], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function (CodeMirror) {
    "use strict";

    CodeMirror.registerHelper("lint", "mxl", function (text, passOptions, cm, currentError) {
        var found = [];

        if (currentError && currentError.statusCode >= 400 && currentError.cause.indexOf("MxL") == 0) {
            var lastLine = cm.doc.lineCount() - 1;
            var lastCol = cm.doc.getLine(lastLine).length - 1;
            var range = currentError.additionalInformation ?
                {
                    fromLine: currentError.additionalInformation.from.line - 1,
                    fromCol: currentError.additionalInformation.from.column - 1,
                    toLine: currentError.additionalInformation.to.line - 1,
                    toCol: currentError.additionalInformation.to.column
                } :
                {
                    fromLine: lastLine,
                    fromCol: lastCol,
                    toLine: lastLine,
                    toCol: lastCol
                };

            found.push({
                from: CodeMirror.Pos(range.fromLine, range.fromCol),
                to: CodeMirror.Pos(range.toLine, range.toCol),
                message: currentError.message,
                severity: currentError.cause === "MxLEvaluationException" ? "warning" : "error"
            });
        }

        return found;
    });

});