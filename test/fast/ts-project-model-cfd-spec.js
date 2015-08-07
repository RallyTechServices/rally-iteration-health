describe("Fast Project Model tests for ICFD health",function(){
    var wednesday;
    var tuesday;
    var monday;
    var thursday;
    var friday;
    var saturday;
    var sunday;
    
    beforeEach(function () {
        friday = new Date(2013,8,20);
        saturday = new Date(2013,8,21);
        sunday = new Date(2013,8,22);
        monday = new Date(2013,8,23);
        tuesday = new Date(2013,8,24);
        wednesday = new Date(2013,8,25);
        thursday = new Date(2013,8,26);
    });
  
    describe("When adding ICFD data", function(){
        it('should reset health measures',function() {
            var child = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            var parent = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Parent',
                ObjectID: 1236
            });
            
            parent.addChild(child);
            
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            
            parent.setIterationCumulativeFlowData([ accepted_day_1,in_p_day_1,defined_day_1]);
            child.setIterationCumulativeFlowData([ accepted_day_1,in_p_day_1,defined_day_1]);
            
            parent.resetHealth();
            child.resetHealth();
            expect(child.get('health_ratio_in_progress')).toEqual(0);
            expect(parent.get('health_ratio_in_progress')).toEqual(-1);
            expect(child.get('health_half_accepted_ratio')).toEqual(2);
            expect(parent.get('health_half_accepted_ratio')).toEqual(-1);
            expect(child.get('health_half_accepted_date')).toEqual(null);
            expect(parent.get('health_half_accepted_date')).toEqual(null);
            expect(child.get('health_end_incompletion_ratio')).toEqual(2);
            expect(parent.get('health_end_incompletion_ratio')).toEqual(-1);
            expect(child.get('health_end_acceptance_ratio')).toEqual(2);
            expect(parent.get('health_end_acceptance_ratio')).toEqual(-1);
        });
    });
    
    describe("When adding ICFD data to projects calculate daily totals",function(){
        it('should provide the defaults when no CFD provided',function(){
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            project.setIterationCumulativeFlowData([]);
            
            expect(project.get('health_ratio_in_progress')).toEqual(0);
            expect(project.get('health_half_accepted_ratio')).toEqual(2);
            expect(project.get('health_half_accepted_date')).toEqual(null);
            expect(project.get('health_end_incompletion_ratio')).toEqual(2);
            expect(project.get('health_end_acceptance_ratio')).toEqual(2);
        });
        
        it('should provide the defaults when CFD has no sizes provided',function(){
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            // Day 1
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 0, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: monday });
            // Day 2
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 0, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: tuesday });
            // Day 3 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 0, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            
            expect(project.get('health_ratio_in_progress')).toEqual(0);
            expect(project.get('health_half_accepted_ratio')).toEqual(2);
            expect(project.get('health_half_accepted_date')).toEqual(null);
            expect(project.get('health_end_completion_ratio')).toEqual(2);
            expect(project.get('health_end_acceptance_ratio')).toEqual(2);
        });
        
        it('should determine total daily plan estimates',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 20% in progress
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2, 40% in progress
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 2, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 4, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: tuesday });
            // Day 3, 15% in progress 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 8, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            
            var expected_daily_totals = {};
            expected_daily_totals[monday] = 5;
            expected_daily_totals[tuesday] = 10;
            expected_daily_totals[wednesday] = 11
            
            expect(project.getDailyPlanEstimateTotalByState()).toEqual(expected_daily_totals);
            
            var expected_daily_progress_totals = {};
            expected_daily_progress_totals[monday] = 1;
            expected_daily_progress_totals[tuesday] = 4;
            expected_daily_progress_totals[wednesday] = 3;
            
            expect(project.getDailyPlanEstimateTotalByState('In-Progress')).toEqual(expected_daily_progress_totals);
        });
        
        it('should determine total daily task estimates',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 20% in progress
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Completed', TaskEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', TaskEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', TaskEstimateTotal: 4, CreationDate: monday });
            // Day 2, 40% in progress
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Completed', TaskEstimateTotal: 2, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', TaskEstimateTotal: 4, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', TaskEstimateTotal: 4, CreationDate: tuesday });
            // Day 3, 15% in progress 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Completed', TaskEstimateTotal: 8, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', TaskEstimateTotal: 3, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', TaskEstimateTotal: 0, CreationDate: wednesday });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            
            var expected_daily_totals = {};
            expected_daily_totals[monday] = 5;
            expected_daily_totals[tuesday] = 10;
            expected_daily_totals[wednesday] = 11
            
            expect(project.getDailyTaskEstimateTotalByState()).toEqual(expected_daily_totals);
            
            var expected_daily_progress_totals = {};
            expected_daily_progress_totals[monday] = 1;
            expected_daily_progress_totals[tuesday] = 4;
            expected_daily_progress_totals[wednesday] = 3;
            
            expect(project.getDailyTaskEstimateTotalByState('In-Progress')).toEqual(expected_daily_progress_totals);
        });
        
    });
    
    describe("When adding ICFD data to projects to calculate daily in-progress",function(){
        it('should determine average daily plan estimates',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 20% in progress
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2, 40% in progress
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 2, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 4, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: tuesday });
            // Day 3, 15% in progress 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 17, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_ratio_in_progress')).toEqual(0.25);
        });

        it('should not calculate a ratio for parents',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Parent',
                ObjectID: 1235
            });
            
            var child = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1234
            });
            
            project.addChild(child);
            
            // Day 1, 20% in progress
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            
            project.setIterationCumulativeFlowData([ accepted_day_1,in_p_day_1,defined_day_1]);
            expect(project.get('health_ratio_in_progress')).toEqual(-1);
            
        });
    });
    
    describe("When adding ICFD data to projects to calculate acceptance rate",function(){
        it('should determine day count for half accepted',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: tuesday });
            // Day 3, a lot accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 17, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });

            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(0.67);
            expect(project.get('health_half_accepted_date')).toEqual(tuesday);
        });
        
        it('should determine day count for half accepted when given total days in sprint and discounting weekends',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            project.set('number_of_days_in_sprint',6);
            
            var friday = new Date(2013,8,20);
            var saturday = new Date(2013,8,21);
            var sunday = new Date(2013,8,22);
            var monday = new Date(2013,8,23);
            
            project.set('number_of_days_in_sprint',6);
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: friday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: friday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: friday });
            // Day 2, weekend 1
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: saturday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: saturday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: saturday });
            // Day 3, weekend 2
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: sunday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: sunday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: sunday });
            // Day 4, 50% accepted (day 2)
            var accepted_day_4 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: monday });
            var in_p_day_4 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_4 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: monday });

            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3,
                accepted_day_4,in_p_day_4,defined_day_4
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(0.33);
            expect(project.get('health_half_accepted_date')).toEqual(monday);
        });
        
        it('should determine day count for half accepted when given total days in sprint',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            project.set('number_of_days_in_sprint',6);
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: tuesday });
            // Day 3, a lot accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 17, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });

            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(0.33);
            expect(project.get('health_half_accepted_date')).toEqual(tuesday);
        });
        
        
        it('should determine day count for half accepted then unaccepted',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: tuesday });
            // Day 3, 0% accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            // Day 4, 75% accepted
            var accepted_day_4 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 3, CreationDate: thursday });
            var in_p_day_4 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: thursday });
            var defined_day_4 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: thursday });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3,
                accepted_day_4,in_p_day_4,defined_day_4
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(1);
            expect(project.get('health_half_accepted_date')).toEqual(thursday);
        });

        it('should return 2 if not 50% accepted',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: tuesday });
            // Day 3, 0% accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            // Day 4, 75% accepted
            var accepted_day_4 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: thursday });
            var in_p_day_4 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: thursday });
            var defined_day_4 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: thursday });
            
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3,
                accepted_day_4,in_p_day_4,defined_day_4
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(2);
            expect(project.get('health_half_accepted_date')).toEqual(null);
        });
        
        it('should determine day count for half accepted (when assuming number of days from flow)',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1, 0 accepted
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 5, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2, 50% accepted
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 4, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 3, CreationDate: tuesday });
            // Day 3, a lot accepted
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 17, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 3, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_half_accepted_ratio')).toEqual(0.33);
            expect(project.get('health_half_accepted_date')).toEqual(monday);
        });
    });
    
    describe("When adding ICFD data to projects to calculate end (in)completion ratio",function(){
        it('should determine ratio of items not completed at end',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var completed_day_1 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 1, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 2, CreationDate: tuesday });
            var completed_day_2 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 1, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 4, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: tuesday });
            // Day 3 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 10, CreationDate: wednesday });
            var completed_day_3 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 10, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 10, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,completed_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,completed_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,completed_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_end_incompletion_ratio')).toEqual(0.33);
            expect(project.get('health_end_completion_ratio')).toEqual(0.67);
        });
        it('should determine ratio of items not completed at end when an additional final state exists',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235,
                FinalState: 'Finished'
            });
            
            // Day 1
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var completed_day_1 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 1, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            var finished_day_1 = Ext.create('mockCFD',{ CardState:'Finished', CardEstimateTotal: 0, CreationDate: monday });
            // Day 2
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 2, CreationDate: tuesday });
            var completed_day_2 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 1, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 4, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: tuesday });
            var finished_day_2 = Ext.create('mockCFD',{ CardState:'Finished', CardEstimateTotal: 0, CreationDate: tuesday });
            // Day 3 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 10, CreationDate: wednesday });
            var completed_day_3 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 10, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 10, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            var finished_day_3 = Ext.create('mockCFD',{ CardState:'Finished', CardEstimateTotal: 10, CreationDate: wednesday });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,completed_day_1,in_p_day_1,defined_day_1,finished_day_1,
                accepted_day_2,completed_day_2,in_p_day_2,defined_day_2,finished_day_2,
                accepted_day_3,completed_day_3,in_p_day_3,defined_day_3,finished_day_3
            ]);
            expect(project.get('health_end_incompletion_ratio')).toEqual(0.25);
            expect(project.get('health_end_completion_ratio')).toEqual(0.75);
        });
        
    });

    describe("When adding ICFD data to projects to calculate end acceptance ratio",function(){
        it('should determine ratio of items accepted at end',function() {
            var project = Ext.create('Rally.technicalservices.ProjectModel',{
                Name: 'Child',
                ObjectID: 1235
            });
            
            // Day 1
            var accepted_day_1 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 0, CreationDate: monday });
            var completed_day_1 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 1, CreationDate: monday });
            var in_p_day_1 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 1, CreationDate: monday });
            var defined_day_1 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: monday });
            // Day 2
            var accepted_day_2 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 2, CreationDate: tuesday });
            var completed_day_2 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 1, CreationDate: tuesday });
            var in_p_day_2 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 4, CreationDate: tuesday });
            var defined_day_2 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 4, CreationDate: tuesday });
            // Day 3 
            var accepted_day_3 = Ext.create('mockCFD',{ CardState:'Accepted', CardEstimateTotal: 2, CreationDate: wednesday });
            var completed_day_3 = Ext.create('mockCFD',{ CardState:'Completed', CardEstimateTotal: 2, CreationDate: wednesday });
            var in_p_day_3 = Ext.create('mockCFD',{ CardState:'In-Progress', CardEstimateTotal: 4, CreationDate: wednesday });
            var defined_day_3 = Ext.create('mockCFD',{ CardState:'Defined', CardEstimateTotal: 0, CreationDate: wednesday });
            
            project.setIterationCumulativeFlowData([
                accepted_day_1,completed_day_1,in_p_day_1,defined_day_1,
                accepted_day_2,completed_day_2,in_p_day_2,defined_day_2,
                accepted_day_3,completed_day_3,in_p_day_3,defined_day_3
            ]);
            expect(project.get('health_end_acceptance_ratio')).toEqual(0.25);
        });
    });
});
