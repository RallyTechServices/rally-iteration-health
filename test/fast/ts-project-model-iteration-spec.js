describe("Fast Project Model tests for associating with an iteration",function(){
    var wednesday;
    var tuesday;
    var monday;
    var thursday;
    var friday;
    var saturday;
    var sunday;
    
    beforeEach(function () {
        friday = new Date(2013,8,20,0,0,0);
        saturday = new Date(2013,8,21,0,0,0);
        sunday = new Date(2013,8,22,0,0,0);
        monday = new Date(2013,8,23,0,0,0);
        tuesday = new Date(2013,8,24,0,0,0);
        wednesday = new Date(2013,8,25,0,0,0);
        thursday = new Date(2013,8,26,0,0,0);
    });
  
    describe("When associating an Iteration by hash",function(){
       it('should return iteration information',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: monday,
                EndDate: shiftDayBeginningToEnd(wednesday)
            };
            project.addIteration(iteration);

            expect(project.get('iteration_name')).toEqual("Sprint 1");
            expect(project.get('iteration_end_date')).toEqual(shiftDayBeginningToEnd(wednesday));
            expect(project.get('iteration_start_date')).toEqual(monday);
            expect(project.get('number_of_days_in_sprint')).toEqual(3);
        });
    });
    
    describe("When associating an Iteration", function(){
        it('should return iteration information',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = Ext.create('mockIteration',{
                StartDate: monday,
                EndDate: shiftDayBeginningToEnd(wednesday),
                Name: "Sprint 1",
                ObjectID: 8675309
            });
            project.addIteration(iteration);
            
            expect(project.get('iteration_name')).toEqual("Sprint 1");
            expect(project.get('iteration_end_date')).toEqual(shiftDayBeginningToEnd(wednesday));
            expect(project.get('iteration_start_date')).toEqual(monday);
            expect(project.get('number_of_days_in_sprint')).toEqual(3);
        });
        
        it('should return days in iteration excluding weekend',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: friday,
                EndDate: shiftDayBeginningToEnd(tuesday)
            };
            project.addIteration(iteration);
            
            expect(project.get('number_of_days_in_sprint')).toEqual(3);
        });
        
        it('should exclude weekends from all_hash', function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: friday,
                EndDate: shiftDayBeginningToEnd(tuesday)
            };
            project.addIteration(iteration);
            
            expect(project.get('number_of_days_in_sprint')).toEqual(3);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 6, CreationDate: friday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: friday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 1, CreationDate: friday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 3, CreationDate: saturday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: saturday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: saturday });

            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 1, CreationDate: monday });

            project.setIterationCumulativeFlowData([ 
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            
            var all_hash = project.getDailyPlanEstimateTotalByState();
            var all_keys = Ext.Object.getKeys(all_hash);
            expect(all_keys.length).toEqual(2);
        });
        
        it('should exclude days outside the sprint from all_hash', function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Project X',
                ObjectID: 1236
            });
            
            var iteration = {
                Name: 'Sprint 1',
                ObjectID: 8675309,
                StartDate: tuesday,
                EndDate: shiftDayBeginningToEnd(wednesday)
            };
            project.addIteration(iteration);
            
            expect(project.get('number_of_days_in_sprint')).toEqual(2);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 6, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 1, CreationDate: monday });

            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 3, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: tuesday });

            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: thursday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: thursday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 1, CreationDate: thursday });

            project.setIterationCumulativeFlowData([ 
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            
            var all_hash = project.getDailyPlanEstimateTotalByState();
            var all_keys = Ext.Object.getKeys(all_hash);
            expect(all_keys.length).toEqual(1);
        });
    });
    
    
});