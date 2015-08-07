describe("Fast Utilities tests",function() {
    describe("When working with hashes",function(){
        it('should turn a hash into an array',function() {
            var hash = {
                'a': "fred",
                'b': "mary",
                'c': "olympia"
            }
            var result = Rally.technicalservices.util.Utilities.hashToArray(hash);
            expect(result.length).toEqual(3);
            expect(result[0]).toEqual("fred");
        });
        it('should turn a hash of mixed types into an array',function() {
            var hash = {
                'a': "fred",
                'b': { 'd': 'value', 'e':'other value'},
                'c': null
            }
            var result = Rally.technicalservices.util.Utilities.hashToArray(hash);
            expect(result.length).toEqual(3);
            expect(result[0]).toEqual("fred");
            expect(result[2]).toBe(null);
        });
        
        it('should turn a top node into an ordered array',function() {
            var hash = {
                "ObjectID":0,
                "Name":"Workspace",
                "parent_id":0,
                "id":0,
                "text":"Workspace",
                "children":[{
                    "ObjectID":1,
                    "Name":"Parent",
                    "parent_id":0,
                    "id":1,
                    "text":"Parent",
                    "children":[{
                        "ObjectID":2,
                        "Name":"Child 1",
                        "parent_id":1,
                        "id":2,
                        "text":"Child",
                        "children":[{
                            "ObjectID":3,
                            "Name":"Grandkid",
                            "parent_id":2,
                            "id":3,
                            "text":"Grandkid",
                            "children":[]
                        }]
                    }]
                        
                 },
                 {
                    "ObjectID":1236,
                    "Name":"Parent 2",
                    "parent_id":0,
                    "id":1236,
                    "text":"Parent",
                    "children":[{
                        "ObjectID":1235,
                        "Name":"Child a",
                        "parent_id":1236,
                        "id":1235,
                        "text":"Child",
                        "children":[{
                            "ObjectID":1234,
                            "Name":"Grandkid",
                            "parent_id":1235,
                            "id":1234,
                            "text":"Grandkid",
                            "children":[]
                        },
                        {
                            "ObjectID":1233,
                            "Name":"Grandkid 2",
                            "parent_id":1235,
                            "id":1233,
                            "text":"Grandkid 2",
                            "children":[]
                        }]
                    }]
                }]
            }; 
            var result = Rally.technicalservices.util.Utilities.hashToOrderedArray(hash,"children");
            expect(result.length).toEqual(8);
            expect(result[0].Name).toEqual("Workspace");
            expect(result[1].Name).toEqual("Parent")
            expect(result[2].Name).toEqual("Child 1");
            expect(result[3].Name).toEqual("Grandkid");
            expect(result[4].Name).toEqual("Parent 2");
        });
        
        it('should get a node by ObjectID',function() {
            var hash = {
                "ObjectID":0,
                "Name":"Workspace",
                "parent_id":0,
                "id":0,
                "text":"Workspace",
                "children":[{
                    "ObjectID":1,
                    "Name":"Parent",
                    "parent_id":0,
                    "id":1,
                    "text":"Parent",
                    "children":[{
                        "ObjectID":2,
                        "Name":"Child 1",
                        "parent_id":1,
                        "id":2,
                        "text":"Child",
                        "children":[{
                            "ObjectID":3,
                            "Name":"Grandkid",
                            "parent_id":2,
                            "id":3,
                            "text":"Grandkid",
                            "children":[]
                        }]
                    }]
                        
                 },
                 {
                    "ObjectID":1236,
                    "Name":"Parent 2",
                    "parent_id":0,
                    "id":1236,
                    "text":"Parent",
                    "children":[{
                        "ObjectID":1235,
                        "Name":"Child a",
                        "parent_id":1236,
                        "id":1235,
                        "text":"Child",
                        "children":[{
                            "ObjectID":1234,
                            "Name":"Grandkid",
                            "parent_id":1235,
                            "id":1234,
                            "text":"Grandkid",
                            "children":[]
                        },
                        {
                            "ObjectID":1233,
                            "Name":"Grandkid 2",
                            "parent_id":1235,
                            "id":1233,
                            "text":"Grandkid 2",
                            "children":[]
                        }]
                    }]
                }]
            }; 
            var result = Rally.technicalservices.util.Utilities.getFromHashByField(hash,"ObjectID",1236);
            expect(result.ObjectID).toEqual(1236);
            expect(result.children.length).toEqual(1);
            expect(result.children[0].Name).toEqual('Child a');
            expect(result.children[0].children.length).toEqual(2);
        });
    });
    describe("When working with time",function(){
        it('should count the number of days as zero on the same day',function() {
            
            // 8th Month is September because Jan is 0
            var date1 = new Date(2013,08,09,0,0,0);
            var date2 = new Date(2013,08,09,23,59,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2) ).toEqual(0);
        });
        
        it('should count the number of days as 1 on the different days',function() {
            
            var date1 = new Date(2013,08,09,23,59,0);
            var date2 = new Date(2013,08,10,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2) ).toEqual(1);
        });
        
        it('should count the number of days between two dates',function() {
            
            var date1 = new Date(2013,08,09,0,0,0);
            var date2 = new Date(2013,08,10,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2) ).toEqual(1);
        });
        
        it('should always return a positive number when counting the number of days between two dates',function() {
            
            var date2 = new Date(2013,08,09,0,0,0);
            var date1 = new Date(2013,08,10,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2) ).toEqual(1);
        });
        
        it('should count weekends in date difference',function() {
            
            var date1 = new Date(2013,08,06,0,0,0);
            var date2 = new Date(2013,08,09,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2,false) ).toEqual(3);
        });
        
        it('should not count weekends in date difference',function() {
            
            var date1 = new Date(2013,08,06,0,0,0);
            var date2 = new Date(2013,08,09,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2,true) ).toEqual(1);
        });
        
        it('should not count weekends in date difference across two weekends',function() {
            
            var date1 = new Date(2013,08,04,0,0,0);
            var date2 = new Date(2013,08,18,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2,true) ).toEqual(10);
        });  
        
        it('should return 0 when on a Saturday and not counting weekends in date difference',function() {
            
            var date1 = new Date(2013,08,07,0,0,0);
            var date2 = new Date(2013,08,08,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2,true) ).toEqual(0);
        });
        
        it('should not stumble on leap day',function() {
            
            var date1 = new Date(2014,01,27,0,0,0);
            var date2 = new Date(2014,02,13,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date1,date2,true) ).toEqual(10);
        });
                        
        it('should not care starting and ending on sunday',function() {
            
            var date1 = new Date(2014,02,09,0,0,0);
            var date2 = new Date(2014,02,23,0,0,0);
            
            expect( Rally.technicalservices.util.Utilities.daysBetween(date2,date1,true) ).toEqual(10);
        });
    });
});
