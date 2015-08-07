describe("Fast Project Model tests",function(){
    it('should create a store',function(){
        var store = Ext.create('Rally.technicalservices.ProjectStore',{
            data: []
        });
        expect(store.getModelType()).toEqual('Rally.technicalservices.ProjectModel');
        expect(store.getRecords()).toEqual([]);
    });
    
    it('should create a store with items in it',function(){
        var store = Ext.create('Rally.technicalservices.ProjectStore',{
            data: [{
                Name: 'Child',
                ObjectID: 1235,
                parent_id: 1236
            },
            {
                Name: 'Parent',
                ObjectID: 1236,
                parent_id: null
            }]
        });
        store.load(function(){
            expect(store.getModelType()).toEqual('Rally.technicalservices.ProjectModel');
            expect(store.getRecords().length).toEqual(2);
            expect(store.getRecords()[0].get('Name')).toEqual('Child');
        });

    });
});