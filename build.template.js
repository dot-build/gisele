(function(global) {

    /* content goes here */

    var Gisele = {
        Model: Model,
        Field: Field,
        RelationField: RelationField
    };

    if (typeof define === 'function' && define.amd) {
        define(function() { return Gisele; });
    } else if (typeof module !== 'undefined' && module.exports) {
        // explicitly export values so static analysis tools can
        // pick up the names

        module.exports.Model = Model;
        module.exports.Field = Field;
        module.exports.RelationField = RelationField;
    } else {
        global.Gisele = Gisele;
    }

})(this);
