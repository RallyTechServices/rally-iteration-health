Ext.define('Rally.technicalservices.WsapiToolbox',{
    singleton: true,

    fetchDoneStates: function(){
        var deferred = Ext.create('Deft.Deferred');
        Rally.data.ModelFactory.getModel({
            type: 'HierarchicalRequirement',
            success: function(model) {
                var field = model.getField('ScheduleState');
                field.getAllowedValueStore().load({
                    callback: function(records, operation, success) {
                        if (success){
                            var values = [];
                            for (var i=records.length - 1; i > 0; i--){
                                values.push(records[i].get('StringValue'));
                                if (records[i].get('StringValue') == "Accepted"){
                                    i = 0;
                                }
                            }
                            deferred.resolve(values);
                        } else {
                            deferred.reject('Error loading ScheduleState values for User Story:  ' + operation.error.errors.join(','));
                        }
                    },
                    scope: this
                });
            },
            failure: function() {
                var error = "Could not load schedule states";
                deferred.reject(error);
            }
        });
        return deferred.promise;
    },

    fetchWsapiRecords: function(context, model_name, model_fields, filters, sort,  pageSize, limit){
        var deferred = Ext.create('Deft.Deferred');

        limit = limit || 'Infinity';
        pageSize = pageSize || 200;
        sort = sort || [{
                property: 'ObjectID',
                direction: 'DESC'
            }];
        filters = filters || [];

        Ext.create('Rally.data.wsapi.Store', {
            model: model_name,
            fetch: model_fields,
            filter: filters,
            sort: sort,
            limit: limit,
            pageSize: pageSize
        }).load({
            callback : function(records, operation, successful) {
                if (successful){
                    deferred.resolve(records);
                } else {
                    deferred.reject(Ext.String.format('Error loading Store (Model = {0}, Fetch = {1}: {2}',model_name, model_fields, operation.error.errors.join(',')));
                }
            }
        });
        return deferred.promise;
    },
    fetchPreferences: function(appId){
        var deferred = Ext.create('Deft.Deferred');

        if (appId){
            Rally.data.PreferenceManager.load({
                appID: appId,
                success: function(prefs) {
                    deferred.resolve(prefs);
                }
            });
        } else {
            deferred.resolve([]);
        }

        return deferred.promise;
    },
    fetchWsapiCount: function(model, query_filters){
        var deferred = Ext.create('Deft.Deferred');

        var store = Ext.create('Rally.data.wsapi.Store',{
            model: model,
            fetch: ['ObjectID'],
            filters: query_filters,
            limit: 1,
            pageSize: 1
        }).load({
            callback: function(records, operation, success){
                if (success){
                    deferred.resolve(operation.resultSet.totalRecords);
                } else {
                    deferred.reject(Ext.String.format("Error getting {0} count for {1}: {2}", model, query_filters.toString(), operation.error.errors.join(',')));
                }
            }
        });
        return deferred;
    }
});
